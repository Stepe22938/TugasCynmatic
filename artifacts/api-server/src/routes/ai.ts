/**
 * ai.ts — AI Product Authenticity Checker
 * POST /api/ai/check-product
 * Body: { name, description, price, category, provider, apiKey }
 * Returns: { verdict, confidence, reasoning, tips }
 */
import { Router } from "express";
import OpenAI from "openai";
import { db } from "@workspace/db";
import { aiSettings, reviews, aiAnalysisHistory, aiCompanionModels } from "@workspace/db/schema";
import { eq, desc, asc } from "drizzle-orm";

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

type AIProvider = "openrouter" | "obscura";

const normalizeProvider = (provider?: string): AIProvider =>
  provider === "obscura" ? "obscura" : "openrouter";

const messagesToPrompt = (messages: { role: string; content: string }[]) =>
  messages
    .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
    .join("\n\n");

const getLatestUserPrompt = (messages: { role: string; content: string }[]) =>
  [...messages].reverse().find((message) => message.role === "user")?.content || messages[messages.length - 1]?.content || "";

const extractAIText = (data: any): string => {
  if (typeof data === "string") return data;
  const text =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.text ||
    data?.text ||
    data?.response ||
    data?.result ||
    data?.output ||
    (typeof data?.data === "string" ? data.data : "") ||
    data?.data?.text ||
    data?.data?.response ||
    data?.data?.result ||
    data?.data?.output ||
    "";
  return String(text).trim();
};

async function callObscuraGenerate(args: {
  apiKey: string;
  prompt: string;
  systemPrompt?: string;
  model?: string;
  signal?: AbortSignal;
}) {
  const cleanKey = args.apiKey.trim();
  const url = new URL("https://api.obscuraworks.org/api/ai/groq");
  url.searchParams.set("prompt", args.prompt);
  url.searchParams.set("apikey", cleanKey);
  url.searchParams.set("apiKey", cleanKey);
  url.searchParams.set("key", cleanKey);
  if (args.model) url.searchParams.set("model", args.model);
  if (args.systemPrompt) url.searchParams.set("system", args.systemPrompt);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-API-Key": cleanKey,
      "Authorization": `Bearer ${cleanKey}`,
      "Accept": "application/json",
    },
    signal: args.signal,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => null) as any;
    if (response.status === 401) {
      throw new Error("ObscuraWorks menolak API key. Pastikan key obs-... sudah benar dan tersimpan di Admin Page.");
    }
    throw new Error(errData?.error?.message || errData?.message || `ObscuraWorks Groq error ${response.status}`);
  }

  return extractAIText(await response.json());
}

