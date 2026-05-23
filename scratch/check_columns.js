import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function check() {
  try {
    const { pool } = await import("../lib/db/src/index.js");
    console.log("📡 Checking products table columns in remote MariaDB VPS...");
    
    const [rows]: any = await pool.query("SHOW COLUMNS FROM products");
    console.log("Products table columns:");
    console.table(rows.map((r: any) => ({ Field: r.Field, Type: r.Type, Null: r.Null, Key: r.Key })));
    
    process.exit(0);
  } catch (error) {
    console.error("❌ FAILED to query products table columns:", error);
    process.exit(1);
  }
}

check();
