import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function check() {
  console.log("Checking .env DATABASE_URL...");
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL not found in .env");
    return;
  }
  console.log("URL found:", url.replace(/:[^:@]+@/, ":****@")); // Hide password

  console.log("\nAttempting connection with mysql2...");
  try {
    const connection = await mysql.createConnection(url);
    console.log("✅ Connection SUCCESS!");
    await connection.end();
  } catch (e) {
    console.error("❌ Connection FAILED!");
    console.error(e.message);
  }
}

check();