async function callObscuraCloudflare(args: {
  apiKey: string;
  prompt: string;
  systemPrompt?: string;
  modelId: string;
  signal?: AbortSignal;
}): Promise<{ content: string; imageUrl?: string }> {
  const cleanKey = args.apiKey.trim();
  const response = await fetch("https://api.obscuraworks.org/api/ai/cloudflare", {
    method: "POST",
    headers: {
      "Accept": "application/json, image/*, audio/*, video/*",
      "Authorization": `Bearer ${cleanKey}`,
      "Content-Type": "application/json",
    },
    signal: args.signal,
    body: JSON.stringify({
      modelId: args.modelId,
      prompt: args.prompt,
      ...(args.systemPrompt ? { system: args.systemPrompt, systemPrompt: args.systemPrompt } : {}),
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => null) as any;
    if (response.status === 401) {
      throw new Error("ObscuraWorks menolak API key. Pastikan key obs-... sudah benar dan tersimpan di Admin Page.");
    }
    throw new Error(errData?.error?.message || errData?.message || `ObscuraWorks Cloudflare error ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.startsWith("image/")) {
    const bytes = Buffer.from(await response.arrayBuffer());
    return { content: "", imageUrl: `data:${contentType};base64,${bytes.toString("base64")}` };
  }

  if (contentType.includes("text/html")) {
    const html = await response.text();
    const src =
      html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ||
      html.match(/https?:\/\/[^"'\s<>]+\.(?:png|jpe?g|webp|gif)(?:\?[^"'\s<>]*)?/i)?.[0] ||
      "";
    return src ? { content: "", imageUrl: src } : { content: html };
  }

  const data = await response.json() as any;
  const rawImage =
    data?.image ||
    data?.imageUrl ||
    data?.url ||
    data?.data?.image ||
    data?.data?.imageUrl ||
    data?.data?.url ||
    "";
  if (typeof rawImage === "string" && rawImage.trim()) {
    const value = rawImage.trim();
    const imageUrl = value.startsWith("http") || value.startsWith("data:image")
      ? value
      : `data:image/png;base64,${value}`;
    return { content: extractAIText(data), imageUrl };
  }

  const text = extractAIText(data);
  if (text.startsWith("data:image") || /^https?:\/\/.+\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(text)) {
    return { content: "", imageUrl: text };
  }
  return { content: text };
}

// ─── GET GLOBAL AI CONFIG FROM DB ──────────────────────────────────
router.get("/ai/settings", async (req, res) => {
  try {
    const settings = await db.select().from(aiSettings).where(eq(aiSettings.id, "global"));
    if (settings.length > 0) {
      res.json({
        aiProvider: settings[0].aiProvider || "openrouter",
        openrouterKey: settings[0].openrouterKey || "",
        openrouterModel: settings[0].openrouterModel || "",
        obscuraKey: settings[0].obscuraKey || "",
        obscuraModel: settings[0].obscuraModel || "",
      });
    } else {
      res.json({ aiProvider: "openrouter", openrouterKey: "", openrouterModel: "", obscuraKey: "", obscuraModel: "" });
    }
  } catch (error: any) {
    console.error("[AI] Get settings failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── SAVE GLOBAL AI CONFIG TO DB ────────────────────────────────────
router.post("/ai/settings", async (req, res) => {
  try {
    const { aiProvider, openrouterKey, openrouterModel, obscuraKey, obscuraModel } = req.body as {
      aiProvider?: string;
      openrouterKey?: string;
      openrouterModel?: string;
      obscuraKey?: string;
      obscuraModel?: string;
    };

    const payload = {
      aiProvider: normalizeProvider(aiProvider),
      openrouterKey: openrouterKey || "",
      openrouterModel: openrouterModel || "",
      obscuraKey: obscuraKey || "",
      obscuraModel: obscuraModel || "",
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
  const { name, description, price, category, provider, aiProvider, apiKey, obscuraKey, model: bodyModel, productId } = req.body as {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    provider?: string;
    aiProvider?: string;
    apiKey?: string;
    obscuraKey?: string;
    model?: string;
    productId?: number;
  };

  if (!name || !description) {
    res.status(400).json({ error: "name dan description wajib diisi." });
    return;
  }

  let resolvedProvider = normalizeProvider(aiProvider || provider);
  let resolvedKey = resolvedProvider === "obscura" ? obscuraKey : apiKey;
  let resolvedModel = bodyModel?.trim();

  if (!resolvedKey) {
    try {
      const settings = await db.select().from(aiSettings).where(eq(aiSettings.id, "global"));
      if (settings.length > 0) {
        resolvedProvider = normalizeProvider(aiProvider || provider || settings[0].aiProvider || undefined);
        resolvedKey = resolvedProvider === "obscura"
          ? settings[0].obscuraKey || undefined
          : settings[0].openrouterKey || undefined;
        if (!resolvedModel) {
          resolvedModel = resolvedProvider === "obscura"
            ? settings[0].obscuraModel || undefined
            : settings[0].openrouterModel || undefined;
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
    if (resolvedProvider === "obscura") {
      const raw = await callObscuraGenerate({
        apiKey: resolvedKey,
        prompt,
        systemPrompt: "Kamu adalah asisten Auditor AI Keaslian Produk yang membalas HANYA dalam format JSON valid.",
        model: resolvedModel || undefined,
      });
      res.json(extractJson(raw || "{}"));
      return;
    }

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
  const { messages, apiKey, obscuraKey, aiProvider, model: bodyModel } = req.body as {
    messages: { role: string; content: string }[];
    apiKey?: string;
    obscuraKey?: string;
    aiProvider?: string;
    model?: string;
  };

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "messages wajib diisi dalam format array." });
    return;
  }

  let resolvedProvider = normalizeProvider(aiProvider);
  let resolvedKey = resolvedProvider === "obscura" ? obscuraKey : apiKey;
  let resolvedModel = bodyModel?.trim();

  if (!resolvedKey) {
    try {
      const settings = await db.select().from(aiSettings).where(eq(aiSettings.id, "global"));
      if (settings.length > 0) {
        resolvedProvider = normalizeProvider(aiProvider || settings[0].aiProvider || undefined);
        resolvedKey = resolvedProvider === "obscura"
          ? settings[0].obscuraKey || undefined
          : settings[0].openrouterKey || undefined;
        if (!resolvedModel) {
          resolvedModel = resolvedProvider === "obscura"
            ? settings[0].obscuraModel || undefined
            : settings[0].openrouterModel || undefined;
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
    if (resolvedProvider === "obscura") {
      const content = await callObscuraGenerate({
        apiKey: resolvedKey,
        prompt: messagesToPrompt(messages),
        systemPrompt: "Kamu adalah asisten AI TokoArthur yang ramah dan membantu. Jawab dalam bahasa Indonesia yang natural.",
        model: resolvedModel,
      });
      res.json({ role: "assistant", content });
      return;
    }

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
  const { prompt, apiKey, obscuraKey, aiProvider, model: bodyModel } = req.body as {
    prompt?: string;
    apiKey?: string;
    obscuraKey?: string;
    aiProvider?: string;
    model?: string;
  };

  if (!prompt) {
    res.status(400).json({ error: "prompt wajib diisi." });
    return;
  }

  let resolvedProvider = normalizeProvider(aiProvider);
  let resolvedKey = resolvedProvider === "obscura" ? obscuraKey : apiKey;
  let resolvedModel = bodyModel?.trim();

  if (!resolvedKey) {
    try {
      const settings = await db.select().from(aiSettings).where(eq(aiSettings.id, "global"));
      if (settings.length > 0) {
        resolvedProvider = normalizeProvider(aiProvider || settings[0].aiProvider || undefined);
        resolvedKey = resolvedProvider === "obscura"
          ? settings[0].obscuraKey || undefined
          : settings[0].openrouterKey || undefined;
        if (!resolvedModel) {
          resolvedModel = resolvedProvider === "obscura"
            ? settings[0].obscuraModel || undefined
            : settings[0].openrouterModel || undefined;
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
    if (resolvedProvider === "obscura") {
      const raw = await callObscuraGenerate({
        apiKey: resolvedKey,
        prompt: `${systemInstructions}\n\nBuatkan produk berdasarkan arahan berikut: "${prompt}"`,
        systemPrompt: "Hasilkan jawaban hanya berupa JSON valid.",
        model: resolvedModel || undefined,
      });
      res.json(extractJson(raw || "{}"));
      return;
    }

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

// ─── AI ANALYSIS HISTORY - SAVE ANALYSIS LOGS ──────────────────────────────
router.post("/ai/analysis-history", async (req, res) => {
  try {
    const { ticketId, userId, userName, sentiment, tags, summary, description, aiResponse } = req.body as {
      ticketId?: string;
      userId?: string;
      userName?: string;
      sentiment?: string;
      tags?: string[];
      summary?: string;
      description?: string;
      aiResponse?: string;
    };

    if (!ticketId || !userId || !userName || !sentiment || !tags || !summary || !description) {
      res.status(400).json({ error: "Kolom ticketId, userId, userName, sentiment, tags, summary, dan description wajib diisi." });
      return;
    }

    const payload = {
      id: `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ticketId,
      userId,
      userName,
      sentiment,
      tags: tags,
      summary,
      description,
      aiResponse: aiResponse || null,
    };

    await db.insert(aiAnalysisHistory).values(payload);

    res.json({ success: true, data: payload });
  } catch (error: any) {
    console.error("[AI] Save analysis history failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── AI ANALYSIS HISTORY - FETCH ANALYSIS LOGS ─────────────────────────────
router.get("/ai/analysis-history", async (req, res) => {
  try {
    const { userId } = req.query as { userId?: string };

    let results;
    if (userId) {
      results = await db
        .select()
        .from(aiAnalysisHistory)
        .where(eq(aiAnalysisHistory.userId, userId))
        .orderBy(desc(aiAnalysisHistory.createdAt));
    } else {
      results = await db
        .select()
        .from(aiAnalysisHistory)
        .orderBy(desc(aiAnalysisHistory.createdAt));
    }

    res.json(results);
  } catch (error: any) {
    console.error("[AI] Fetch analysis history failed:", error);
    res.status(500).json({ error: error.message });
  }
});


// ─── AI COMPANION MODELS — SEED DEFAULTS ────────────────────────────────────
const DEFAULT_COMPANION_MODELS = [
  { id: "cmodel-1", name: "GPT-4o Mini", modelId: "openai/gpt-4o-mini", description: "OpenAI cepat & hemat, sangat pintar untuk teks umum", color: "#10a37f", sortOrder: 1 },
  { id: "cmodel-2", name: "Claude 3 Haiku", modelId: "anthropic/claude-3-haiku", description: "Anthropic: ringan, cepat, aman, dan konsisten", color: "#d97706", sortOrder: 2 },
  { id: "cmodel-3", name: "Gemma 3 27B", modelId: "google/gemma-3-27b-it:free", description: "Google open-source, gratis di OpenRouter", color: "#4285f4", sortOrder: 3 },
  { id: "cmodel-4", name: "Llama 4 Maverick", modelId: "meta-llama/llama-4-maverick:free", description: "Meta open-source terbaru, powerful & gratis", color: "#6366f1", sortOrder: 4 },
];

// ─── GET COMPANION MODELS LIST ───────────────────────────────────────────────
router.get("/ai/companion-models", async (req, res) => {
  try {
    let models = await db.select().from(aiCompanionModels).orderBy(asc(aiCompanionModels.sortOrder));

    // Seed defaults if empty
    if (models.length === 0) {
      await db.insert(aiCompanionModels).values(
        DEFAULT_COMPANION_MODELS.map(m => ({ ...m, isEnabled: true }))
      );
      models = await db.select().from(aiCompanionModels).orderBy(asc(aiCompanionModels.sortOrder));
    }

    res.json(models);
  } catch (error: any) {
    console.error("[AI] Get companion models failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── ADD / UPDATE A COMPANION MODEL (Admin) ──────────────────────────────────
router.post("/ai/companion-models", async (req, res) => {
  try {
    const { id, name, modelId, description, color, isEnabled, sortOrder } = req.body as {
      id?: string;
      name: string;
      modelId: string;
      description?: string;
      color?: string;
      isEnabled?: boolean;
      sortOrder?: number;
    };

    if (!name || !modelId) {
      res.status(400).json({ error: "name dan modelId wajib diisi." });
      return;
    }

    if (id) {
      // Update existing
      await db.update(aiCompanionModels).set({
        name, modelId,
        description: description || null,
        color: color || "#6366f1",
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        sortOrder: sortOrder || 0,
      }).where(eq(aiCompanionModels.id, id));
      res.json({ success: true, id });
    } else {
      // Insert new
      const newId = `cmodel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await db.insert(aiCompanionModels).values({
        id: newId, name, modelId,
        description: description || null,
        color: color || "#6366f1",
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        sortOrder: sortOrder || 0,
      });
      res.json({ success: true, id: newId });
    }
  } catch (error: any) {
    console.error("[AI] Save companion model failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── DELETE A COMPANION MODEL (Admin) ────────────────────────────────────────
router.delete("/ai/companion-models/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(aiCompanionModels).where(eq(aiCompanionModels.id, id));
    res.json({ success: true });
  } catch (error: any) {
    console.error("[AI] Delete companion model failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── PARALLEL MULTI-MODEL COMPANION CHAT ─────────────────────────────────────
router.post("/ai/companion", async (req, res) => {
  const { messages, modelIds, apiKey, researchMode } = req.body as {
    messages: { role: string; content: string }[];
    modelIds: string[]; // Array of OpenRouter model IDs to run in parallel
    apiKey?: string;
    researchMode?: boolean;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages wajib diisi." });
    return;
  }
  if (!modelIds || !Array.isArray(modelIds) || modelIds.length === 0) {
    res.status(400).json({ error: "modelIds wajib diisi." });
    return;
  }
  if (modelIds.length > 4) {
    res.status(400).json({ error: "Maksimal 4 model yang bisa dibandingkan sekaligus." });
    return;
  }

  // Resolve API key from DB
  let resolvedKey: string | undefined = apiKey;
  if (!resolvedKey) {
    try {
      const settings = await db.select().from(aiSettings).where(eq(aiSettings.id, "global"));
      if (settings.length > 0) {
        resolvedKey = settings[0].openrouterKey || undefined;
      }
    } catch (dbErr) {
      console.error("[AI] Failed to fetch settings from DB for companion:", dbErr);
    }
  }
  resolvedKey = resolvedKey || process.env.OPENROUTER_API_KEY;

  if (!resolvedKey) {
    res.status(503).json({ error: "API key belum dikonfigurasi. Silakan masukkan API key di Pengaturan AI pada panel admin." });
    return;
  }

  const cleanKey = resolvedKey.trim().replace(/^Bearer\s+/i, "");
  const MODEL_TIMEOUT_MS = 120000;

  // Call all models in parallel
  const results = await Promise.allSettled(
    modelIds.map(async (modelId) => {
      const startTime = Date.now();
      const resolvedModelId = researchMode && !modelId.endsWith(":online")
        ? `${modelId}:online`
        : modelId;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${cleanKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://toko-online.replit.app",
            "X-Title": "TokoArthur AI Companion",
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: resolvedModelId,
            messages,
            max_tokens: 900,
            temperature: 0.7,
          }),
        });
      } catch (err: any) {
        const latency = Date.now() - startTime;
        if (err?.name === "AbortError") {
          throw {
            modelId,
            latency,
            message: `Model terlalu lama merespons (timeout ${Math.round(MODEL_TIMEOUT_MS / 1000)} detik). Coba model lain atau prompt lebih pendek.`,
          };
        }
        throw { modelId, latency, message: err?.message || "Gagal menghubungi OpenRouter." };
      } finally {
        clearTimeout(timeout);
      }

      const latency = Date.now() - startTime;

      if (!response.ok) {
        const errData = (await response.json()) as any;
        throw { modelId, latency, message: errData.error?.message || `Error ${response.status}` };
      }

      const data = (await response.json()) as any;
      const content: string = data.choices?.[0]?.message?.content?.trim() ?? "";
      return { modelId, content, latency };
    })
  );

  const responses = results.map((result) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      const reason = result.reason as any;
      return {
        modelId: reason?.modelId ?? "unknown",
        content: "",
        latency: reason?.latency ?? 0,
        error: reason?.message ?? "Gagal mendapatkan respons dari model ini.",
      };
    }
  });

  res.json({ responses });
});

router.post("/ai/companion/stream", async (req, res) => {
  const { messages, modelIds, apiKey, obscuraKey, obscuraModel, aiProvider, researchMode } = req.body as {
    messages: { role: string; content: string }[];
    modelIds: string[];
    apiKey?: string;
    obscuraKey?: string;
    obscuraModel?: string;
    aiProvider?: string;
    researchMode?: boolean;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages wajib diisi." });
    return;
  }
  if (!modelIds || !Array.isArray(modelIds) || modelIds.length === 0) {
    res.status(400).json({ error: "modelIds wajib diisi." });
    return;
  }
  if (modelIds.length > 4) {
    res.status(400).json({ error: "Maksimal 4 model yang bisa dibandingkan sekaligus." });
    return;
  }

  let resolvedProvider = normalizeProvider(aiProvider);
  let resolvedOpenRouterKey: string | undefined = apiKey;
  let resolvedObscuraKey: string | undefined = obscuraKey;
  let resolvedKey: string | undefined = resolvedProvider === "obscura" ? resolvedObscuraKey : resolvedOpenRouterKey;
  let resolvedObscuraModel: string | undefined = obscuraModel?.trim() || undefined;
  if (!resolvedKey) {
    try {
      const settings = await db.select().from(aiSettings).where(eq(aiSettings.id, "global"));
      if (settings.length > 0) {
        resolvedProvider = normalizeProvider(aiProvider || settings[0].aiProvider || undefined);
        resolvedOpenRouterKey = resolvedOpenRouterKey || settings[0].openrouterKey || undefined;
        resolvedObscuraKey = resolvedObscuraKey || settings[0].obscuraKey || undefined;
        resolvedKey = resolvedProvider === "obscura" ? resolvedObscuraKey : resolvedOpenRouterKey;
        resolvedObscuraModel = resolvedObscuraModel || settings[0].obscuraModel || undefined;
      }
    } catch (dbErr) {
      console.error("[AI] Failed to fetch settings from DB for companion stream:", dbErr);
    }
  }
  resolvedOpenRouterKey = resolvedOpenRouterKey || process.env.OPENROUTER_API_KEY;
  resolvedObscuraKey = resolvedObscuraKey || process.env.OBSCURA_API_KEY;
  resolvedKey = resolvedProvider === "obscura" ? resolvedObscuraKey : resolvedOpenRouterKey;

  if (!resolvedKey && !resolvedObscuraKey) {
    res.status(503).json({ error: `API key ${resolvedProvider === "obscura" ? "ObscuraWorks" : "OpenRouter"} belum dikonfigurasi. Silakan masukkan API key di Pengaturan AI pada panel admin.` });
    return;
  }

  const cleanKey = (resolvedOpenRouterKey || resolvedKey || "").trim().replace(/^Bearer\s+/i, "");
  const openRouterHeaders = {
    "Authorization": `Bearer ${cleanKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://toko-online.replit.app",
    "X-Title": "TokoArthur AI Companion",
  };
  const STREAM_MODEL_TIMEOUT_MS = 90000;
  const FALLBACK_MODEL_TIMEOUT_MS = 45000;

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const sendEvent = (payload: unknown) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  let clientClosed = false;
  req.on("close", () => {
    clientClosed = true;
  });

  const runWithTimeout = async <T>(timeoutMs: number, task: (signal: AbortSignal) => Promise<T>) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await task(controller.signal);
    } finally {
      clearTimeout(timeout);
    }
  };

  const formatCompanionError = (message: string) => {
    const lower = message.toLowerCase();
    if (lower.includes("free-models-per-day") || lower.includes("rate limit exceeded")) {
      return "Limit harian model gratis OpenRouter sudah habis untuk API key ini. Tambah credits di OpenRouter atau pilih model berbayar/non-free.";
    }
    if (lower.includes("provider returned error")) {
      return "Provider model sedang menolak request ini. Coba model lain atau tunggu beberapa saat.";
    }
    return message;
  };

  const streamModel = async (modelId: string) => {
    const startedAt = Date.now();
    const modelProvider: AIProvider = resolvedProvider === "obscura" || (!modelId.includes("/") && resolvedObscuraKey)
      ? "obscura"
      : "openrouter";
    const resolvedModelId = researchMode && !modelId.endsWith(":online")
      ? `${modelId}:online`
      : modelId;
    const modelMessages = [
      ...messages.slice(0, 1),
      {
        role: "system",
        content: `Kamu adalah model ${modelId} di arena perbandingan. Jawab dengan pendekatan dan gaya yang berbeda dari model lain: pilih struktur, contoh, analogi, dan prioritas analisismu sendiri. Jangan meniru format generik atau mengulang jawaban model lain.`,
      },
      ...messages.slice(1),
    ];

    sendEvent({ type: "start", modelId });

    try {
      if (modelProvider === "obscura") {
        if (!resolvedObscuraKey) {
          throw new Error("ObscuraWorks API key belum dikonfigurasi untuk model ini.");
        }
        const selectedObscuraModel = modelId.trim() || resolvedObscuraModel || "";
        const isCloudflareModel = /^\d+$/.test(selectedObscuraModel);
        const prompt = isCloudflareModel ? getLatestUserPrompt(messages) : messagesToPrompt(modelMessages);
        const result = await runWithTimeout(FALLBACK_MODEL_TIMEOUT_MS, async (signal) => {
          if (isCloudflareModel) {
            return await callObscuraCloudflare({
                apiKey: resolvedObscuraKey!,
                prompt,
                systemPrompt: ["5", "6"].includes(selectedObscuraModel) ? undefined : "You are a helpful assistant.",
                modelId: selectedObscuraModel,
                signal,
              });
          }
          const text = await callObscuraGenerate({
                apiKey: resolvedObscuraKey!,
                prompt,
                systemPrompt: "You are a helpful assistant.",
                model: selectedObscuraModel,
                signal,
              });
          return { content: text };
        });
        const content = typeof result === "string" ? result : result.content;
        const imageUrl = typeof result === "string" ? undefined : result.imageUrl;

        if (imageUrl) {
          sendEvent({ type: "image", modelId, imageUrl });
          sendEvent({ type: "done", modelId, latency: Date.now() - startedAt });
        } else if (content) {
          sendEvent({ type: "delta", modelId, delta: content });
          sendEvent({ type: "done", modelId, latency: Date.now() - startedAt });
        } else {
          sendEvent({
            type: "error",
            modelId,
            latency: Date.now() - startedAt,
            error: "ObscuraWorks tidak mengirim teks untuk request ini.",
          });
        }
        return;
      }

      const requestBody = {
        model: resolvedModelId,
        messages: modelMessages,
        max_tokens: 1200,
        temperature: 0.95,
        top_p: 0.95,
        presence_penalty: 0.25,
      };

      const response = await runWithTimeout(STREAM_MODEL_TIMEOUT_MS, (signal) =>
        fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: openRouterHeaders,
          signal,
          body: JSON.stringify({ ...requestBody, stream: true }),
        })
      );

      if (!response.ok || !response.body) {
        const errData = await response.json().catch(() => null) as any;
        throw new Error(errData?.error?.message || `OpenRouter error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let emittedText = false;

      const emitStreamChunk = (chunk: string) => {
        const lines = chunk
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith("data:"));

        for (const line of lines) {
          const data = line.replace(/^data:\s*/, "");
          if (!data || data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const choice = parsed.choices?.[0] || {};
            const delta =
              choice.delta?.content ||
              choice.message?.content ||
              choice.text ||
              "";
            if (delta) {
              emittedText = true;
              sendEvent({ type: "delta", modelId, delta });
            }
          } catch {
            // Ignore malformed stream fragments from upstream.
          }
        }
      };

      while (!clientClosed) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          emitStreamChunk(chunk);
        }
      }

      if (buffer.trim()) {
        emitStreamChunk(buffer);
      }

      if (emittedText) {
        sendEvent({ type: "done", modelId, latency: Date.now() - startedAt });
      } else {
        const fallbackResponse = await runWithTimeout(FALLBACK_MODEL_TIMEOUT_MS, (signal) =>
          fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: openRouterHeaders,
            signal,
            body: JSON.stringify({ ...requestBody, stream: false }),
          })
        );

        if (!fallbackResponse.ok) {
          const errData = await fallbackResponse.json().catch(() => null) as any;
          throw new Error(errData?.error?.message || `OpenRouter error ${fallbackResponse.status}`);
        }

        const fallbackData = await fallbackResponse.json() as any;
        const fallbackContent = (
          fallbackData.choices?.[0]?.message?.content ||
          fallbackData.choices?.[0]?.text ||
          ""
        ).trim();

        if (fallbackContent) {
          sendEvent({ type: "delta", modelId, delta: fallbackContent });
          sendEvent({ type: "done", modelId, latency: Date.now() - startedAt });
        } else {
          sendEvent({
            type: "error",
            modelId,
            latency: Date.now() - startedAt,
            error: "Model selesai tanpa mengirim teks. Provider tidak memberi output untuk model ini.",
          });
        }
      }
    } catch (err: any) {
      const isTimeout = err?.name === "AbortError";
      const rawMessage = err?.message || "Gagal mendapatkan respons dari model ini.";
      sendEvent({
        type: "error",
        modelId,
        latency: Date.now() - startedAt,
        error: isTimeout
          ? `Model tidak selesai dalam ${Math.round(STREAM_MODEL_TIMEOUT_MS / 1000)} detik. Coba matikan model ini atau pilih model lain.`
          : formatCompanionError(rawMessage),
      });
    }
  };

  await Promise.allSettled(modelIds.map(streamModel));
  if (!clientClosed) {
    sendEvent({ type: "complete" });
    res.end();
  }
});

export default router;
