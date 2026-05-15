const mysql = require('mysql2/promise');

async function seedPasswords() {
  const connection = await mysql.createConnection({
    host: '185.128.227.237',
    user: 'root',
    password: 'phantomichostjaya',
    database: 'cynmatic_db'
  });

  console.log("Seeding passwords to VPS...");

  try {
    await connection.query(`UPDATE users SET password = 'Admin123' WHERE id = 'admin-001'`);
    await connection.query(`UPDATE users SET password = 'Kurir123' WHERE id = 'kurir-001'`);
    console.log("Passwords seeded successfully!");
  } catch (err) {
    console.error("Failed to seed passwords:", err);
  } finally {
    await connection.end();
  }
}

seedPasswords();
