const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const [rows] = await connection.execute('SELECT id, name, sellerId FROM products');
    console.log(`Found ${rows.length} products in DB:`);
    rows.forEach(r => console.log(`ID: ${r.id} | Name: ${r.name} | Seller: ${r.sellerId}`));
  } catch (e) {
    console.error(e);
  } finally {
    await connection.end();
  }
}

check();
