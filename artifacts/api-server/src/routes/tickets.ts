import { Router } from "express";
import { db } from "@workspace/db";
import { tickets } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try { res.json(await db.select().from(tickets)); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/sync", async (req, res) => {
  try {
    const data = req.body;
    await db.insert(tickets).values({
      id: data.id,
      userId: data.userId,
      userName: data.userName,
      subject: data.subject,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: data.status,
      messages: data.messages || [],
    }).onDuplicateKeyUpdate({
      set: {
        status: data.status,
        messages: data.messages || [],
      }
    });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
