import { Router } from "express";
import { db } from "@workspace/db";
import { vouchers } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try { res.json(await db.select().from(vouchers)); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/sync", async (req, res) => {
  try {
    const data = req.body;
    await db.insert(vouchers).values({
      id: data.id,
      code: data.code,
      type: data.type,
      value: data.value?.toString(),
      minPurchase: data.minPurchase?.toString(),
      maxDiscount: data.maxDiscount?.toString(),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      maxUses: data.maxUses,
      usedCount: data.usedCount || 0,
      isActive: !!data.isActive,
      description: data.description,
      sellerId: data.sellerId || null,
      sellerName: data.sellerName || null,
      productId: data.productId ? Number(data.productId) : null,
      productName: data.productName || null,
    }).onDuplicateKeyUpdate({
      set: {
        usedCount: data.usedCount,
        isActive: !!data.isActive,
      }
    });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
