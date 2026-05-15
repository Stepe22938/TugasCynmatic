import { Router } from "express";
import { migrateData } from "@workspace/db/migrate";

const router = Router();

router.post("/migrate", async (req, res) => {
  try {
    const { users, products } = req.body;
    if (!users || !products) {
      return res.status(400).json({ error: "Data users dan products diperlukan." });
    }

    await migrateData({ users, products });
    res.json({ message: "Migrasi data ke MySQL lokal berhasil!" });
  } catch (error: any) {
    console.error("Migration Error:", error);
    res.status(500).json({ error: error.message || "Gagal melakukan migrasi data." });
  }
});

export default router;
