import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL tidak ditemukan di .env! Pastikan DATABASE_URL sudah diset.\n" +
    "Contoh: DATABASE_URL=mysql://user:password@host:3306/cynmatic_db"
  );
}

// Support for mysql:// and mysql2:// URL schemes
const connectionString = process.env.DATABASE_URL.replace(/^mysql:\/\//, "mysql2://");

// Create connection pool for better performance & stability
export const pool = mysql.createPool({
  uri: connectionString,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,      // 10s connection timeout
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test connection on startup and log result & run self-healing schema checks
pool.getConnection()
  .then(async (conn) => {
    console.log("✅ MariaDB Connected successfully!");
    try {
      console.log("📡 Running self-healing schema check on users table...");
      
      // Check & Add isSultan
      const [hasIsSultan]: any = await conn.execute("SHOW COLUMNS FROM users LIKE 'isSultan'");
      if (hasIsSultan.length === 0) {
        console.log("🛠️  Column 'isSultan' is missing. Altering table...");
        await conn.execute("ALTER TABLE users ADD COLUMN isSultan TINYINT(1) DEFAULT 0");
        console.log("   → Column 'isSultan' added successfully!");
      }

      // Check & Add sultanExpiry
      const [hasSultanExpiry]: any = await conn.execute("SHOW COLUMNS FROM users LIKE 'sultanExpiry'");
      if (hasSultanExpiry.length === 0) {
        console.log("🛠️  Column 'sultanExpiry' is missing. Altering table...");
        await conn.execute("ALTER TABLE users ADD COLUMN sultanExpiry TIMESTAMP NULL DEFAULT NULL");
        console.log("   → Column 'sultanExpiry' added successfully!");
      }

      console.log("✅ Users table schema is fully verified & up to date.");
    } catch (schemaErr: any) {
      console.warn("⚠️  Self-healing schema migration check failed (non-blocking):", schemaErr.message);
    } finally {
      conn.release();
    }
  })
  .catch(err => {
    console.error("❌ MariaDB Connection FAILED:", err.message);
    console.error("   Check your DATABASE_URL in .env:");
    console.error("   DATABASE_URL=mysql://user:pass@host:3306/dbname");
  });

export const db = drizzle(pool, { schema, mode: "default" });

export * from "./schema";
