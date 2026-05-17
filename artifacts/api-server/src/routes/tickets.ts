import { Router } from "express";
import { db } from "@workspace/db";
import { tickets } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// GET all tickets
router.get("/", async (req, res) => {
  try {
    res.json(await db.select().from(tickets));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// UPSERT ticket (sync)
// Note: TicketContext sends `type` and `description` — we map `type` → `subject`
router.post("/sync", async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) return res.status(400).json({ error: "Ticket ID required" });

    // Map `type` field from frontend to `subject` column in DB
    const subjectValue = data.subject || data.type || "Support Ticket";

    await db.insert(tickets).values({
      id: data.id,
      userId: data.userId,
      userName: data.userName,
      subject: subjectValue,
      description: data.description,
      category: data.category || data.type,
      priority: data.priority || "medium",
      status: data.status || "open",
      messages: data.messages || [],
    }).onDuplicateKeyUpdate({
      set: {
        status: data.status || "open",
        messages: data.messages || [],
        priority: data.priority,
      }
    });

    res.json({ success: true });
  } catch (e: any) {
    console.error("[TICKET] Sync error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
