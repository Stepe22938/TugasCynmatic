import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function dump() {
  try {
    const { pool } = await import("../lib/db/src/index.js");
    console.log("📡 Connecting to MariaDB to dump products...");
    
    const [rows] = await pool.query("SELECT * FROM products");
    console.log(`Found ${rows.length} products in MariaDB:`);
    console.log(JSON.stringify(rows, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error("❌ FAILED to query products table:", error);
    process.exit(1);
  }
}

dump();
