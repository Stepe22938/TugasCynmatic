import { Router } from "express";
import { db } from "@workspace/db";
import { products } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

const ensureJson = (v: any) => {
  if (!v) return [];
  let parsed = v;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
    } catch {
      return [];
    }
  }
  return Array.isArray(parsed) ? parsed : [];
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

    let exists = false;
    if (p.id) {
      const existing = await db.select({ id: products.id }).from(products).where(eq(products.id, Number(p.id)));
      if (existing.length > 0) {
        exists = true;
      }
    }

    if (exists && p.id) {
      await db.update(products).set(payload).where(eq(products.id, Number(p.id)));
    } else {
      const insertPayload = p.id ? { id: Number(p.id), ...payload } : payload;
      await db.insert(products).values(insertPayload);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("[PRODUCT] Sync Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE a product
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(products).where(eq(products.id, Number(id)));
    res.json({ success: true, message: `Product ${id} deleted successfully` });
  } catch (error: any) {
    console.error("[PRODUCT] Delete Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
