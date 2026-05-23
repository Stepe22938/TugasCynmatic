const mysql = require("mysql2/promise");

async function checkDatabase() {
  const url = "mysql://root:phantomichostjaya@185.128.227.237:3306/cynmatic_db";
  try {
    const conn = await mysql.createConnection(url);
    console.log("Connected to Cynmatic DB!");

    const tables = [
      "users",
      "products",
      "orders",
      "reviews",
      "auctions",
      "polls",
      "tickets",
      "vouchers",
      "redeem_codes"
    ];

    console.log("\n=== STATUS DATA DI DATABASE VPS ===");
    for (const table of tables) {
      try {
        const [rows] = await conn.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = rows[0].count;
        console.log(`- Table [${table.padEnd(13)}]: ${count} baris/data terdaftar`);
      } catch (err) {
        console.log(`- Table [${table.padEnd(13)}]: Gagal dibaca (${err.message})`);
      }
    }

    console.log("\n=== CONTOH DATA PENGGUNA TERDAFTAR ===");
    try {
      const [userRows] = await conn.query("SELECT id, name, email, role FROM users LIMIT 10");
      console.log(userRows);
    } catch (err) {
      console.log("Gagal membaca data users:", err.message);
    }

    console.log("\n=== CONTOH DATA PRODUK TERDAFTAR ===");
    try {
      const [productRows] = await conn.query("SELECT id, name, price, stock, category, sellerName FROM products");
      console.log(productRows);
    } catch (err) {
      console.log("Gagal membaca data products:", err.message);
    }

    await conn.end();
  } catch (err) {
    console.error("Koneksi gagal:", err);
  }
}

checkDatabase();
