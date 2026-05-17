import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../artifacts/api-server/.env') });

const dbUrl = process.env.DATABASE_URL || 'mysql://root:@127.0.0.1:3306/cynmatic';

async function run() {
  const conn = await mysql.createConnection(dbUrl);
  try {
    const [result] = await conn.execute("DELETE FROM users WHERE email = 'admin@toko.com'");
    console.log("Deleted admin@toko.com:", result.affectedRows > 0 ? "Success" : "User not found");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await conn.end();
  }
}

run();
