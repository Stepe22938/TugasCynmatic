/**
 * create_messages_table.js
 * Script untuk membuat tabel messages di MariaDB secara langsung via SQL
 */
const mysql = require("mysql2/promise");

const DATABASE_URL = "mysql://root:phantomichostjaya@185.128.227.237:3306/cynmatic_db";

async function createMessagesTable() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("[DB] Connected to MariaDB");

  const sql = `
    CREATE TABLE IF NOT EXISTS messages (
      id        VARCHAR(255) NOT NULL PRIMARY KEY,
      senderId  VARCHAR(255) NOT NULL,
      receiverId VARCHAR(255) NOT NULL,
      text      TEXT,
      mediaUrl  VARCHAR(500),
      mediaType VARCHAR(20),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await conn.execute(sql);
  console.log("[DB] ✅ Table 'messages' created (or already exists)");

  // Verify
  const [rows] = await conn.execute("DESCRIBE messages");
  console.log("[DB] Table columns:", rows.map(r => r.Field));

  await conn.end();
  console.log("[DB] Done.");
}

createMessagesTable().catch(err => {
  console.error("[DB] Error:", err.message);
  process.exit(1);
});
