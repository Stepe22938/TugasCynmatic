const mysql = require('mysql2/promise');

async function updateDB() {
  const connection = await mysql.createConnection({
    host: '185.128.227.237',
    user: 'root',
    password: 'phantomichostjaya',
    database: 'cynmatic_db'
  });

  console.log("Updating database schema on VPS (Sultan & Wallet Edition)...");

  const queries = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS walletTransactions JSON`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS sultanBadgeColor VARCHAR(50)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS sultanGlowEffect BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS sultanCustomTag VARCHAR(100)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS isMyCryptoMember BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS myCryptoExpiry TIMESTAMP NULL`
  ];

  for (const q of queries) {
    try {
      await connection.query(q);
      console.log(`Success: ${q}`);
    } catch (err) {
      console.warn(`Skipped/Error: ${q} - ${err.message}`);
    }
  }

  await connection.end();
  console.log("Update Complete!");
}

updateDB();
