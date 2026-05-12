/**
 * ai.ts — AI Product Authenticity Checker
 * POST /api/ai/check-product
 * Body: { name, description, price, category, provider, apiKey }
 * Returns: { verdict, confidence, reasoning, tips }
 */
import { Router } from "express";
import OpenAI from "openai";

const router = Router();

router.post("/ai/check-product", async (req, res) => {
  const { name, description, price, category, provider, apiKey, model: bodyModel } = req.body as {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    provider?: "openai" | "openrouter";
    apiKey?: string;
    model?: string;
  };

  if (!name || !description) {
    res.status(400).json({ error: "name dan description wajib diisi." });
    return;
  }

  const resolvedProvider = provider ?? "openai";
  const resolvedKey = apiKey || (resolvedProvider === "openai" ? process.env.OPENAI_API_KEY : process.env.OPENROUTER_API_KEY);

  if (!resolvedKey) {
    res.status(503).json({
      error: "API key belum dikonfigurasi. Silakan masukkan API key di Pengaturan AI pada panel admin.",
    });
    return;
  }

  const clientOptions: ConstructorParameters<typeof OpenAI>[0] = { apiKey: resolvedKey };
  if (resolvedProvider === "openrouter") {
    clientOptions.baseURL = "https://openrouter.ai/api/v1";
    clientOptions.defaultHeaders = {
      "HTTP-Referer": "https://toko-online.replit.app",
      "X-Title": "Toko Online AI Checker",
    };
  }

  const model =
    bodyModel?.trim() ||
    (resolvedProvider === "openrouter" ? "openai/gpt-4o-mini" : "gpt-4o-mini");

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

  try {
    const client = new OpenAI(clientOptions);

    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const result = JSON.parse(json);
    res.json(result);
  } catch (err) {
    req.log?.error(err, "AI check failed");
    const message = err instanceof Error ? err.message : "Unknown error";
    const status  = (err as { status?: number }).status ?? 0;

    if (status === 401 || message.includes("Incorrect API key") || message.includes("invalid_api_key")) {
      res.status(401).json({ error: "API key tidak valid. Periksa kembali API key di Pengaturan AI pada panel admin." });
    } else if (status === 402 || message.toLowerCase().includes("insufficient credits") || message.toLowerCase().includes("credit")) {
      res.status(402).json({ error: "Kredit API habis atau tidak cukup. Tambah kredit di akun OpenRouter / OpenAI kamu, lalu coba lagi." });
    } else if (status === 429 || message.includes("rate limit") || message.includes("Rate limit")) {
      res.status(429).json({ error: "Terlalu banyak permintaan. Tunggu beberapa saat lalu coba lagi." });
    } else {
      res.status(500).json({ error: `Gagal menghubungi layanan AI: ${message}` });
    }
  }
});

export default router;
