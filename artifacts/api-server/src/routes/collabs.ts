import { Router } from "express";
import { db } from "@workspace/db";
import { collabRequests } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Get all collaboration requests
router.get("/", async (req, res) => {
  try {
    const all = await db.select().from(collabRequests);
    res.json(all);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Sync collaboration request (Upsert)
router.post("/sync", async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) {
      return res.status(400).json({ error: "Collaboration ID required" });
    }

    await db.insert(collabRequests).values({
      id: data.id,
      fromSellerId: data.fromSellerId,
      fromSellerName: data.fromSellerName,
      toSellerId: data.toSellerId,
      toSellerName: data.toSellerName,
      type: data.type,
      message: data.message,
      status: data.status,
      createdAt: data.createdAt,
      responseAt: data.responseAt || null,
      productId: data.productId ? Number(data.productId) : null,
      productName: data.productName || null,
      productPrice: data.productPrice ? data.productPrice.toString() : null,
      productImage: data.productImage || null,
      proposedPrice: data.proposedPrice ? data.proposedPrice.toString() : null,
      proposedQuantity: data.proposedQuantity ? Number(data.proposedQuantity) : null,
      commissionPercent: data.commissionPercent ? Number(data.commissionPercent) : null,
      feedbackMessage: data.feedbackMessage || null,
    }).onDuplicateKeyUpdate({
      set: {
        status: data.status,
        responseAt: data.responseAt || null,
        feedbackMessage: data.feedbackMessage || null,
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
