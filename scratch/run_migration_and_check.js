const mysql = require("mysql2/promise");
const url = "mysql://root:phantomichostjaya@185.128.227.237:3306/cynmatic_db";

async function run() {
  try {
    const conn = await mysql.createConnection(url);
    console.log("Connected to MariaDB VPS successfully!");

    // 1. Alter vouchers table if columns are missing
    console.log("Ensuring vouchers table columns...");
    const vouchersNewCols = [
      { name: "sellerId", type: "VARCHAR(255) NULL" },
      { name: "sellerName", type: "VARCHAR(255) NULL" },
      { name: "productId", type: "INT NULL" },
      { name: "productName", type: "VARCHAR(255) NULL" },
    ];
    for (const col of vouchersNewCols) {
      const [hasCol] = await conn.execute(`SHOW COLUMNS FROM vouchers LIKE '${col.name}'`);
      if (hasCol.length === 0) {
        console.log(`🛠️ Adding column '${col.name}' to vouchers...`);
        await conn.execute(`ALTER TABLE vouchers ADD COLUMN ${col.name} ${col.type}`);
      }
    }

    // 2. Alter orders table if columns are missing
    console.log("Ensuring orders table columns...");
    const ordersNewCols = [
      { name: "sellerVoucherCode", type: "VARCHAR(100) NULL" },
      { name: "sellerVoucherDiscount", type: "INT NULL" },
    ];
    for (const col of ordersNewCols) {
      const [hasCol] = await conn.execute(`SHOW COLUMNS FROM orders LIKE '${col.name}'`);
      if (hasCol.length === 0) {
        console.log(`🛠️ Adding column '${col.name}' to orders...`);
        await conn.execute(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`);
      }
    }

    // 3. Create collab_requests table if it doesn't exist
    console.log("Ensuring collab_requests table exists...");
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS collab_requests (
        id VARCHAR(255) PRIMARY KEY,
        fromSellerId VARCHAR(255) NOT NULL,
        fromSellerName VARCHAR(255) NOT NULL,
        toSellerId VARCHAR(255) NOT NULL,
        toSellerName VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        createdAt VARCHAR(255) NOT NULL,
        responseAt VARCHAR(255) NULL,
        productId INT NULL,
        productName VARCHAR(255) NULL,
        productPrice DECIMAL(15,2) NULL,
        productImage VARCHAR(500) NULL,
        proposedPrice DECIMAL(15,2) NULL,
        proposedQuantity INT NULL,
        commissionPercent INT NULL,
        feedbackMessage TEXT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("collab_requests table is verified!");

    // 4. Print columns for validation
    console.log("\n--- Vouchers columns ---");
    const [vCols] = await conn.query("SHOW COLUMNS FROM vouchers");
    vCols.forEach(c => console.log(`- ${c.Field}: ${c.Type}`));

    console.log("\n--- Orders columns ---");
    const [oCols] = await conn.query("SHOW COLUMNS FROM orders");
    oCols.forEach(c => console.log(`- ${c.Field}: ${c.Type}`));

    console.log("\n--- Collab Requests columns ---");
    const [crCols] = await conn.query("SHOW COLUMNS FROM collab_requests");
    crCols.forEach(c => console.log(`- ${c.Field}: ${c.Type}`));

    await conn.end();
    console.log("\nMigration completed and verified successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}
run();
