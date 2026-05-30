import { Router } from "express";
import { db, pool } from "@workspace/db";
import { messages } from "@workspace/db/schema";
import { eq, or, and } from "drizzle-orm";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

const router = Router();

const parseMemberIds = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
};

const normalizeGroup = (row: any) => ({
  id: String(row.id),
  name: String(row.name || "Grup"),
  ownerId: String(row.ownerId),
  memberIds: parseMemberIds(row.memberIds),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

// ─── MULTER CONFIG — Secure File Upload ─────────────────────────────────────
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "chat");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed MIME types whitelist
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Use random hex to prevent path traversal / enumeration
    const safeName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipe file tidak didukung: ${file.mimetype}. Hanya gambar (jpg, png, gif, webp) dan video (mp4, webm) yang diizinkan.`));
    }
  },
});

// ─── GET MESSAGES BETWEEN TWO USERS ─────────────────────────────────────────
// ─── FRIEND GROUPS ─────────────────────────────────────────────────────────
router.get("/groups/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows] = await pool.execute<any[]>(
      "SELECT * FROM friend_groups WHERE JSON_CONTAINS(memberIds, ?) ORDER BY updatedAt DESC",
      [JSON.stringify(userId)]
    );
    res.json(rows.map(normalizeGroup));
  } catch (error: any) {
    console.error("[GROUPS GET] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/groups", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const ownerId = String(req.body?.ownerId || "").trim();
    const rawMembers = Array.isArray(req.body?.memberIds) ? req.body.memberIds.map(String) : [];
    if (!name || !ownerId) return res.status(400).json({ error: "Nama grup dan ownerId wajib diisi" });

    const memberIds = Array.from(new Set([ownerId, ...rawMembers.filter(Boolean)]));
    if (memberIds.length < 2) return res.status(400).json({ error: "Pilih minimal 1 teman untuk membuat grup" });

    const id = `grp-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    await pool.execute("INSERT INTO friend_groups (id, name, ownerId, memberIds) VALUES (?, ?, ?, ?)", [
      id,
      name.slice(0, 255),
      ownerId,
      JSON.stringify(memberIds),
    ]);
    const [rows] = await pool.execute<any[]>("SELECT * FROM friend_groups WHERE id = ? LIMIT 1", [id]);
    res.json({ success: true, group: normalizeGroup(rows[0]) });
  } catch (error: any) {
    console.error("[GROUPS CREATE] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/groups/:groupId/members", async (req, res) => {
  try {
    const { groupId } = req.params;
    const actorId = String(req.body?.userId || "").trim();
    const addMemberIds = Array.isArray(req.body?.memberIds) ? req.body.memberIds.map(String).filter(Boolean) : [];
    const [rows] = await pool.execute<any[]>("SELECT * FROM friend_groups WHERE id = ? LIMIT 1", [groupId]);
    if (!rows.length) return res.status(404).json({ error: "Grup tidak ditemukan" });

    const group = normalizeGroup(rows[0]);
    if (!group.memberIds.includes(actorId)) return res.status(403).json({ error: "Kamu bukan member grup ini" });

    const nextMembers = Array.from(new Set([...group.memberIds, ...addMemberIds]));
    await pool.execute("UPDATE friend_groups SET memberIds = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?", [
      JSON.stringify(nextMembers),
      groupId,
    ]);
    const [updated] = await pool.execute<any[]>("SELECT * FROM friend_groups WHERE id = ? LIMIT 1", [groupId]);
    res.json({ success: true, group: normalizeGroup(updated[0]) });
  } catch (error: any) {
    console.error("[GROUPS ADD MEMBERS] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/groups/:groupId/leave", async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = String(req.body?.userId || "").trim();
    const [rows] = await pool.execute<any[]>("SELECT * FROM friend_groups WHERE id = ? LIMIT 1", [groupId]);
    if (!rows.length) return res.status(404).json({ error: "Grup tidak ditemukan" });

    const group = normalizeGroup(rows[0]);
    const nextMembers = group.memberIds.filter(id => id !== userId);
    if (nextMembers.length === 0) {
      await pool.execute("DELETE FROM group_messages WHERE groupId = ?", [groupId]);
      await pool.execute("DELETE FROM friend_groups WHERE id = ?", [groupId]);
      return res.json({ success: true, deleted: true });
    }

    const nextOwnerId = group.ownerId === userId ? nextMembers[0] : group.ownerId;
    await pool.execute("UPDATE friend_groups SET ownerId = ?, memberIds = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?", [
      nextOwnerId,
      JSON.stringify(nextMembers),
      groupId,
    ]);
    res.json({ success: true });
  } catch (error: any) {
    console.error("[GROUPS LEAVE] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/groups/:groupId/messages", async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = String(req.query.userId || "").trim();
    const [groups] = await pool.execute<any[]>("SELECT * FROM friend_groups WHERE id = ? LIMIT 1", [groupId]);
    if (!groups.length) return res.status(404).json({ error: "Grup tidak ditemukan" });
    const group = normalizeGroup(groups[0]);
    if (!group.memberIds.includes(userId)) return res.status(403).json({ error: "Kamu bukan member grup ini" });

    const [rows] = await pool.execute<any[]>("SELECT * FROM group_messages WHERE groupId = ? ORDER BY createdAt ASC", [groupId]);
    res.json(rows);
  } catch (error: any) {
    console.error("[GROUP MESSAGES GET] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/groups/:groupId/send", async (req, res) => {
  try {
    const { groupId } = req.params;
    const senderId = String(req.body?.senderId || "").trim();
    const text = String(req.body?.text || "").trim();
    const mediaUrl = req.body?.mediaUrl || null;
    const mediaType = req.body?.mediaType || null;
    if (!senderId) return res.status(400).json({ error: "senderId diperlukan" });
    if (!text && !mediaUrl) return res.status(400).json({ error: "Pesan tidak boleh kosong" });

    const [groups] = await pool.execute<any[]>("SELECT * FROM friend_groups WHERE id = ? LIMIT 1", [groupId]);
    if (!groups.length) return res.status(404).json({ error: "Grup tidak ditemukan" });
    const group = normalizeGroup(groups[0]);
    if (!group.memberIds.includes(senderId)) return res.status(403).json({ error: "Kamu bukan member grup ini" });

    const id = `gmsg-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    await pool.execute("INSERT INTO group_messages (id, groupId, senderId, text, mediaUrl, mediaType) VALUES (?, ?, ?, ?, ?, ?)", [
      id,
      groupId,
      senderId,
      text || null,
      mediaUrl,
      mediaType,
    ]);
    await pool.execute("UPDATE friend_groups SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?", [groupId]);
    const [rows] = await pool.execute<any[]>("SELECT * FROM group_messages WHERE id = ? LIMIT 1", [id]);
    res.json({ success: true, message: rows[0] });
  } catch (error: any) {
    console.error("[GROUP MESSAGES SEND] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/messages/:userId/:otherId
router.get("/:userId/:otherId", async (req, res) => {
  try {
    const { userId, otherId } = req.params;
    if (!userId || !otherId) {
      return res.status(400).json({ error: "userId dan otherId diperlukan" });
    }

    const allMessages = await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId), eq(messages.receiverId, otherId)),
          and(eq(messages.senderId, otherId), eq(messages.receiverId, userId))
        )
      );

    // Sort ascending by createdAt
    allMessages.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    });

    res.json(allMessages);
  } catch (error: any) {
    console.error("[MESSAGES GET] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── SEND TEXT MESSAGE ───────────────────────────────────────────────────────
// POST /api/messages/send
router.post("/send", async (req, res) => {
  try {
    const { senderId, receiverId, text, mediaUrl, mediaType } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ error: "senderId dan receiverId diperlukan" });
    }
    if (!text && !mediaUrl) {
      return res.status(400).json({ error: "Pesan tidak boleh kosong" });
    }

    const id = `msg-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

    await db.insert(messages).values({
      id,
      senderId,
      receiverId,
      text: text || null,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
    });

    const created = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));

    console.log(`[MESSAGES SEND] ${senderId} → ${receiverId}: ${text ? `"${text.slice(0, 30)}"` : `[${mediaType}]`}`);
    res.json({ success: true, message: created[0] });
  } catch (error: any) {
    console.error("[MESSAGES SEND] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── UPLOAD MEDIA FILE ───────────────────────────────────────────────────────
// POST /api/messages/upload  (multipart/form-data, field: "media")
router.post("/upload", upload.single("media"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Tidak ada file yang diupload" });
    }

    const mime = req.file.mimetype;
    const mediaType = mime.startsWith("video/") ? "video" : "image";
    // URL relative — served via express.static("/uploads")
    const mediaUrl = `/uploads/chat/${req.file.filename}`;

    console.log(`[MESSAGES UPLOAD] File saved: ${req.file.filename} (${mediaType}, ${(req.file.size / 1024).toFixed(1)} KB)`);

    res.json({
      success: true,
      mediaUrl,
      mediaType,
      filename: req.file.filename,
      size: req.file.size,
    });
  } catch (error: any) {
    console.error("[MESSAGES UPLOAD] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── DELETE A MESSAGE (sender only) ─────────────────────────────────────────
// DELETE /api/messages/:messageId?senderId=xxx
router.delete("/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { senderId } = req.query as { senderId: string };

    if (!senderId) {
      return res.status(400).json({ error: "senderId diperlukan" });
    }

    // Find message
    const found = await db.select().from(messages).where(eq(messages.id, messageId));
    if (!found.length) {
      return res.status(404).json({ error: "Pesan tidak ditemukan" });
    }
    if (found[0].senderId !== senderId) {
      return res.status(403).json({ error: "Anda tidak bisa menghapus pesan orang lain" });
    }

    // Delete media file from disk if exists
    if (found[0].mediaUrl) {
      const filePath = path.resolve(process.cwd(), found[0].mediaUrl.replace(/^\//, ""));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await db.delete(messages).where(eq(messages.id, messageId));
    res.json({ success: true });
  } catch (error: any) {
    console.error("[MESSAGES DELETE] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── Multer error handler ────────────────────────────────────────────────────
router.use((err: any, _req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File terlalu besar. Maksimal 15 MB." });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

export default router;
