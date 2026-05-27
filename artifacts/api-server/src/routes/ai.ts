/**
 * ai.ts — AI Product Authenticity Checker
 * POST /api/ai/check-product
 * Body: { name, description, price, category, provider, apiKey }
 * Returns: { verdict, confidence, reasoning, tips }
 */
import { Router } from "express";
import OpenAI from "openai";
import { db } from "@workspace/db";
import { aiSettings, reviews } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// ─── ROBUST JSON EXTRACTOR & REPAIR HELPER ──────────────────────────
function repairJson(jsonStr: string): string {
  let cleaned = jsonStr.trim();
  
  // 1. Strip trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");
  
  // 2. Fix unescaped newlines/tabs inside double-quoted string values
  cleaned = cleaned.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, p1) => {
    return '"' + p1.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t") + '"';
  });

  return cleaned;
}

function extractJson(raw: string): any {
  const trimmed = raw.trim();
  const firstBrace = trimmed.indexOf("{");
  const firstBracket = trimmed.indexOf("[");
  
  let startIdx = -1;
  let endIdx = -1;
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = trimmed.lastIndexOf("}");
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = trimmed.lastIndexOf("]");
  }
  
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    const cleaned = trimmed.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    return JSON.parse(repairJson(cleaned));
  }
  
  const jsonStr = trimmed.substring(startIdx, endIdx + 1);
  return JSON.parse(repairJson(jsonStr));
}

