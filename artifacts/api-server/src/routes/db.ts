import { Router } from "express";
import { migrateData } from "@workspace/db/migrate";

const router = Router();

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
