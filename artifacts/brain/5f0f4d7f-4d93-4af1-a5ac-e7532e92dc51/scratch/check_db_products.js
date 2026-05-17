const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function checkProducts() {
  const envContent = fs.readFileSync('C:\\Users\\Zaidan\\Desktop\\TESTCLAUDE\\TugasCynmatic\\.env', 'utf8');
  const dbUrlLine = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='));
  const connectionString = dbUrlLine.split('=')[1].trim().replace(/^mysql:/, "mysql2:");
  
  const connection = await mysql.createConnection(connectionString);
  
  try {
    const [rows] = await connection.execute('SELECT * FROM products');
    console.log(`Found ${rows.length} products:`);
    // Print just names and status to avoid clutter
    rows.forEach(r => console.log(`- ${r.name} (${r.status}) [Seller: ${r.sellerId}]`));
  } catch (error) {
    console.error('Error fetching products:', error);
  } finally {
    await connection.end();
  }
}

checkProducts();
