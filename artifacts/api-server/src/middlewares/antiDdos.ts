import type { NextFunction, Request, Response } from "express";

type Bucket = {
  count: number;
  blockedUntil: number;
  firstSeen: number;
  lastSeen: number;
  strikes: number;
};

const WINDOW_MS = Number(process.env["ANTI_DDOS_WINDOW_MS"] || 60_000);
const MAX_REQUESTS = Number(process.env["ANTI_DDOS_MAX_REQUESTS"] || 500);
const BLOCK_MS = Number(process.env["ANTI_DDOS_BLOCK_MS"] || 5 * 60_000);
const CLEANUP_MS = 10 * 60_000;
const MAX_BODY_BYTES = Number(process.env["ANTI_DDOS_MAX_BODY_BYTES"] || 2_000_000);

const buckets = new Map<string, Bucket>();

export const antiDdosStats = {
  blockedRequests: 0,
  suspiciousRequests: 0,
  activeClients: 0,
  lastBlockedIp: "",
  lastBlockedAt: "",
};

function getClientIp(req: Request) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0]?.trim() || req.ip || "unknown";
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

function isSuspicious(req: Request) {
  const url = req.originalUrl.toLowerCase();
  const userAgent = String(req.headers["user-agent"] || "").toLowerCase();
  const contentLength = Number(req.headers["content-length"] || 0);

  if (contentLength > MAX_BODY_BYTES) return true;
  if (!userAgent && req.method !== "OPTIONS") return true;
  if (url.includes("../") || url.includes("%2e%2e")) return true;
  if (url.includes("<script") || url.includes("union%20select")) return true;
  if (url.includes("/wp-admin") || url.includes("/xmlrpc.php") || url.includes("/.env")) return true;

  return false;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastSeen > CLEANUP_MS && bucket.blockedUntil < now) {
      buckets.delete(key);
    }
  }
  antiDdosStats.activeClients = buckets.size;
}, CLEANUP_MS).unref();

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}

export function antiDdos(req: Request, res: Response, next: NextFunction) {
  if (req.method === "OPTIONS") return next();

  const ip = getClientIp(req);

  // Bypass rate limiting for local / loopback / development IPs
  if (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1" ||
    ip === "localhost" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.20.") ||
    ip.startsWith("172.21.") ||
    ip.startsWith("172.22.") ||
    ip.startsWith("172.23.") ||
    ip.startsWith("172.24.") ||
    ip.startsWith("172.25.") ||
    ip.startsWith("172.26.") ||
    ip.startsWith("172.27.") ||
    ip.startsWith("172.28.") ||
    ip.startsWith("172.29.") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.")
  ) {
    return next();
  }

  const now = Date.now();
  const bucket = buckets.get(ip) || {
    count: 0,
    blockedUntil: 0,
    firstSeen: now,
    lastSeen: now,
    strikes: 0,
  };

  if (now - bucket.firstSeen > WINDOW_MS) {
    bucket.count = 0;
    bucket.firstSeen = now;
  }

  bucket.count += 1;
  bucket.lastSeen = now;

  const suspicious = isSuspicious(req);
  if (suspicious) {
    bucket.strikes += 2;
    antiDdosStats.suspiciousRequests += 1;
  }

  const overLimit = bucket.count > MAX_REQUESTS;
  const strikeBlocked = bucket.strikes >= 6;

  if (bucket.blockedUntil > now || overLimit || strikeBlocked) {
    bucket.blockedUntil = Math.max(bucket.blockedUntil, now + BLOCK_MS);
    buckets.set(ip, bucket);
    antiDdosStats.blockedRequests += 1;
    antiDdosStats.activeClients = buckets.size;
    antiDdosStats.lastBlockedIp = ip;
    antiDdosStats.lastBlockedAt = new Date().toISOString();

    res.setHeader("Retry-After", Math.ceil((bucket.blockedUntil - now) / 1000));
    return res.status(429).json({
      error: "Too many requests. Anti-DDoS protection is cooling this client down.",
      retryAfterSeconds: Math.ceil((bucket.blockedUntil - now) / 1000),
    });
  }

  buckets.set(ip, bucket);
  antiDdosStats.activeClients = buckets.size;
  next();
}
