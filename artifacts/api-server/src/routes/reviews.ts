import { Router } from "express";
import { db } from "@workspace/db";
import { reviews } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// GET all reviews
router.get("/", async (req, res) => {
  try {
    const all = await db.select().from(reviews);
    res.json(all);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// SYNC review — uses upsert by orderId+productId to prevent duplicates
router.post("/sync", async (req, res) => {
  try {
    const data = req.body;
    if (!data.productId || !data.orderId) {
      return res.status(400).json({ error: "productId and orderId required" });
    }

    // Check if review already exists to avoid duplicate crash
    const existing = await db.select({ id: reviews.id })
      .from(reviews)
      .where(and(
        eq(reviews.productId, Number(data.productId)),
        eq(reviews.orderId, data.orderId)
      ));

    if (existing.length > 0) {
      // Update existing review
      await db.update(reviews)
        .set({
          rating: data.rating,
          status: data.status,
          comment: data.comment,
          mediaFiles: data.mediaFiles || [],
        })
        .where(eq(reviews.id, existing[0].id));
    } else {
      // Insert new review
      await db.insert(reviews).values({
        productId: Number(data.productId),
        orderId: data.orderId,
        userName: data.userName,
        rating: data.rating,
        status: data.status,
        comment: data.comment,
        mediaFiles: data.mediaFiles || [],
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("[REVIEW] Sync error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
