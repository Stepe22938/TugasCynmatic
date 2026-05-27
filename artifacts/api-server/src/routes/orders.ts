import { Router } from "express";
import { db } from "@workspace/db";
import { orders } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Get all orders
router.get("/", async (req, res) => {
  try {
    const all = await db.select().from(orders);
    res.json(all);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Sync order (Upsert)
router.post("/sync", async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) return res.status(400).json({ error: "Order ID required" });

    await db.insert(orders).values({
      id: data.id,
      userId: data.userId,
      userName: data.userName,
      orderNumber: data.orderNumber,
      date: data.date ? new Date(data.date) : new Date(),
      items: data.items || [],
      subtotal: data.subtotal?.toString(),
      shippingFee: data.shippingFee?.toString(),
      grandTotal: data.grandTotal?.toString(),
      status: data.status,
      shippingInfo: data.shippingInfo,
      paymentMethod: data.paymentMethod,
      voucherCode: data.voucherCode,
      voucherDiscount: data.voucherDiscount,
      sellerVoucherCode: data.sellerVoucherCode || null,
      sellerVoucherDiscount: data.sellerVoucherDiscount || null,
      coinDiscount: data.coinDiscount,
      messages: data.messages || [],
      problemReport: data.problemReport,
      courierNote: data.courierNote,
      reviews: data.reviews || {},
    }).onDuplicateKeyUpdate({
      set: {
        status: data.status,
        messages: data.messages || [],
        problemReport: data.problemReport,
        courierNote: data.courierNote,
        reviews: data.reviews || {},
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
