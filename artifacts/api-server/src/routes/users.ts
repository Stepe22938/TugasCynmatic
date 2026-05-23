import { Router } from "express";
import { db } from "@workspace/db";
import { users } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// ─── GET ALL USERS (lightweight — excludes heavy JSON arrays) ──────────────
router.get("/", async (req, res) => {
  try {
    // Only select columns needed for list views. Heavy JSON arrays are loaded on login.
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      avatar: users.avatar,
      isVerifiedSeller: users.isVerifiedSeller,
      isVerifiedReseller: users.isVerifiedReseller,
      coins: users.coins,
      balance: users.balance,
      points: users.points,
      isBanned: users.isBanned,
      banReason: users.banReason,
      banType: users.banType,
      banExpiry: users.banExpiry,
      friends: users.friends,
      friendRequests: users.friendRequests,
      sentRequests: users.sentRequests,
      referralCode: users.referralCode,
      referredBy: users.referredBy,
      sultanBadgeColor: users.sultanBadgeColor,
      sultanGlowEffect: users.sultanGlowEffect,
      sultanCustomTag: users.sultanCustomTag,
      isSultan: users.isSultan,
      sultanExpiry: users.sultanExpiry,
      isMyCryptoMember: users.isMyCryptoMember,
      myCryptoExpiry: users.myCryptoExpiry,
      bio: users.bio,
      theme: users.theme,
      youtubeId: users.youtubeId,
      useAnimation: users.useAnimation,
      profileLayout: users.profileLayout,
      myCoinNft: users.myCoinNft,
      balanceBtc: users.balanceBtc,
      balanceEth: users.balanceEth,
      balanceUsdt: users.balanceUsdt,
      wishlist: users.wishlist,
      createdAt: users.createdAt,
    }).from(users);
    res.json(allUsers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET SINGLE USER (FULL DATA — includes walletTransactions etc.) ──────────
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Skip if id looks like a sub-route keyword
    if (["sync", "login", "register", "reset-all"].includes(id)) {
      return res.status(404).json({ error: "Not found" });
    }
    const result = await db.select().from(users).where(eq(users.id, id));
    if (!result.length) return res.status(404).json({ error: "User not found" });
    res.json(result[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── UPSERT USER (SYNC) ────────────────────────────────────────────────────
router.post("/sync", async (req, res) => {
  try {
    const u = req.body;
    if (!u.id) return res.status(400).json({ error: "User ID required" });

    const coinsValue = Math.floor(Number(u.coins || 0));
    const ensureJson = (v: any) => {
      if (!v) return [];
      if (typeof v === "string") { try { return JSON.parse(v); } catch { return []; } }
      return v;
    };

    const payload = {
      id: u.id,
      name: u.name || "Unknown",
      email: u.email,
      password: u.password,
      role: u.role || "user",
      isVerifiedSeller: !!u.isVerifiedSeller,
      isVerifiedReseller: !!u.isVerifiedReseller,
      coins: coinsValue,
      balance: String(u.balance || 0),
      points: Number(u.points || 0),
      friends: ensureJson(u.friends),
      friendRequests: ensureJson(u.friendRequests),
      sentRequests: ensureJson(u.sentRequests),
      referralCode: u.referralCode,
      referredBy: u.referredBy,
      isBanned: !!u.isBanned,
      banReason: u.banReason,
      banType: u.banType,
      banExpiry: u.banExpiry ? new Date(u.banExpiry) : null,
      activityLog: ensureJson(u.activityLog),
      purchaseHistory: ensureJson(u.purchaseHistory),
      ownedCosmetics: ensureJson(u.ownedCosmetics),
      equippedCosmetics: ensureJson(u.equippedCosmetics),
      walletTransactions: ensureJson(u.walletTransactions),
      wishlist: ensureJson(u.wishlist),
      sultanBadgeColor: u.sultanBadgeColor,
      sultanGlowEffect: !!u.sultanGlowEffect,
      sultanCustomTag: u.sultanCustomTag,
      isSultan: !!u.isSultan,
      sultanExpiry: u.sultanExpiry ? new Date(u.sultanExpiry) : null,
      isMyCryptoMember: !!u.isMyCryptoMember,
      myCryptoExpiry: u.myCryptoExpiry ? new Date(u.myCryptoExpiry) : null,
      bio: u.bio,
      theme: u.theme,
      youtubeId: u.youtubeId,
      useAnimation: !!u.useAnimation,
      profileLayout: u.profileLayout || "premium",
      avatar: u.avatar,
      myCoinNft: String(u.myCoinNft ?? "0"),
      balanceBtc: String(u.balanceBtc ?? "1.42"),
      balanceEth: String(u.balanceEth ?? "8.50"),
      balanceUsdt: String(u.balanceUsdt ?? "500.00"),
    };

    await db.insert(users).values(payload).onDuplicateKeyUpdate({ set: payload });

    console.log(`[SYNC] OK user=${u.id} coins=${coinsValue}`);
    res.json({ success: true });
  } catch (error: any) {
    console.error("[SYNC] ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── LOGIN ─────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password diperlukan" });
    }

    const found = await db.select().from(users)
      .where(eq(users.email, email.toLowerCase().trim()));

    if (found.length === 0) {
      return res.status(401).json({ error: "Akun tidak ditemukan di database" });
    }

    const user = found[0];

    if (user.password !== password) {
      return res.status(401).json({ error: "Password salah" });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: `Akun ditangguhkan: ${user.banReason || "Pelanggaran Ketentuan"}` });
    }

    console.log(`[AUTH] Login OK: ${user.name} (${user.role})`);
    res.json(user);
  } catch (error: any) {
    console.error("[AUTH] Login Error:", error);
    res.status(500).json({ error: "Gagal terhubung ke database MariaDB: " + error.message });
  }
});

