/**
 * migrate-data.ts
 * Script untuk memindahkan data dari JSON dump (hasil export Admin Page)
 * ke database MySQL/Postgres via Drizzle ORM.
 */
import { db } from "./index";
import { users, products } from "./schema";

export async function migrateData(jsonData: { users: any[], products: any[] }) {
  console.log("🚀 Memulai migrasi data ke database...");

  try {
    // 1. Migrasi Users
    if (jsonData.users.length > 0) {
      console.log(`👤 Mengimpor ${jsonData.users.length} pengguna...`);
      await db.insert(users).values(jsonData.users).onConflictDoUpdate({
        target: users.id,
        set: { name: users.name }
      });
    }

    // 2. Migrasi Products
    if (jsonData.products.length > 0) {
      console.log(`📦 Mengimpor ${jsonData.products.length} produk...`);
      await db.insert(products).values(jsonData.products);
    }

    console.log("✅ Migrasi selesai dengan sukses!");
  } catch (error) {
    console.error("❌ Terjadi kesalahan saat migrasi:", error);
    throw error;
  }
}
