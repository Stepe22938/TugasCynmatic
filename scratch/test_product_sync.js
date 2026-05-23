import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function test() {
  console.log("📡 Testing product sync to remote MariaDB VPS...");
  try {
    // Now dynamic import db after dotenv is fully configured inside the async scope!
    const { db } = await import("@workspace/db");
    const { products } = await import("@workspace/db/schema");
    const { eq } = await import("drizzle-orm");

    const payload = {
      name: "Test Sepatu Sneakers",
      description: "Sneakers modern sol nyaman",
      longDescription: "Long description here",
      price: "299000.00",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=500&fit=crop",
      images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=500&fit=crop"],
      category: "Sepatu",
      specs: [{ label: "Bahan Upper", value: "Mesh Breathable" }],
      stock: 50,
      sellerId: "admin-001",
      sellerName: "Admin Toko",
      status: "approved",
      isFlashSale: false,
      discountPercent: 0,
      isPreOrder: false,
      releaseDate: "",
    };

    console.log("Inserting/Upserting product ID=999...");
    
    // Check if exists
    const existing = await db.select().from(products).where(eq(products.id, 999));
    if (existing.length > 0) {
      console.log("Product exists, updating...");
      await db.update(products).set(payload).where(eq(products.id, 999));
    } else {
      console.log("Product does not exist, inserting...");
      await db.insert(products).values({ id: 999, ...payload });
    }

    console.log("🎉 SUCCESS! Product successfully synced to remote MariaDB!");

    console.log("Verifying from DB...");
    const verified = await db.select().from(products).where(eq(products.id, 999));
    console.log("Verified product:", verified[0]);
    
    // Cleanup
    console.log("Cleaning up test product...");
    await db.delete(products).where(eq(products.id, 999));
    console.log("Cleanup done!");

    process.exit(0);
  } catch (error) {
    console.error("❌ FAILED to connect or insert to MariaDB VPS:", error);
    process.exit(1);
  }
}

test();
