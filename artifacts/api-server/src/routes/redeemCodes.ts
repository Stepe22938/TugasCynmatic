import { Router } from "express";
import { db } from "@workspace/db";
import { redeemCodes } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try { res.json(await db.select().from(redeemCodes)); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/sync", async (req, res) => {
  try {
    const data = req.body;
    await db.insert(redeemCodes).values({
      id: data.id,
      code: data.code,
      type: data.type,
      value: data.value?.toString(),
      maxUses: data.maxUses,
      usedBy: data.usedBy || [],
      isActive: !!data.isActive,
    }).onDuplicateKeyUpdate({
      set: {
        usedBy: data.usedBy || [],
        isActive: !!data.isActive,
      }
    });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
