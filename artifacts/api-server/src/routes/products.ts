import { Router } from "express";
import { db } from "@workspace/db";
import { products } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

const ensureJson = (v: any) => {
  if (!v) return [];
  if (typeof v === "string") { try { return JSON.parse(v); } catch { return []; } }
  return v;
};

// GET all products
router.get("/", async (req, res) => {
  try {
    const allProducts = await db.select().from(products);
    res.json(allProducts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// UPSERT product (sync)
router.post("/sync", async (req, res) => {
  try {
    const p = req.body;
    if (!p.name) return res.status(400).json({ error: "Product name required" });

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
      status: p.status || "pending",
      isFlashSale: !!p.isFlashSale,
      discountPercent: Number(p.discountPercent || 0),
      isPreOrder: !!p.isPreOrder,
      releaseDate: p.releaseDate,
    };

    if (p.id) {
      await db.insert(products).values({ id: Number(p.id), ...payload })
        .onDuplicateKeyUpdate({ set: payload });
    } else {
      await db.insert(products).values(payload);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("[PRODUCT] Sync Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
