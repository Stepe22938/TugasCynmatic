/**
 * migrate.ts
 * Memindahkan data JSON (hasil export Admin Page) ke MariaDB via Drizzle ORM.
 * Mendukung semua kolom terbaru di schema.
 */
import { db } from "./index";
import { users, products } from "./schema";

const ensureJson = (v: any) => {
  if (!v) return [];
  if (typeof v === "string") { try { return JSON.parse(v); } catch { return []; } }
  return v;
};

export async function migrateData(jsonData: { users: any[], products: any[] }) {
  console.log("🚀 Memulai migrasi data ke MariaDB...");

  try {
    // ─── 1. MIGRASI USERS ────────────────────────────────────────────────
    if (jsonData.users && jsonData.users.length > 0) {
      console.log(`👤 Mengimpor ${jsonData.users.length} pengguna...`);
      for (const u of jsonData.users) {
        const payload = {
          id: u.id,
          name: u.name || "Unknown",
          email: u.email,
          password: u.password,
          role: u.role || "user",
          isVerifiedSeller: !!u.isVerifiedSeller,
          isVerifiedReseller: !!u.isVerifiedReseller,
          coins: Math.floor(Number(u.coins || 0)),
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
          sultanBadgeColor: u.sultanBadgeColor,
          sultanGlowEffect: !!u.sultanGlowEffect,
          sultanCustomTag: u.sultanCustomTag,
          isMyCryptoMember: !!u.isMyCryptoMember,
          myCryptoExpiry: u.myCryptoExpiry ? new Date(u.myCryptoExpiry) : null,
          bio: u.bio,
          theme: u.theme,
          youtubeId: u.youtubeId,
          useAnimation: !!u.useAnimation,
          profileLayout: u.profileLayout || "premium",
          avatar: u.avatar,
        };
        await db.insert(users).values(payload).onDuplicateKeyUpdate({ set: payload });
      }
      console.log("✅ Users migrated.");
    }

    // ─── 2. MIGRASI PRODUCTS ─────────────────────────────────────────────
    if (jsonData.products && jsonData.products.length > 0) {
      console.log(`📦 Mengimpor ${jsonData.products.length} produk...`);
      for (const p of jsonData.products) {
        const payload = {
          name: p.name,
          description: p.description,
          longDescription: p.longDescription,
          price: String(Number(p.price || 0)),
          image: p.image,
          images: ensureJson(p.images),
          category: p.category,
          specs: ensureJson(p.specs),
          stock: Number(p.stock || 0),
          sellerId: p.sellerId,
          sellerName: p.sellerName,
          status: p.status || "approved",
          isFlashSale: !!p.isFlashSale,
          discountPercent: Number(p.discountPercent || 0),
          isPreOrder: !!p.isPreOrder,
          releaseDate: p.releaseDate,
        };

        if (p.id) {
          // Insert with explicit ID if provided (for seeding known IDs)
          await db.insert(products).values({ id: p.id, ...payload })
            .onDuplicateKeyUpdate({ set: payload });
        } else {
          await db.insert(products).values(payload);
        }
      }
      console.log("✅ Products migrated.");
    }

    console.log("🎉 Migrasi selesai dengan sukses!");
  } catch (error) {
    console.error("❌ Terjadi kesalahan saat migrasi:", error);
    throw error;
  }
}
