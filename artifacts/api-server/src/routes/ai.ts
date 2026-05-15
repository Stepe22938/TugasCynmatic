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
    apiKey?: string;
    model?: string;
  };

  if (!name || !description) {
    res.status(400).json({ error: "name dan description wajib diisi." });
    return;
  }

  const resolvedKey = apiKey || process.env.OPENROUTER_API_KEY;

  if (!resolvedKey) {
    res.status(503).json({
      error: "API key belum dikonfigurasi. Silakan masukkan API key di Pengaturan AI pada panel admin.",
    });
    return;
  }

  const model = bodyModel?.trim() || "openai/gpt-4o-mini";

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
    const cleanKey = resolvedKey.trim().replace(/^Bearer\s+/i, "");
    console.log(`[AI] Processing check for "${name}" using model "${model}". Key suffix: ...${cleanKey.slice(-4)}`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cleanKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://toko-online.replit.app",
        "X-Title": "Toko Online AI Checker",
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as any;
      console.error("[AI] OpenRouter error response:", JSON.stringify(errorData));
      const status = response.status;
      const message = errorData.error?.message || "OpenRouter Error";
      throw { status, message };
    }

    const data = (await response.json()) as any;
    const raw = data.choices[0]?.message?.content?.trim() ?? "{}";
    
    let result;
    try {
      // Hilangkan markdown code blocks jika ada
      const jsonStr = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      result = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", raw);
      throw new Error("AI memberikan format jawaban yang salah. Silakan coba lagi.");
    }

    res.json(result);
  } catch (err) {
    req.log?.error(err, "AI check failed");
    const message = err instanceof Error ? err.message : "Unknown error";
    const status  = (err as { status?: number }).status ?? 0;

    if (status === 401 || message.includes("Incorrect API key") || message.includes("invalid_api_key")) {
      const lastThree = resolvedKey ? String(resolvedKey).slice(-3) : "???";
      res.status(401).json({ error: `API key tidak valid (akhiran: ...${lastThree}). Periksa kembali API key di Pengaturan AI pada panel admin.` });
    } else if (status === 402 || message.toLowerCase().includes("insufficient credits") || message.toLowerCase().includes("credit")) {
      res.status(402).json({ error: "Kredit API habis atau tidak cukup. Tambah kredit di akun OpenRouter kamu, lalu coba lagi." });
    } else if (status === 429 || message.includes("rate limit") || message.includes("Rate limit")) {
      res.status(429).json({ error: "Terlalu banyak permintaan. Tunggu beberapa saat lalu coba lagi." });
    } else {
      res.status(500).json({ error: `Gagal menghubungi layanan AI: ${message}` });
    }
  }
});

router.post("/ai/chat", async (req, res) => {
  const { messages, apiKey, model: bodyModel } = req.body as {
    messages: { role: string; content: string }[];
    apiKey?: string;
    model?: string;
  };

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "messages wajib diisi dalam format array." });
    return;
  }

  const resolvedKey = apiKey || process.env.OPENROUTER_API_KEY;
  const model = bodyModel?.trim() || "openai/gpt-4o-mini";

  if (!resolvedKey) {
    res.status(503).json({ error: "API key belum dikonfigurasi." });
    return;
  }

  try {
    const cleanKey = resolvedKey.trim().replace(/^Bearer\s+/i, "");
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cleanKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://toko-online.replit.app",
        "X-Title": "Toko Online AI Chat",
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as any;
      throw { status: response.status, message: errorData.error?.message || "OpenRouter Error" };
    }

    const data = (await response.json()) as any;
    res.json(data.choices[0]?.message);
  } catch (err: any) {
    const message = err.message || "Internal Server Error";
    res.status(err.status || 500).json({ error: message });
  }
});

export default router;
