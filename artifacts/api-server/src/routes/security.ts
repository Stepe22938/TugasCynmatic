import { Router } from "express";
import { antiDdosStats } from "../middlewares/antiDdos";

const router = Router();

router.get("/security/status", (req, res) => {
  const role = String(req.headers["x-user-role"] || "");

  if (role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  res.json({
    antiDdos: {
      mode: "in-memory edge shield",
      activeClients: antiDdosStats.activeClients,
      blockedRequests: antiDdosStats.blockedRequests,
      suspiciousRequests: antiDdosStats.suspiciousRequests,
      lastBlockedIp: antiDdosStats.lastBlockedIp || null,
      lastBlockedAt: antiDdosStats.lastBlockedAt || null,
      windowMs: Number(process.env["ANTI_DDOS_WINDOW_MS"] || 60_000),
      maxRequests: Number(process.env["ANTI_DDOS_MAX_REQUESTS"] || 180),
      blockMs: Number(process.env["ANTI_DDOS_BLOCK_MS"] || 300_000),
    },
    googleAuth: {
      backendClientConfigured: Boolean(process.env["GOOGLE_CLIENT_ID"]),
    },
    generatedAt: new Date().toISOString(),
  });
});

export default router;
