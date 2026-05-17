import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

// Simple heartbeat — check if server is alive
router.get("/healthz", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Database connection check — used by LoginPage status indicator
router.get("/db", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ status: "connected", database: "MariaDB", timestamp: new Date().toISOString() });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;
