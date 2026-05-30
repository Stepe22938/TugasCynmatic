import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Fix BigInt serialization for JSON
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Load .env from project root - try multiple possible locations
const possibleEnvPaths = [
  path.resolve(process.cwd(), ".env"),                    // npm run dev from root
  path.resolve(process.cwd(), "../../.env"),               // fallback
];

let envLoaded = false;
for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ Loaded .env from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn("⚠️ No .env file found, relying on system environment variables");
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error: any) => {
  console.error("Uncaught exception:", error);
  if (error?.code === "EADDRINUSE") {
    process.exit(1);
  }
});

// Dynamic import AFTER env is loaded so DATABASE_URL is available
const { default: app } = await import("./app.js");
const { logger } = await import("./lib/logger.js");

const rawPort = process.env["PORT"] || "3000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