// ─── GET GLOBAL AI CONFIG FROM DB ──────────────────────────────────
router.get("/ai/settings", async (req, res) => {
  try {
    const settings = await db.select().from(aiSettings).where(eq(aiSettings.id, "global"));
    if (settings.length > 0) {
      res.json({
        openrouterKey: settings[0].openrouterKey || "",
        openrouterModel: settings[0].openrouterModel || "",
      });
    } else {
      res.json({ openrouterKey: "", openrouterModel: "" });
    }
  } catch (error: any) {
    console.error("[AI] Get settings failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── SAVE GLOBAL AI CONFIG TO DB ────────────────────────────────────
router.post("/ai/settings", async (req, res) => {
  try {
    const { openrouterKey, openrouterModel } = req.body as {
      openrouterKey?: string;
      openrouterModel?: string;
    };

    const payload = {
      openrouterKey: openrouterKey || "",
      openrouterModel: openrouterModel || "",
    };

    const existing = await db.select().from(aiSettings).where(eq(aiSettings.id, "global"));
    if (existing.length > 0) {
      await db.update(aiSettings).set(payload).where(eq(aiSettings.id, "global"));
    } else {
      await db.insert(aiSettings).values({ id: "global", ...payload });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("[AI] Save settings failed:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/ai/check-product", async (req, res) => {
  const { name, description, price, category, provider, apiKey, model: bodyModel, productId } = req.body as {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    provider?: string;
    apiKey?: string;
    model?: string;
    productId?: number;
  };

  if (!name || !description) {
    res.status(400).json({ error: "name dan description wajib diisi." });
    return;
  }

  let resolvedKey = apiKey;
  let resolvedModel = bodyModel?.trim();

  if (!resolvedKey) {
    try {
      const settings = await db.select().from(aiSettings).where(eq(aiSettings.id, "global"));
      if (settings.length > 0) {
        resolvedKey = settings[0].openrouterKey || undefined;
        if (!resolvedModel) {
          resolvedModel = settings[0].openrouterModel || undefined;
        }
      }
    } catch (dbErr) {
      console.error("[AI] Failed to fetch settings from DB:", dbErr);
    }
  }

  resolvedKey = resolvedKey || process.env.OPENROUTER_API_KEY;

  if (!resolvedKey) {
    res.status(503).json({
      error: "API key belum dikonfigurasi. Silakan masukkan API key di Pengaturan AI pada panel admin.",
    });
    return;
  }

  const model = resolvedModel || "openai/gpt-4o-mini";

  // ─── DB REVIEWS & PRODUCT SCORE STATISTICS EXTRACTION ───────────────
  let productReviews: any[] = [];
  let averageRating = 0;
  let totalReviews = 0;
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  if (productId) {
    try {
      productReviews = await db.select().from(reviews).where(eq(reviews.productId, Number(productId)));
      
      totalReviews = productReviews.length;
      if (totalReviews > 0) {
        const sum = productReviews.reduce((acc, curr) => acc + (curr.rating || 0), 0);
        averageRating = Number((sum / totalReviews).toFixed(1));
        
        productReviews.forEach((r) => {
          const rating = Math.min(5, Math.max(1, r.rating || 0)) as 5 | 4 | 3 | 2 | 1;
          ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
        });
      }
    } catch (dbErr) {
      console.error("[AI] Failed to fetch product reviews from DB for check-product:", dbErr);
    }
  }

  let reviewsText = "";
  if (productReviews.length > 0) {
    reviewsText = productReviews.map((r, i) => {
      return `Review #${i + 1}:
- Rating Bintang: ${r.rating} / 5
- Komentar Pembeli: "${r.comment || "(tidak ada komentar)"}"
- Pengirim: ${r.userName || "Anonim"}`;
    }).join("\n\n");
  } else {
    reviewsText = "Tidak ada ulasan pembeli untuk produk ini saat ini.";
  }

  const prompt = `Kamu adalah Auditor AI Keaslian Produk E-Commerce yang sangat skeptis, teliti, kritis, dan berpengalaman. Tugasmu adalah menilai keaslian produk berdasarkan detail produk DAN statistik rating serta ulasan pembeli asli dari database.

=== DETAIL PRODUK ===
Nama Produk: ${name}
Kategori: ${category ?? "Tidak diketahui"}
Harga: Rp ${price?.toLocaleString("id-ID") ?? "Tidak diketahui"}
Deskripsi: ${description}

=== PENGETAHUAN SKOR & RATING PRODUK ===
- Rata-Rata Rating Produk: ${averageRating > 0 ? averageRating : "Belum ada rating"} / 5.0
- Total Jumlah Ulasan: ${totalReviews} ulasan
- Distribusi Penilaian:
  * Bintang 5: ${ratingDistribution[5]} ulasan
  * Bintang 4: ${ratingDistribution[4]} ulasan
  * Bintang 3: ${ratingDistribution[3]} ulasan
  * Bintang 2: ${ratingDistribution[2]} ulasan
  * Bintang 1: ${ratingDistribution[1]} ulasan

=== ULASAN PEMBELI DARI DATABASE ===
${reviewsText}

=== INSTRUKSI AUDIT KRITIS ===
1. **Analisis Kontradiksi Rating vs Komentar**: Periksa ulasan dengan sangat teliti. Banyak pembeli di Indonesia memberikan rating bintang 5 karena takut/segan dengan penjual, tetapi menulis keluhan/ulasan jelek di komentar (misal: "Barang palsu", "jelek banget", "tidak sesuai gambar", "rusak"). JANGAN dengarkan jumlah bintang jika komentar tertulis negatif! Fokuslah pada PESAN tekstual ulasan!
2. **Kesesuaian Kualitas & Harga**: Nilai apakah harga masuk akal untuk kategori produk premium. Jika harga terlalu murah dibanding standar pasar, ini indikator kuat barang palsu atau tiruan.
3. **Analisis Manipulasi Rating (Fake Reviews)**: Jika ulasan terkesan stabil dan jujur tanpa rekayasa bot, berikan penilaian yang objektif.
4. **Berikan Verdict Kesimpulan Akhir**:
   - "asli": jika produk terbukti orisinal, deskripsi konsisten, harga masuk akal, dan ulasan pembeli positif stabil tanpa kontradiksi.
   - "mencurigakan": jika ada indikasi kontradiksi (seperti rating bintang tinggi tapi komentar komplain palsu/jelek, deskripsi meragukan, atau harga mencurigakan).
   - "palsu": jika banyak ulasan yang jelas-jelas menyatakan barang palsu/KW/tiruan, atau harga tidak masuk akal murahnya untuk barang branded.

Berikan penilaian dalam format JSON yang valid:
{
  "verdict": "asli" | "mencurigakan" | "palsu",
  "confidence": <angka 0-100 persen tingkat keyakinan/akurasi analisis>,
  "reasoning": "<kesimpulan analisis kritis terpadu dalam bahasa Indonesia, berfokus pada hasil audit deskripsi produk, statistik skor, dan deteksi kontradiksi ulasan pembeli secara objektif, max 3 kalimat>",
  "tips": "<saran tindakan konkret bagi calon pembeli dalam bahasa Indonesia, max 1 kalimat>"
}

Hanya balas dengan JSON valid, tanpa teks penjelasan lain di luar JSON.`;

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
        messages: [
          { role: "system", content: "Kamu adalah asisten Auditor AI Keaslian Produk yang membalas HANYA dalam format JSON valid. Dilarang menulis penjelasan, pembukaan, kata pengantar, atau pemikiran batin Anda (seperti 'We need to...'). Respon Anda harus langsung diawali dengan karakter '{' dan diakhiri dengan karakter '}'." },
          { role: "user", content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.1,
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
      result = extractJson(raw);
    } catch (parseErr: any) {
      console.error("Failed to parse AI check-product response:", raw);
      throw new Error(`AI memberikan format jawaban yang salah. Error: ${parseErr.message}. Respon mentah: "${raw.slice(0, 600)}${raw.length > 600 ? "..." : ""}"`);
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

  let resolvedKey = apiKey;
  let resolvedModel = bodyModel?.trim();

  if (!resolvedKey) {
    try {
      const settings = await db.select().from(aiSettings).where(eq(aiSettings.id, "global"));
      if (settings.length > 0) {
        resolvedKey = settings[0].openrouterKey || undefined;
        if (!resolvedModel) {
          resolvedModel = settings[0].openrouterModel || undefined;
        }
      }
    } catch (dbErr) {
      console.error("[AI] Failed to fetch settings from DB for chat:", dbErr);
    }
  }

  resolvedKey = resolvedKey || process.env.OPENROUTER_API_KEY;
  const model = resolvedModel || "openai/gpt-4o-mini";

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

router.post("/ai/generate-product", async (req, res) => {
  const { prompt, apiKey, model: bodyModel } = req.body as {
    prompt?: string;
    apiKey?: string;
    model?: string;
  };

  if (!prompt) {
    res.status(400).json({ error: "prompt wajib diisi." });
    return;
  }

  let resolvedKey = apiKey;
  let resolvedModel = bodyModel?.trim();

  if (!resolvedKey) {
    try {
      const settings = await db.select().from(aiSettings).where(eq(aiSettings.id, "global"));
      if (settings.length > 0) {
        resolvedKey = settings[0].openrouterKey || undefined;
        if (!resolvedModel) {
          resolvedModel = settings[0].openrouterModel || undefined;
        }
      }
    } catch (dbErr) {
      console.error("[AI] Failed to fetch settings from DB for generate-product:", dbErr);
    }
  }

  resolvedKey = resolvedKey || process.env.OPENROUTER_API_KEY;

  if (!resolvedKey) {
    res.status(503).json({
      error: "API key belum dikonfigurasi. Silakan masukkan API key di Pengaturan AI pada panel admin.",
    });
    return;
  }

  const model = resolvedModel || "openai/gpt-4o-mini";

  const systemInstructions = `Kamu adalah AI Asisten Pembuat Produk E-Commerce Sultan. Tugasmu adalah membuat data produk lengkap yang siap dijual berdasarkan arahan/prompt dari penjual.

Kategori yang valid adalah: ["Pakaian","Sepatu","Tas","Aksesori","Elektronik","Skincare & Kecantikan","Kesehatan","Makanan","Minuman","Rumah Tangga","Otomotif","Pre-Order","Lainnya"].
Pilih kategori yang paling cocok dari daftar di atas.

Berikan spesifikasi detail dalam format JSON yang valid dengan properti sebagai berikut:
- name: nama produk yang sangat premium, mewah, keren, dan menarik (max 50 karakter).
- category: harus salah satu dari kategori valid di atas.
- price: harga/valuasi realistis dalam satuan Rupiah (angka, misal: 1250000).
- stock: jumlah stok awal (angka, misal: 25).
- description: deskripsi singkat yang menggugah selera pembeli (1 kalimat ringkas, max 100 karakter).
- longDescription: deskripsi komprehensif singkat mengenai keunggulan produk (cukup 2-3 kalimat ringkas, max 200 karakter).
- image: URL foto Unsplash berkualitas tinggi dan langsung (Direct Image URL) yang sesuai dengan produk. Pilih URL Unsplash yang beresolusi w=500 (misal: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop" untuk sepatu, atau "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500" untuk jam/aksesori/elektronik, atau "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500" untuk tas, atau "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500" untuk pakaian). Pastikan link tersebut valid dan langsung merender gambar.
- specs: array berisi 2-3 spesifikasi teknis ringkas, masing-masing memiliki properti "label" dan "value". Contoh: [{"label": "Material", "value": "Full-Grain Italian Leather"}, {"label": "Garansi", "value": "5 Tahun Matrix Service"}, {"label": "Edisi", "value": "Sultan Limited Batch #01"}]
- isPreOrder: boolean (true/false) tergantung jika produk membutuhkan pre-order atau dibuat khusus.
- releaseDate: datetime-local string (misal: "2026-06-15T12:00") jika isPreOrder true, atau string kosong "" jika false.

Hasilkan jawaban hanya berupa JSON valid dan jangan sertakan penjelasan apa-apa di luar JSON.`;

  try {
    const cleanKey = resolvedKey.trim().replace(/^Bearer\s+/i, "");
    console.log(`[AI] Generating product using model "${model}". Key suffix: ...${cleanKey.slice(-4)}`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cleanKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://toko-online.replit.app",
        "X-Title": "Toko Online AI Generator",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemInstructions },
          { role: "user", content: `Buatkan produk berdasarkan arahan berikut: "${prompt}"` }
        ],
        max_tokens: 1500,
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as any;
      console.error("[AI] OpenRouter error response during generation:", JSON.stringify(errorData));
      throw { status: response.status, message: errorData.error?.message || "OpenRouter Error" };
    }

    const data = (await response.json()) as any;
    const raw = data.choices[0]?.message?.content?.trim() ?? "{}";
    
    let result;
    try {
      result = extractJson(raw);
    } catch (parseErr: any) {
      console.error("Failed to parse AI generate-product response:", raw);
      throw new Error(`AI memberikan format jawaban yang salah. Error: ${parseErr.message}. Respon mentah: "${raw.slice(0, 600)}${raw.length > 600 ? "..." : ""}"`);
    }

    res.json(result);
  } catch (err: any) {
    req.log?.error(err, "AI generation failed");
    const message = err.message || "Unknown error";
    res.status(err.status || 500).json({ error: `Gagal menghasilkan produk: ${message}` });
  }
});

export default router;
