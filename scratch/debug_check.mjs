import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set');
    return;
  }
  console.log('Connecting to:', url);
  const conn = await mysql.createConnection(url);
  try {
    const [settings] = await conn.execute('SELECT * FROM aiSettings LIMIT 10');
    console.log('--- AI Settings ---');
    console.log(settings);

    const [products] = await conn.execute('SELECT id, name, category, price FROM products LIMIT 10');
    console.log('--- Products ---');
    console.log(products);

    for (const p of products) {
      const [reviews] = await conn.execute('SELECT COUNT(*) as count FROM reviews WHERE productId = ?', [p.id]);
      console.log(`Product #${p.id} "${p.name}": ${reviews[0].count} reviews`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await conn.end();
  }
}

main();
