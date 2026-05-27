import { Router } from "express";
import { db } from "@workspace/db";
import { gachaRewards, users } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// --- 1. Fetch active rewards for frontend ---
router.get("/rewards", async (req, res) => {
  try {
    const rewards = await db
      .select()
      .from(gachaRewards)
      .where(eq(gachaRewards.isActive, true));
    res.json(rewards);
  } catch (error: any) {
    console.error("[GACHA] Fetch rewards failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- 2. Gacha Spin! ---
router.post("/spin", async (req, res) => {
  try {
    const { userId, type, excludedItemIds, spunItemIds, count, eventType } = req.body as {
      userId: string;
      type: "standard" | "faded";
      excludedItemIds?: number[];
      spunItemIds?: number[];
      count?: number; // 1 or 5 for standard
      eventType?: "mystery" | "royale" | "faded";
    };

    if (!userId) {
      res.status(400).json({ error: "User ID wajib diisi." });
      return;
    }

    // Get user details
    const userRows = await db.select().from(users).where(eq(users.id, userId));
    if (userRows.length === 0) {
      res.status(404).json({ error: "User tidak ditemukan." });
      return;
    }
    const user = userRows[0];

    // Determine cost
    let cost = 0;
    const spinCount = count || 1;

    if (type === "faded") {
      const fadedCosts = [19, 39, 99, 199, 399, 599, 799, 999];
      const spunCount = spunItemIds ? spunItemIds.length : 0;
      cost = fadedCosts[Math.min(spunCount, fadedCosts.length - 1)];
    } else {
      // standard standard
      cost = spinCount === 5 ? 45 : 10; // 5 spins discounted to 45!
    }

    if (Number(user.coins || 0) < cost) {
      res.status(400).json({ error: "Koin Toko tidak cukup! Silakan main minigames atau topup." });
      return;
    }

    // Fetch pool of rewards
    const targetEvent = eventType || (type === "faded" ? "faded" : "royale");
    const allRewards = await db
      .select()
      .from(gachaRewards)
      .where(
        and(
          eq(gachaRewards.isActive, true),
          eq(gachaRewards.eventType, targetEvent)
        )
      );

    if (allRewards.length === 0) {
      res.status(400).json({ error: `Tidak ada hadiah gacha aktif untuk kategori "${targetEvent}" saat ini.` });
      return;
    }

    // Filter rewards based on type
    let pool = [...allRewards];
    if (type === "faded") {
      const excluded = excludedItemIds || [];
      const spun = spunItemIds || [];
      pool = allRewards.filter(
        (r) => !excluded.includes(r.id) && !spun.includes(r.id)
      );
      if (pool.length === 0) {
        res.status(400).json({ error: "Semua hadiah roda faded sudah kamu dapatkan! Silakan reset." });
        return;
      }
    }

    // Weighted random selection helper
    const pickWeighted = (list: typeof allRewards) => {
      const totalWeight = list.reduce((sum, r) => sum + Number(r.chance), 0);
      let random = Math.random() * totalWeight;
      for (const r of list) {
        if (random < Number(r.chance)) {
          return r;
        }
        random -= Number(r.chance);
      }
      return list[list.length - 1];
    };

    // Spin!
    const wonRewards: typeof allRewards = [];
    for (let i = 0; i < spinCount; i++) {
      if (pool.length === 0) break;
      const won = pickWeighted(pool);
      wonRewards.push(won);
      
      // If faded wheel, ensure won item is removed from subsequent selections in a multi-spin (if any)
      if (type === "faded") {
        pool = pool.filter((r) => r.id !== won.id);
      }
    }

    // Deduct coins & award prizes
    let nextCoins = Number(user.coins || 0) - cost;
    let nextPoints = Number(user.points || 0);
    
    const ensureJsonArray = (v: any): any[] => {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      if (typeof v === "string") {
        try {
          const parsed = JSON.parse(v);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    const ownedCosmeticsList = ensureJsonArray(user.ownedCosmetics);
    const purchaseHistoryList = ensureJsonArray(user.purchaseHistory);

    for (const r of wonRewards) {
      if (r.type === "coins") {
        nextCoins += Number(r.value);
      } else if (r.type === "points") {
        nextPoints += Number(r.value);
      } else if (r.type === "custom_badge" || r.type === "item") {
        const hasCosmetic = ownedCosmeticsList.some((c: any) => c.id === r.value || c === r.value);
        if (!hasCosmetic) {
          ownedCosmeticsList.push({
            id: r.value,
            name: r.name,
            type: r.type === "custom_badge" ? "badge" : "item",
            acquiredAt: new Date().toISOString()
          });
        }
        purchaseHistoryList.push({
          itemId: r.value,
          itemName: r.name,
          price: 0,
          coins: cost,
          date: new Date().toISOString(),
          type: "gacha"
        });
      }
    }

    // Update user row
    await db
      .update(users)
      .set({
        coins: nextCoins,
        points: nextPoints,
        ownedCosmetics: ownedCosmeticsList,
        purchaseHistory: purchaseHistoryList
      })
      .where(eq(users.id, userId));

    res.json({
      success: true,
      cost,
      coinsLeft: nextCoins,
      pointsLeft: nextPoints,
      won: spinCount === 1 ? wonRewards[0] : wonRewards
    });
  } catch (error: any) {
    console.error("[GACHA] Spin failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- ADMIN ROUTES (Rewards CRUD) ---

// Get all rewards for admin panel
router.get("/admin/rewards", async (req, res) => {
  try {
    const rewards = await db.select().from(gachaRewards);
    res.json(rewards);
  } catch (error: any) {
    console.error("[GACHA ADMIN] Fetch all failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create new reward
router.post("/admin/rewards", async (req, res) => {
  try {
    const { name, type, value, tier, chance, image, isActive, eventType } = req.body as {
      name: string;
      type: string;
      value: string;
      tier: string;
      chance: number;
      image?: string;
      isActive?: boolean;
      eventType?: string;
    };

    if (!name || !type || !value || !tier || chance === undefined) {
      res.status(400).json({ error: "Kolom nama, tipe, nilai, tier, dan persentase chance wajib diisi." });
      return;
    }

    const payload = {
      name,
      type,
      value,
      tier,
      chance: String(chance),
      image: image || "",
      isActive: isActive !== false,
      eventType: eventType || "royale"
    };

    const insertResult = await db.insert(gachaRewards).values(payload);
    res.json({ success: true, rewardId: insertResult[0].insertId });
  } catch (error: any) {
    console.error("[GACHA ADMIN] Create failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update existing reward
router.put("/admin/rewards/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, value, tier, chance, image, isActive, eventType } = req.body as {
      name?: string;
      type?: string;
      value?: string;
      tier?: string;
      chance?: number;
      image?: string;
      isActive?: boolean;
      eventType?: string;
    };

    const patch: any = {};
    if (name !== undefined) patch.name = name;
    if (type !== undefined) patch.type = type;
    if (value !== undefined) patch.value = value;
    if (tier !== undefined) patch.tier = tier;
    if (chance !== undefined) patch.chance = String(chance);
    if (image !== undefined) patch.image = image;
    if (isActive !== undefined) patch.isActive = isActive;
    if (eventType !== undefined) patch.eventType = eventType;

    await db.update(gachaRewards).set(patch).where(eq(gachaRewards.id, Number(id)));
    res.json({ success: true });
  } catch (error: any) {
    console.error("[GACHA ADMIN] Update failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete reward
router.delete("/admin/rewards/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(gachaRewards).where(eq(gachaRewards.id, Number(id)));
    res.json({ success: true });
  } catch (error: any) {
    console.error("[GACHA ADMIN] Delete failed:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
