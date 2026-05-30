import { pool } from "@workspace/db";

async function check() {
  try {
    const [rows] = await pool.execute("SELECT * FROM ai_settings WHERE id = 'global' LIMIT 1");
    console.log("AI Settings Row:", JSON.stringify(rows[0], null, 2));
  } catch (err) {
    console.error("DB Error:", err.message);
  } finally {
    process.exit(0);
  }
}

check();
