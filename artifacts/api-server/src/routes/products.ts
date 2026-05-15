import { Router } from "express";
import { db } from "@workspace/db";
import { products } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Get all products
router.get("/", async (req, res) => {
  try {
    const allProducts = await db.select().from(products);
    res.json(allProducts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update or Create product (Upsert)
router.post("/sync", async (req, res) => {
  try {
    const p = req.body;
    if (!p.id) return res.status(400).json({ error: "Product ID required" });

    await db.insert(products).values({
      id: p.id,
      name: p.name,
      description: p.description,
      longDescription: p.longDescription,
      price: p.price.toString(),
      image: p.image,
      images: p.images, // Drizzle handles JSON array
      category: p.category,
      specs: p.specs, // Drizzle handles JSON array
      stock: p.stock || 0,
      sellerId: p.sellerId,
      sellerName: p.sellerName,
      status: p.status || 'pending',
      isFlashSale: !!p.isFlashSale,
      discountPercent: p.discountPercent || 0,
    }).onDuplicateKeyUpdate({
      set: {
        name: p.name,
        description: p.description,
        longDescription: p.longDescription,
        price: p.price.toString(),
        image: p.image,
        images: p.images,
        category: p.category,
        specs: p.specs,
        stock: p.stock,
        status: p.status,
        isFlashSale: !!p.isFlashSale,
        discountPercent: p.discountPercent || 0,
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Sync Product Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
