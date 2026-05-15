import { Router } from "express";
import { db } from "@workspace/db";
import { reviews } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Get all reviews
router.get("/", async (req, res) => {
  try {
    const all = await db.select().from(reviews);
    res.json(all);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Sync review (Single Insert, as reviews are immutable usually)
router.post("/sync", async (req, res) => {
  try {
    const data = req.body;
    await db.insert(reviews).values({
      productId: data.productId,
      orderId: data.orderId,
      userName: data.userName,
      rating: data.rating,
      status: data.status,
      comment: data.comment,
      mediaFiles: data.mediaFiles || [],
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
