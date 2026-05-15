/**
 * migrate-data.ts
 * Script untuk memindahkan data dari JSON dump (hasil export Admin Page)
 * ke database MySQL via Drizzle ORM.
 */
import { db } from "./index";
import { users, products } from "./schema";

export async function migrateData(jsonData: { users: any[], products: any[] }) {
  console.log("🚀 Memulai migrasi data ke database...");

  try {
    // 1. Migrasi Users
    if (jsonData.users.length > 0) {
      console.log(`👤 Mengimpor ${jsonData.users.length} pengguna...`);
      for (const u of jsonData.users) {
        await db.insert(users).values({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          isVerifiedSeller: !!u.isVerifiedSeller,
          isVerifiedReseller: !!u.isVerifiedReseller,
          coins: u.coins || 0,
        }).onDuplicateKeyUpdate({
          set: { name: u.name, role: u.role, coins: u.coins || 0 }
        });
      }
    }

    // 2. Migrasi Products
    if (jsonData.products.length > 0) {
      console.log(`📦 Mengimpor ${jsonData.products.length} produk...`);
      for (const p of jsonData.products) {
        await db.insert(products).values({
          id: p.id,
          name: p.name,
          price: p.price.toString(),
          stock: p.stock || 0,
          category: p.category,
          sellerId: p.sellerId,
          status: p.status || "approved",
          isFlashSale: !!p.isFlashSale,
        }).onDuplicateKeyUpdate({
          set: { price: p.price.toString(), stock: p.stock || 0, status: p.status || "approved" }
        });
      }
    }

    console.log("✅ Migrasi selesai dengan sukses!");
  } catch (error) {
    console.error("❌ Terjadi kesalahan saat migrasi:", error);
    throw error;
  }
}