// ─── REGISTER ──────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const u = req.body;
    if (!u.email || !u.password || !u.name) {
      return res.status(400).json({ error: "Nama, email, dan password wajib diisi" });
    }

    const trimEmail = u.email.toLowerCase().trim();

    if (trimEmail === "admin@cynmatic.com") {
      return res.status(403).json({ error: "Email ini telah diabadikan untuk Sang Legenda. Demi menghormati sejarah Cynmatic, Anda tidak diperkenankan mendaftar dengan email ini." });
    }

    // Check existing
    const existing = await db.select({ id: users.id })
      .from(users).where(eq(users.email, trimEmail));

    if (existing.length > 0) {
      return res.status(409).json({ error: "Email sudah terdaftar" });
    }

    await db.insert(users).values({
      id: u.id || `user-${Date.now()}`,
      name: u.name.trim(),
      email: trimEmail,
      password: u.password,
      role: "user",
      coins: Number(u.coins || 20000),
      balance: "0",
      points: 0,
      friends: [],
      friendRequests: [],
      sentRequests: [],
      referralCode: u.referralCode,
      referredBy: u.referredBy,
      isBanned: false,
      activityLog: [],
      purchaseHistory: [],
      ownedCosmetics: [],
      equippedCosmetics: [],
      walletTransactions: [],
      profileLayout: "premium",
    });

    // Return the new user
    const created = await db.select().from(users).where(eq(users.email, trimEmail));
    console.log(`[REGISTER] New user: ${u.name} (${trimEmail})`);
    res.json(created[0]);
  } catch (error: any) {
    console.error("[REGISTER] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── DELETE USER BY ID ─────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(users).where(eq(users.id, id));
    console.log(`[DELETE] User deleted: ${id}`);
    res.json({ success: true, deleted: id });
  } catch (error: any) {
    console.error("[DELETE] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── RESET ALL USERS (keep specific emails) ────────────────────────────────
router.post("/reset-all", async (req, res) => {
  try {
    const { keepEmails } = req.body as { keepEmails?: string[] };

    if (keepEmails && keepEmails.length > 0) {
      // Delete all users EXCEPT the ones in keepEmails
      const allUsersRows = await db.select({ id: users.id, email: users.email }).from(users);
      const toDelete = allUsersRows.filter(u => !keepEmails.map(e => e.toLowerCase()).includes((u.email ?? "").toLowerCase()));
      let deleted = 0;
      for (const u of toDelete) {
        await db.delete(users).where(eq(users.id, u.id));
        deleted++;
      }
      console.log(`[RESET] Deleted ${deleted} users. Kept: ${keepEmails.join(", ")}`);
      res.json({ success: true, message: `Deleted ${deleted} users. Kept: ${keepEmails.join(", ")}` });
    } else {
      // Delete ALL users then seed defaults
      await db.delete(users);
      console.log("[RESET] All users deleted.");

    const seeds = [
      {
        id: "admin-001", name: "Cynmatic Admin", email: "admin@cynmatic.com",
        password: "admin", role: "admin" as const,
        coins: 1000000, balance: "1000000", points: 10000,
        isVerifiedSeller: true, isVerifiedReseller: false,
        isBanned: false, banReason: null, banType: null, banExpiry: null,
        friends: [], friendRequests: [], sentRequests: [],
        activityLog: [], purchaseHistory: [], ownedCosmetics: [], equippedCosmetics: [], walletTransactions: [],
        referralCode: "CYN-ADMIN", referredBy: null,
        bio: "Administrator Cynmatic", theme: "from-yellow-600 to-amber-900",
        youtubeId: null, useAnimation: false, profileLayout: "premium" as const, avatar: null,
        isMyCryptoMember: false, myCryptoExpiry: null,
        sultanBadgeColor: null, sultanGlowEffect: false, sultanCustomTag: null, isSultan: false, sultanExpiry: null,
      },
      {
        id: "seller-001", name: "Cynmatic Seller", email: "seller@cynmatic.com",
        password: "seller", role: "seller" as const,
        coins: 50000, balance: "500000", points: 1000,
        isVerifiedSeller: true, isVerifiedReseller: false,
        isBanned: false, banReason: null, banType: null, banExpiry: null,
        friends: [], friendRequests: [], sentRequests: [],
        activityLog: [], purchaseHistory: [], ownedCosmetics: [], equippedCosmetics: [], walletTransactions: [],
        referralCode: "CYN-SELLER", referredBy: null,
        bio: "Official Cynmatic Seller", theme: "from-green-600 to-teal-900",
        youtubeId: null, useAnimation: false, profileLayout: "premium" as const, avatar: null,
        isMyCryptoMember: false, myCryptoExpiry: null,
        sultanBadgeColor: null, sultanGlowEffect: false, sultanCustomTag: null, isSultan: false, sultanExpiry: null,
      },
      {
        id: "kurir-001", name: "Cynmatic Kurir", email: "kurir@cynmatic.com",
        password: "kurir", role: "kurir" as const,
        coins: 20000, balance: "0", points: 500,
        isVerifiedSeller: false, isVerifiedReseller: false,
        isBanned: false, banReason: null, banType: null, banExpiry: null,
        friends: [], friendRequests: [], sentRequests: [],
        activityLog: [], purchaseHistory: [], ownedCosmetics: [], equippedCosmetics: [], walletTransactions: [],
        referralCode: "CYN-KURIR", referredBy: null,
        bio: "Kurir resmi Cynmatic", theme: "from-blue-600 to-indigo-900",
        youtubeId: null, useAnimation: false, profileLayout: "premium" as const, avatar: null,
        isMyCryptoMember: false, myCryptoExpiry: null,
        sultanBadgeColor: null, sultanGlowEffect: false, sultanCustomTag: null, isSultan: false, sultanExpiry: null,
      },
      {
        id: "user-001", name: "Cynmatic User", email: "user@cynmatic.com",
        password: "user", role: "user" as const,
        coins: 20000, balance: "0", points: 100,
        isVerifiedSeller: false, isVerifiedReseller: false,
        isBanned: false, banReason: null, banType: null, banExpiry: null,
        friends: [], friendRequests: [], sentRequests: [],
        activityLog: [], purchaseHistory: [], ownedCosmetics: [], equippedCosmetics: [], walletTransactions: [],
        referralCode: "CYN-TESTUS", referredBy: null,
        bio: "Member Cynmatic", theme: "from-violet-600 to-indigo-900",
        youtubeId: null, useAnimation: false, profileLayout: "premium" as const, avatar: null,
        isMyCryptoMember: false, myCryptoExpiry: null,
        sultanBadgeColor: null, sultanGlowEffect: false, sultanCustomTag: null, isSultan: false, sultanExpiry: null,
      },
    ];

    for (const u of seeds) {
      await db.insert(users).values(u);
    }

    console.log("[RESET] Seeded 4 fresh accounts.");
    res.json({ success: true, message: "Database reset. 4 fresh accounts created.", accounts: seeds.map(u => ({ email: u.email, password: u.password, role: u.role })) });
    } // end else
  } catch (error: any) {
    console.error("[RESET] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
