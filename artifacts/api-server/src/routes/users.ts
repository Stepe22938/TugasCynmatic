import { Router } from "express";
import { db } from "@workspace/db";
import { users } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Get all users
router.get("/", async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update or Create user (Upsert)
router.post("/sync", async (req, res) => {
  try {
    const userData = req.body;
    console.log(`[SYNC] Received data for user: ${userData.name} (Coins: ${userData.coins})`);
    
    if (!userData.id) return res.status(400).json({ error: "User ID required" });

    // Ensure coins is a valid number
    // Match the schema mode: "number"
    const coinsValue = Math.floor(Number(userData.coins || 0));

    const result = await db.insert(users).values({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'user',
      isVerifiedSeller: !!userData.isVerifiedSeller,
      isVerifiedReseller: !!userData.isVerifiedReseller,
      coins: coinsValue,
      balance: (userData.balance || 0).toString(),
      points: userData.points || 0,
      activityLog: userData.activityLog || [],
      purchaseHistory: userData.purchaseHistory || [],
      ownedCosmetics: userData.ownedCosmetics || [],
      equippedCosmetics: userData.equippedCosmetics || [],
      walletTransactions: userData.walletTransactions || [],
      sultanBadgeColor: userData.sultanBadgeColor,
      sultanGlowEffect: !!userData.sultanGlowEffect,
      sultanCustomTag: userData.sultanCustomTag,
      isMyCryptoMember: !!userData.isMyCryptoMember,
      myCryptoExpiry: userData.myCryptoExpiry ? new Date(userData.myCryptoExpiry) : null,
      bio: userData.bio,
      theme: userData.theme,
      youtubeId: userData.youtubeId,
      useAnimation: !!userData.useAnimation,
    }).onDuplicateKeyUpdate({
      set: {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        isVerifiedSeller: !!userData.isVerifiedSeller,
        isVerifiedReseller: !!userData.isVerifiedReseller,
        coins: coinsValue,
        balance: (userData.balance || 0).toString(),
        points: userData.points || 0,
        activityLog: userData.activityLog || [],
        purchaseHistory: userData.purchaseHistory || [],
        ownedCosmetics: userData.ownedCosmetics || [],
        equippedCosmetics: userData.equippedCosmetics || [],
        walletTransactions: userData.walletTransactions || [],
        sultanBadgeColor: userData.sultanBadgeColor,
        sultanGlowEffect: !!userData.sultanGlowEffect,
        sultanCustomTag: userData.sultanCustomTag,
        isMyCryptoMember: !!userData.isMyCryptoMember,
        myCryptoExpiry: userData.myCryptoExpiry ? new Date(userData.myCryptoExpiry) : null,
        bio: userData.bio,
        theme: userData.theme,
        youtubeId: userData.youtubeId,
        useAnimation: !!userData.useAnimation,
      }
    });

    console.log(`[SYNC] SUCCESS for ${userData.id}: Coins set to ${coinsValue}. Rows affected: ${JSON.stringify(result)}`);
    res.json({ success: true });
  } catch (error: any) {
    console.error("[SYNC] FATAL ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
