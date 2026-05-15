import { Router } from "express";
import { db } from "@workspace/db";
import { polls } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try { res.json(await db.select().from(polls)); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/sync", async (req, res) => {
  try {
    const data = req.body;
    await db.insert(polls).values({
      id: data.id,
      title: data.title,
      options: data.options || [],
      isActive: !!data.isActive,
      votedUserIds: data.votedUserIds || [],
    }).onDuplicateKeyUpdate({
      set: {
        options: data.options || [],
        isActive: !!data.isActive,
        votedUserIds: data.votedUserIds || [],
      }
    });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
