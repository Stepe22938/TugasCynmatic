/**
 * ai.ts — AI Product Authenticity Checker
 * POST /api/ai/check-product
 * Body: { name, description, price, category }
 * Returns: { verdict, confidence, reasoning, tips }
 */
import { Router } from "express";
import OpenAI from "openai";

const router = Router();

router.post("/ai/check-product", async (req, res) => {
  const { name, description, price, category } = req.body as {
    name?: string; description?: string; price?: number; category?: string;
  };

  if (!name || !description) {
    res.status(400).json({ error: "name dan description wajib diisi." });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "AI service tidak tersedia. OPENAI_API_KEY belum dikonfigurasi." });
    return;
  }

  try {
    const client = new OpenAI({ apiKey });

    const prompt = `Kamu adalah asisten AI yang menilai keaslian produk e-commerce Indonesia.
Analisis produk berikut dan tentukan kemungkinan keasliannya:

Nama Produk: ${name}
Kategori: ${category ?? "Tidak diketahui"}
Harga: Rp ${price?.toLocaleString("id-ID") ?? "Tidak diketahui"}
Deskripsi: ${description}

Berikan penilaian dalam format JSON:
{
  "verdict": "asli" | "mencurigakan" | "palsu",
  "confidence": <angka 0-100 persen keyakinan>,
  "reasoning": "<penjelasan singkat dalam bahasa Indonesia, max 2 kalimat>",
  "tips": "<saran untuk pembeli dalam bahasa Indonesia, max 1 kalimat>"
}

Hanya balas dengan JSON, tidak ada teks lain.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    // Strip markdown code fences if present
    const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const result = JSON.parse(json);
    res.json(result);
  } catch (err) {
    req.log?.error(err, "AI check failed");
    res.status(500).json({ error: "Gagal menghubungi layanan AI. Coba lagi nanti." });
  }
});

export default router;
