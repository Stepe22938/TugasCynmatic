import { Router } from "express";
import { db } from "@workspace/db";
import { auctions } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Get all auctions
router.get("/", async (req, res) => {
  try {
    const all = await db.select().from(auctions);
    res.json(all);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Sync auction (Upsert)
router.post("/sync", async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) return res.status(400).json({ error: "Auction ID required" });

    await db.insert(auctions).values({
      id: data.id,
      sellerId: data.sellerId,
      sellerName: data.sellerName,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      startPrice: data.startPrice?.toString(),
      currentPrice: data.currentPrice?.toString(),
      minStep: data.minStep?.toString(),
      endTime: data.endTime ? new Date(data.endTime) : null,
      status: data.status,
      bids: data.bids || [],
      winnerId: data.winnerId,
      winnerName: data.winnerName,
      isPaid: !!data.isPaid,
    }).onDuplicateKeyUpdate({
      set: {
        currentPrice: data.currentPrice?.toString(),
        status: data.status,
        bids: data.bids || [],
        winnerId: data.winnerId,
        winnerName: data.winnerName,
        isPaid: !!data.isPaid,
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
