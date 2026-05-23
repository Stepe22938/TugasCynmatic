import { Router } from "express";
import { migrateData } from "@workspace/db/migrate";
import { pool } from "@workspace/db";

const router = Router();

// GET /api/db/info — returns parsed connection config
router.get("/db/info", async (req, res) => {
  try {
    const dbUrl = process.env.DATABASE_URL || "";
    // Parse DATABASE_URL format: mysql://user:password@host:port/database
    const matches = dbUrl.match(/mysql:\/\/(.*):(.*)@(.*):(.*)\/(.*)/);
    if (matches) {
      const [, user, , host, port, database] = matches;
      res.json({
        host,
        port,
        user,
        database,
        connectionType: "VPS Remote Mode"
      });
    } else {
      res.json({
        host: "185.128.227.237",
        port: "3306",
        user: "root",
        database: "cynmatic_db",
        connectionType: "VPS Remote Mode"
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/db/tables — returns dynamic table counts
router.get("/db/tables", async (req, res) => {
  try {
    const allowedTables = ["users", "products", "orders", "reviews", "auctions", "polls", "tickets", "vouchers", "redeem_codes"];
    const results = [];
    
    for (const table of allowedTables) {
      try {
        const [countRow]: any = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        results.push({
          name: table,
          count: countRow[0].count
        });
      } catch (err: any) {
        results.push({
          name: table,
          count: 0,
          error: err.message
        });
      }
    }
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/db/tables/:tableName — returns specific table rows with simple injection guard
router.get("/db/tables/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    const allowedTables = ["users", "products", "orders", "reviews", "auctions", "polls", "tickets", "vouchers", "redeem_codes"];
    
    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({ error: "Access Denied: Invalid table name." });
    }
    
    const [rows] = await pool.query(`SELECT * FROM ${tableName} LIMIT 200`);
    res.json({
      table: tableName,
      rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/migrate — called from AdminPage "Migrate to VPS" button
router.post("/migrate", async (req, res) => {
  try {
    const { users, products } = req.body;
    if (!Array.isArray(users) || !Array.isArray(products)) {
      return res.status(400).json({ error: "Data users dan products harus berupa array." });
    }

    console.log(`[MIGRATE] Starting: ${users.length} users, ${products.length} products`);
    await migrateData({ users, products });
    res.json({ message: `Migrasi ke MariaDB berhasil! ${users.length} users, ${products.length} produk.` });
  } catch (error: any) {
    console.error("[MIGRATE] Error:", error);
    res.status(500).json({ error: error.message || "Gagal melakukan migrasi data." });
  }
});

export default router;
