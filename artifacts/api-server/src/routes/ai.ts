/**
 * ai.ts — AI Product Authenticity Checker
 * POST /api/ai/check-product
 * Body: { name, description, price, category, provider, apiKey }
 * Returns: { verdict, confidence, reasoning, tips }
 */
import { Router } from "express";
import OpenAI from "openai";
import { db, pool } from "@workspace/db";
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
type AILimitScope = "chat" | "companion";

const DEFAULT_AI_CHAT_DAILY_LIMIT = 20;
const DEFAULT_AI_COMPANION_DAILY_LIMIT = 10;
const IMAGE_USAGE_TOKEN_COST = 5;

const normalizeProvider = (provider?: string): AIProvider =>
  provider === "obscura" ? "obscura" : "openrouter";

const normalizeLimit = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
};

const getJakartaDateKey = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const getRequestUserKey = (bodyUserId?: string, req?: any) => {
  const explicit = typeof bodyUserId === "string" ? bodyUserId.trim() : "";
  if (explicit) return explicit;
  return `guest:${req?.ip || req?.socket?.remoteAddress || "unknown"}`;
};

const isActiveAIProSubscriber = (row: any) => {
  const enabled =
    row?.isAISubscriber === true ||
    row?.isAISubscriber === 1 ||
    String(row?.isAISubscriber || "").toLowerCase() === "true";
  const expiryMs = row?.aiSubscriptionExpiry ? new Date(row.aiSubscriptionExpiry).getTime() : 0;
  return enabled && Number.isFinite(expiryMs) && expiryMs > Date.now();
};

async function getPlanAdjustedAILimit(userId: string | undefined, baseLimit: number) {
  const limit = normalizeLimit(baseLimit, 0);
  if (limit <= 0) return limit;

  const cleanUserId = typeof userId === "string" ? userId.trim() : "";
  if (!cleanUserId || cleanUserId.startsWith("guest:")) return limit;

  const [rows] = await pool.execute<any[]>(
    "SELECT isAISubscriber, aiSubscriptionExpiry FROM users WHERE id = ? LIMIT 1",
    [cleanUserId]
  );

  return isActiveAIProSubscriber(rows?.[0]) ? limit * 2 : limit;
}

async function consumeAILimit(args: {
  userKey: string;
  scope: AILimitScope;
  dailyLimit: number;
}) {
  const limit = normalizeLimit(args.dailyLimit, 0);
  const usageDate = getJakartaDateKey();
  const id = `${args.userKey}:${args.scope}:${usageDate}`;
  const [rows] = await pool.execute<any[]>(
    "SELECT usedCount FROM ai_usage_limits WHERE id = ? LIMIT 1",
    [id]
  );
  const used = Number(rows?.[0]?.usedCount || 0);
  if (limit <= 0) {
    const nextUsed = used + 1;
    await pool.execute(
      `INSERT INTO ai_usage_limits (id, userId, scope, usageDate, usedCount)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE usedCount = VALUES(usedCount), updatedAt = CURRENT_TIMESTAMP`,
      [id, args.userKey, args.scope, usageDate, nextUsed]
    );
    return {
      allowed: true,
      used: nextUsed,
      remaining: Number.POSITIVE_INFINITY,
      limit,
      usageId: id,
      usageDate,
    };
  }

  if (used >= limit) {
    return { allowed: false, used, remaining: 0, limit, usageId: id, usageDate };
  }

  const nextUsed = used + 1;
  await pool.execute(
    `INSERT INTO ai_usage_limits (id, userId, scope, usageDate, usedCount)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE usedCount = VALUES(usedCount), updatedAt = CURRENT_TIMESTAMP`,
    [id, args.userKey, args.scope, usageDate, nextUsed]
  );

  return { allowed: true, used: nextUsed, remaining: Math.max(0, limit - nextUsed), limit, usageId: id, usageDate };
}

const estimateTokensFromText = (value: unknown) => {
  const text = typeof value === "string" ? value : value == null ? "" : JSON.stringify(value);
  return Math.max(0, Math.ceil(text.length / 4));
};

const estimateTokensFromMessages = (messages: { role?: string; content?: string }[] = []) =>
  messages.reduce((total, message) => total + estimateTokensFromText(message.role) + estimateTokensFromText(message.content), 0);

const getProviderTokenUsage = (data: any) => {
  const total = Number(data?.usage?.total_tokens ?? data?.usage?.totalTokens);
  return Number.isFinite(total) && total > 0 ? Math.ceil(total) : 0;
};

async function addAIUsageTokens(usageId: string | undefined, estimatedTokens: number) {
  const tokens = Math.max(0, Math.ceil(Number(estimatedTokens) || 0));
  if (!usageId || tokens <= 0) return;
  await pool.execute(
    `UPDATE ai_usage_limits
     SET estimatedTokens = COALESCE(estimatedTokens, 0) + ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [tokens, usageId]
  );
}

async function getGlobalAISettings() {
  const settings = await db.select().from(aiSettings).where(eq(aiSettings.id, "global"));
  return settings[0];
}

const messagesToPrompt = (messages: { role: string; content: string }[]) =>
  messages
    .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
    .join("\n\n");

const getLatestUserPrompt = (messages: { role: string; content: string }[]) =>
  [...messages].reverse().find((message) => message.role === "user")?.content || messages[messages.length - 1]?.content || "";

const safeJsonArray = (value: unknown, fallback: any[] = []) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const normalizeSessionRow = (row: any) => ({
  id: String(row.id),
  title: String(row.title || "Sesi Baru"),
  messages: safeJsonArray(row.messages),
  createdAt: Number(row.createdAtMs || Date.now()),
});

const assertUserId = (userId: unknown) => {
  const normalized = typeof userId === "string" ? userId.trim() : "";
  if (!normalized) throw new Error("userId wajib diisi");
  return normalized;
};

// ─── DATE PARSER FOR REAL-TIME SEARCH RANGE ──────────────────────────────
function parseDateFromQuery(query: string): { start: string; end: string } | null {
  const clean = query.toLowerCase();
  
  // Indonesian months mapping
  const monthsMap: { [key: string]: string } = {
    januari: "01", jan: "01",
    februari: "02", feb: "02",
    maret: "03", mar: "03",
    april: "04", apr: "04",
    mei: "05",
    juni: "06", jun: "06",
    juli: "07", jul: "07",
    agustus: "08", agt: "08", aug: "08",
    september: "09", sep: "09",
    oktober: "10", okt: "10", oct: "10",
    november: "11", nov: "11",
    desember: "12", des: "12", dec: "12"
  };

  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(now);
  let currentYear = parseInt(parts.find(p => p.type === "year")?.value || "2026", 10);

  // Check for relative words: hari ini, sekarang
  if (/\b(hari ini|sekarang)\b/i.test(clean)) {
    const today = now;
    const tParts = formatter.formatToParts(today);
    const tStr = `${tParts.find(p => p.type === "year")?.value}-${tParts.find(p => p.type === "month")?.value}-${tParts.find(p => p.type === "day")?.value}`;
    
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yParts = formatter.formatToParts(yesterday);
    const yStr = `${yParts.find(p => p.type === "year")?.value}-${yParts.find(p => p.type === "month")?.value}-${yParts.find(p => p.type === "day")?.value}`;

    return { start: yStr, end: tStr };
  }

  // Check for relative words: kemarin, kemaren
  if (/\b(kemarin|kemaren)\b/i.test(clean)) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yParts = formatter.formatToParts(yesterday);
    const yYear = yParts.find(p => p.type === "year")?.value;
    const yMonth = yParts.find(p => p.type === "month")?.value;
    const yDay = yParts.find(p => p.type === "day")?.value;
    const yStr = `${yYear}-${yMonth}-${yDay}`;
    
    const dayBeforeYesterday = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const dbyParts = formatter.formatToParts(dayBeforeYesterday);
    const dbyStr = `${dbyParts.find(p => p.type === "year")?.value}-${dbyParts.find(p => p.type === "month")?.value}-${dbyParts.find(p => p.type === "day")?.value}`;
    
    const dayAfterYesterday = now;
    const dayAfterYesterdayParts = formatter.formatToParts(dayAfterYesterday);
    const dayAfterYesterdayStr = `${dayAfterYesterdayParts.find(p => p.type === "year")?.value}-${dayAfterYesterdayParts.find(p => p.type === "month")?.value}-${dayAfterYesterdayParts.find(p => p.type === "day")?.value}`;

    return { start: dbyStr, end: dayAfterYesterdayStr };
  }

  // Look for dates like "27 mei 2026", "27 mei", "13 mei 2026", "13 mei"
  const dateRegex = /(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|jun|jul|agt|aug|sep|okt|oct|nov|des|dec)\s*(\d{4})?/i;
  const match = clean.match(dateRegex);
  
  if (match) {
    const day = parseInt(match[1], 10);
    const monthName = match[2].toLowerCase();
    const month = monthsMap[monthName];
    const year = match[3] ? parseInt(match[3], 10) : currentYear;

    if (day >= 1 && day <= 31 && month) {
      const padDay = String(day).padStart(2, "0");
      const targetDate = new Date(`${year}-${month}-${padDay}T12:00:00`);
      if (!isNaN(targetDate.getTime())) {
        const prev = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000);
        const next = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
        
        const prevParts = formatter.formatToParts(prev);
        const nextParts = formatter.formatToParts(next);
        
        const startStr = `${prevParts.find(p => p.type === "year")?.value}-${prevParts.find(p => p.type === "month")?.value}-${prevParts.find(p => p.type === "day")?.value}`;
        const endStr = `${nextParts.find(p => p.type === "year")?.value}-${nextParts.find(p => p.type === "month")?.value}-${nextParts.find(p => p.type === "day")?.value}`;
        
        return { start: startStr, end: endStr };
      }
    }
  }

  return null;
}

// ─── CONVERSATIONAL STOPWORDS CLEANER FOR PRECISION KEYWORDS ─────────────
function cleanSearchQuery(query: string): string {
  let clean = query.trim().toLowerCase();
  
  // Remove leading slash if any
  clean = clean.replace(/^\//, "");
  
  // Remove common Indonesian conversational stopwords
  const stopWords = [
    "jabanin semuanya", "panjang gapapa", "gw mau lu", "saya mau kamu", "tolong jelaskan", 
    "tolong carikan", "tolong jabanin", "jabanin", "apa berita", "berita tentang", "tentang",
    "sekarang", "kemarin", "besok", "hari ini", "tanggal", "bulan", "tahun", "siapa", "dimana",
    "kapan", "mengapa", "bagaimana", "apakah", "apa saja", "tolong", "bisa", "tahu", "carikan",
    "dong", "sih", "lah", "anying", "tahu", "kemaren", "lu", "gw", "kamu", "aku", "anda",
    "juga", "mau", "dia", "punya", "pengetahuan", "yang", "ga", "terbatas", "kemarin", "apa",
    "berita", "hari", "saya", "ini", "itu", "minta", "bantu", "cari", "temukan", "info", "informasi"
  ];
  
  stopWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    clean = clean.replace(regex, "");
  });
  
  // Remove punctuation
  clean = clean.replace(/[?.!,;:"']/g, "");
  
  const terms = clean.split(/\s+/).filter(t => t.length > 1);
  if (terms.length === 0) return query;
  return terms.slice(0, 4).join(" ");
}

// ─── UNIVERSAL WEB SEARCH (DDG INSTANT + WIKIPEDIA + DDG LITE + GOOGLE NEWS) ──
async function fetchWebSearch(query: string): Promise<string> {
  let cleanedQuery = cleanSearchQuery(query);
  
  // Smart news-query fallback: if the query is asking about news/berita but the clean query is too short or empty, set fallback
  if ((!cleanedQuery || cleanedQuery.trim().length < 2) && /(berita|news|kejadian|peristiwa|hari ini|terbaru|terkini)/i.test(query)) {
    cleanedQuery = "berita terbaru";
  }
  
  console.log(`[Web Search] Cleaned user query: "${query}" => keyword: "${cleanedQuery}"`);

  if (!cleanedQuery || cleanedQuery.trim().length < 2) return "";

  // ── LAYER 0: Date-range specific Google News RSS ────────────────────────────
  const dateRange = parseDateFromQuery(query);
  
  if (dateRange) {
    try {
      console.log(`[Web Search] Date range parsed: ${dateRange.start} to ${dateRange.end}`);
      let strippedQuery = cleanedQuery
        .replace(/(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|jun|jul|agt|aug|sep|okt|oct|nov|des|dec)\s*(\d{4})?/gi, "")
        .replace(/\b(kemarin|kemaren|hari ini|besok|lusa)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
        
      let searchQuery = "";
      if (!strippedQuery || strippedQuery.length < 2) {
        searchQuery = `berita after:${dateRange.start} before:${dateRange.end}`;
      } else {
        searchQuery = `${strippedQuery} after:${dateRange.start} before:${dateRange.end}`;
      }
      
      console.log(`[Web Search] Querying Google News RSS for date-based news: "${searchQuery}"`);
      const newsResponse = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=id&gl=ID&ceid=ID:id`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
        }
      });
      
      if (newsResponse.ok) {
        const xml = await newsResponse.text();
        const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g);
        if (itemMatches && itemMatches.length > 0) {
          console.log(`[Web Search] Date-based search found ${itemMatches.length} results!`);
          return itemMatches.slice(0, 8).map((item, index) => {
            const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
            const sourceMatch = item.match(/<source[^>]*>([\s\S]*?)<\/source>/);
            const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() : "";
            const source = sourceMatch ? sourceMatch[1].trim() : "";
            return `${index + 1}. **${title}** (Sumber: ${source})`;
          }).join("\n\n");
        }
      }
      console.log(`[Web Search] Date-based search returned no results. Proceeding with general search fallback...`);
    } catch (err: any) {
      console.error("[Web Search] Date-based search error:", err.message);
    }
  }

  // ── LAYER 1: DuckDuckGo Instant Answers API (no API key, handles everything) ─
  try {
    console.log(`[Web Search] Layer 1: DuckDuckGo Instant API for: "${cleanedQuery}"`);
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanedQuery)}&format=json&no_html=1&skip_disambig=1`;
    const ddgRes = await fetch(ddgUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TokoArthurBot/1.0)" }
    });
    if (ddgRes.ok) {
      const ddgData = await ddgRes.json() as any;
      const results: string[] = [];

      // Abstract (Wikipedia summary)
      if (ddgData.AbstractText && ddgData.AbstractText.length > 30) {
        results.push(`📖 **${ddgData.Heading || cleanedQuery}** (${ddgData.AbstractSource || "DuckDuckGo"}):\n${ddgData.AbstractText}`);
      }

      // Answer (instant answer for calculations, conversions, definitions)
      if (ddgData.Answer && ddgData.Answer.length > 0) {
        results.push(`✅ **Jawaban Instan:** ${ddgData.Answer}`);
      }

      // Definition
      if (ddgData.Definition && ddgData.Definition.length > 10) {
        results.push(`📚 **Definisi (${ddgData.DefinitionSource}):** ${ddgData.Definition}`);
      }

      // Related topics (top 4)
      if (ddgData.RelatedTopics && ddgData.RelatedTopics.length > 0) {
        const topics = ddgData.RelatedTopics
          .filter((t: any) => t.Text && t.Text.length > 10)
          .slice(0, 4)
          .map((t: any, i: number) => `${i + 1}. ${t.Text}`);
        if (topics.length > 0) {
          results.push(`🔗 **Topik Terkait:**\n${topics.join("\n")}`);
        }
      }

      if (results.length > 0) {
        console.log(`[Web Search] DDG Instant returned ${results.length} results!`);
        return results.join("\n\n");
      }
    }
    console.log(`[Web Search] DDG Instant API returned no results. Trying Wikipedia...`);
  } catch (err: any) {
    console.warn(`[Web Search] DDG Instant API failed (${err.message}). Trying Wikipedia...`);
  }

  // ── LAYER 2: Wikipedia Search API (great for factual/historical/tech queries) ─
  try {
    // Detect if query is likely Indonesian or English
    const isIndonesian = /[^a-zA-Z0-9\s]|(\b(adalah|dan|atau|yang|untuk|dari|ke|ini|itu|di|dengan|pada|oleh|dalam|sebuah|bagaimana|cara|apa|siapa|mengapa|kapan|dimana|berapa)\b)/i.test(query);
    const wikiLang = isIndonesian ? "id" : "en";
    const wikiSearch = `https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanedQuery.replace(/\s+/g, "_"))}`;
    console.log(`[Web Search] Layer 2: Wikipedia (${wikiLang}) for: "${cleanedQuery}"`);
    const wikiRes = await fetch(wikiSearch, {
      headers: { "User-Agent": "TokoArthurBot/1.0 (educational use)" }
    });
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json() as any;
      if (wikiData.extract && wikiData.extract.length > 50 && wikiData.type !== "disambiguation") {
        const summary = wikiData.extract.slice(0, 800);
        console.log(`[Web Search] Wikipedia returned: "${wikiData.title}"`);
        return `📖 **${wikiData.title}** (Wikipedia ${wikiLang.toUpperCase()}):\n${summary}${wikiData.extract.length > 800 ? "..." : ""}`;
      }
    }
    // Try English Wikipedia if Indonesian found nothing
    if (isIndonesian) {
      const wikiEnSearch = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanedQuery.replace(/\s+/g, "_"))}`;
      const wikiEnRes = await fetch(wikiEnSearch, { headers: { "User-Agent": "TokoArthurBot/1.0" } });
      if (wikiEnRes.ok) {
        const wikiEnData = await wikiEnRes.json() as any;
        if (wikiEnData.extract && wikiEnData.extract.length > 50 && wikiEnData.type !== "disambiguation") {
          const summary = wikiEnData.extract.slice(0, 800);
          console.log(`[Web Search] Wikipedia EN returned: "${wikiEnData.title}"`);
          return `📖 **${wikiEnData.title}** (Wikipedia EN):\n${summary}${wikiEnData.extract.length > 800 ? "..." : ""}`;
        }
      }
    }
    console.log(`[Web Search] Wikipedia found nothing. Trying DuckDuckGo Lite scrape...`);
  } catch (err: any) {
    console.warn(`[Web Search] Wikipedia failed (${err.message}). Trying DDG Lite...`);
  }

  // ── LAYER 3: DuckDuckGo Lite HTML scrape ────────────────────────────────────
  try {
    console.log(`[Web Search] Layer 3: DuckDuckGo Lite scrape for: "${cleanedQuery}"`);
    const response = await fetch("https://lite.duckduckgo.com/lite/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      },
      body: `q=${encodeURIComponent(cleanedQuery)}`
    });
    if (response.ok) {
      const html = await response.text();
      const snippetMatches = html.match(/<td class="result-snippet">([\s\S]*?)<\/td>/g) ||
                             html.match(/<div class="result__snippet">([\s\S]*?)<\/div>/g) ||
                             html.match(/<td class="result__snippet">([\s\S]*?)<\/td>/g);
      const linkMatches = html.match(/<a class="result-link"[^>]*>([\s\S]*?)<\/a>/g);
      if (snippetMatches && snippetMatches.length > 0) {
        console.log(`[Web Search] DDG Lite returned ${snippetMatches.length} snippets!`);
        return snippetMatches.slice(0, 5).map((m, index) => {
          const cleanSnippet = m.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
          const cleanTitle = linkMatches && linkMatches[index]
            ? linkMatches[index].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
            : "Hasil Penelusuran Web";
          return `${index + 1}. **${cleanTitle}**: ${cleanSnippet}`;
        }).join("\n\n");
      }
    }
    console.log(`[Web Search] DDG Lite no results. Trying Google News RSS...`);
  } catch (err: any) {
    console.warn(`[Web Search] DDG Lite failed (${err.message}). Trying Google News RSS...`);
  }

  // ── LAYER 4: Google News RSS (for news/current events queries) ───────────────
  try {
    console.log(`[Web Search] Layer 4: Google News RSS for: "${cleanedQuery}"`);
    const newsResponse = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(cleanedQuery)}&hl=id&gl=ID&ceid=ID:id`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36" }
    });
    if (newsResponse.ok) {
      const xml = await newsResponse.text();
      const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g);
      if (itemMatches && itemMatches.length > 0) {
        console.log(`[Web Search] Google News RSS returned ${itemMatches.length} items!`);
        return itemMatches.slice(0, 6).map((item, index) => {
          const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
          const sourceMatch = item.match(/<source[^>]*>([\s\S]*?)<\/source>/);
          const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() : "";
          const source = sourceMatch ? sourceMatch[1].trim() : "";
          return `${index + 1}. **${title}** (Sumber: ${source})`;
        }).join("\n\n");
      }
    }
  } catch (err: any) {
    console.error("[Web Search] Google News RSS failed:", err.message);
  }

  return "";
}


// ─── DYNAMIC USER CONTEXT & GUARDRAILS HELPER ─────────────────────────────
async function buildDynamicSystemPrompt(userId: string | undefined, defaultBasePrompt: string, webSearchContext?: string) {
  const nowJakarta = new Date();
  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };
  const currentTimeString = new Intl.DateTimeFormat("id-ID", formatOptions).format(nowJakarta);
  const timeContext = `
=== INFORMASI WAKTU SEKARANG (REAL-TIME SYSTEM TIME) ===
- Hari/Tanggal/Waktu saat ini: ${currentTimeString} WIB
- Anda HARUS menggunakan referensi waktu nyata ini jika pengguna menanyakan hari, tanggal, bulan, tahun, jam, waktu, atau kapan transaksi/percakapan terjadi. JANGAN pernah katakan Anda tidak tahu waktu saat ini atau tidak memiliki akses ke waktu nyata/internet! Jawablah secara langsung menggunakan info waktu di atas.
`;

  let userContext = "";
  let ordersContext = "";
  const cleanUserId = typeof userId === "string" ? userId.trim() : "";
  
  if (cleanUserId && !cleanUserId.startsWith("guest:")) {
    try {
      const [rows] = await pool.execute<any[]>(
        "SELECT name, email, role, coins, balance, isSultan, isMyCryptoMember, isAISubscriber, bio FROM users WHERE id = ? LIMIT 1",
        [cleanUserId]
      );
      if (rows && rows.length > 0) {
        const u = rows[0];
        userContext = `
=== INFORMASI PENGGUNA (REAL-TIME DATABASE) ===
- Nama Pengguna: ${u.name}
- Email: ${u.email}
- Peran/Role: ${String(u.role).toUpperCase()} ${Number(u.isSultan) === 1 ? "(Sultan VIP Member)" : ""}
- Koin Toko: ${u.coins} Koin
- Saldo Rupiah: Rp ${Number(u.balance || 0).toLocaleString("id-ID")}
- Keanggotaan AI Pro: ${Number(u.isAISubscriber) === 1 ? "Aktif" : "Tidak Aktif"}
- Keanggotaan Crypto: ${Number(u.isMyCryptoMember) === 1 ? "Aktif" : "Tidak Aktif"}
- Bio Profil: "${u.bio || "Tidak ada bio"}"
`;
      }
    } catch (dbErr) {
      console.error("[AI] Gagal mengambil info user untuk personalisasi prompt:", dbErr);
    }

    try {
      const [orderRows] = await pool.execute<any[]>(
        "SELECT id, orderNumber, status, grandTotal, items FROM orders WHERE userId = ? ORDER BY date DESC LIMIT 10",
        [cleanUserId]
      );
      if (orderRows && orderRows.length > 0) {
        ordersContext = "\n=== RIWAYAT PEMBELIAN USER (DATABASE) ===\n" + orderRows.map((o) => {
          let itemNames = "";
          try {
            const items = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
            if (Array.isArray(items)) {
              itemNames = items.map((it: any) => `${it.name} (x${it.quantity})`).join(", ");
            } else if (items && typeof items === "object") {
              itemNames = items.name || JSON.stringify(items);
            }
          } catch(e) {
            itemNames = "Detail barang tidak terbaca";
          }
          return `- No Pesanan: ${o.orderNumber} | ID: ${o.id} | Status: ${String(o.status).toUpperCase()} | Total: Rp ${Number(o.grandTotal || 0).toLocaleString("id-ID")} | Barang: ${itemNames}`;
        }).join("\n") + "\n";
      } else {
        ordersContext = "\n=== RIWAYAT PEMBELIAN USER (DATABASE) ===\n- Pengguna belum memiliki riwayat transaksi/pembelian apapun di database TokoArthur.\n";
      }
    } catch (orderErr) {
      console.error("[AI] Gagal mengambil riwayat transaksi user dari DB:", orderErr);
      ordersContext = "\n=== RIWAYAT PEMBELIAN USER (DATABASE) ===\n- Gagal memuat riwayat pembelian dari database.\n";
    }
  }

  const integrationGuidelines = `
=== PANDUAN INTEGRASI DATA (INTEGRATION GUIDELINES) ===
1. Jika pengguna bertanya tentang pesanan mereka, riwayat pembelian mereka, koin, saldo, atau info profil mereka, Anda HARUS langsung membaca dan menjawab menggunakan data asli dari tabel "INFORMASI PENGGUNA" dan "RIWAYAT PEMBELIAN USER" di atas. JANGAN meminta pengguna untuk memberikan nomor pesanan ("TKO-") terlebih dahulu jika mereka hanya bertanya secara umum tentang pesanan atau transaksi mereka; langsung sebutkan saja daftar pesanan nyata yang ada di database di atas!
2. Jika ada pesanan nyata, sebutkan detailnya (nomor pesanan, nama barang, total harga, dan status). Jika database menyatakan pengguna belum memiliki riwayat pesanan, katakan secara jujur bahwa mereka belum melakukan transaksi apa pun.
`;

  let learnedContext = "";
  try {
    const [knowledgeRows] = await pool.execute<any[]>(
      "SELECT keyword, content FROM ai_knowledge ORDER BY createdAt DESC"
    );
    if (knowledgeRows && knowledgeRows.length > 0) {
      learnedContext = "\n=== PENGETAHUAN TAMBAHAN YANG DIPELAJARI (SELF-LEARNING MEMORY) ===\n" +
        knowledgeRows.map((k, index) => `${index + 1}. KEYWORD: "${k.keyword}" => FAKTA/KONTEN: "${k.content}"`).join("\n") +
        "\n💡 PANDUAN PENGGUNAAN: Jika pengguna bertanya tentang keyword atau topik yang tercantum di atas, gunakan fakta asli di atas sebagai referensi utama Anda untuk menjawab. Jawablah secara natural berdasarkan pengetahuan tambahan ini!\n";
    }
  } catch (err) {
    console.error("[AI] Gagal mengambil memori ai_knowledge untuk system prompt:", err);
  }

  const safetyGuardrails = `
=== ATURAN KEAMANAN & BATASAN MUTLAK (SECURITY GUARDRAILS) ===
1. DILARANG KERAS membantu, memberikan panduan langkah demi langkah, menulis kode script, mendesain program, atau menganalisis tools eksploitasi keamanan, serangan siber, DDoS (Distributed Denial of Service), pembuatan botnet, malware, ransomware, spyware, injeksi SQL, script hacking, exploit payload, bypass keamanan sistem, social engineering, atau aktivitas ofensif ilegal lainnya.
2. Jika pengguna meminta bantuan terkait hal di atas (misal membuat script DDoS, hacking, atau eksploitasi), tolak dengan tegas dan sampaikan bahwa aktivitas ofensif tersebut dilarang keras oleh protokol sistem TokoArthur.
3. Anda diperbolehkan menggunakan gaya bicara santai, gaul, kasual, bahkan berbicara agak kasar/sarkas jika pengguna berbicara kasar kepada Anda atau jika itu sesuai dengan persona interaksi. Namun, batasan keamanan siber pada poin 1 & 2 tetap berlaku mutlak tanpa pengecualian, siapapun penggunanya (termasuk Admin).
`;

  return [
    defaultBasePrompt,
    timeContext,
    userContext,
    ordersContext,
    webSearchContext,
    learnedContext,
    integrationGuidelines,
    safetyGuardrails
  ].filter(Boolean).join("\n\n");
}

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

async function isObscuraImageModel(modelId?: string) {
  const normalized = String(modelId || "").trim();
  if (!normalized) return false;
  if (/^(5|6)$/.test(normalized)) return true;
  if (/(image|flux|sdxl|schnell)/i.test(normalized)) return true;

  try {
    const [rows] = await pool.execute<any[]>(
      "SELECT name, description FROM ai_companion_models WHERE modelId = ? LIMIT 1",
      [normalized]
    );
    const meta = `${rows?.[0]?.name || ""} ${rows?.[0]?.description || ""}`;
    return /(image|gambar|flux|sdxl|schnell)/i.test(meta);
  } catch {
    return false;
  }
}

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
        aiChatDailyLimit: normalizeLimit((settings[0] as any).aiChatDailyLimit, DEFAULT_AI_CHAT_DAILY_LIMIT),
        aiCompanionDailyLimit: normalizeLimit((settings[0] as any).aiCompanionDailyLimit, DEFAULT_AI_COMPANION_DAILY_LIMIT),
      });
    } else {
      res.json({
        aiProvider: "openrouter",
        openrouterKey: "",
        openrouterModel: "",
        obscuraKey: "",
        obscuraModel: "",
        aiChatDailyLimit: DEFAULT_AI_CHAT_DAILY_LIMIT,
        aiCompanionDailyLimit: DEFAULT_AI_COMPANION_DAILY_LIMIT,
      });
    }
  } catch (error: any) {
    console.error("[AI] Get settings failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── SAVE GLOBAL AI CONFIG TO DB ────────────────────────────────────
router.post("/ai/settings", async (req, res) => {
  try {
    const { aiProvider, openrouterKey, openrouterModel, obscuraKey, obscuraModel, aiChatDailyLimit, aiCompanionDailyLimit } = req.body as {
      aiProvider?: string;
      openrouterKey?: string;
      openrouterModel?: string;
      obscuraKey?: string;
      obscuraModel?: string;
      aiChatDailyLimit?: number;
      aiCompanionDailyLimit?: number;
    };

    const existing = await db.select().from(aiSettings).where(eq(aiSettings.id, "global"));
    const current = existing[0] as any;
    const payload = {
      aiProvider: normalizeProvider(aiProvider),
      openrouterKey: openrouterKey || "",
      openrouterModel: openrouterModel || "",
      obscuraKey: obscuraKey || "",
      obscuraModel: obscuraModel || "",
      aiChatDailyLimit: aiChatDailyLimit === undefined
        ? normalizeLimit(current?.aiChatDailyLimit, DEFAULT_AI_CHAT_DAILY_LIMIT)
        : normalizeLimit(aiChatDailyLimit, DEFAULT_AI_CHAT_DAILY_LIMIT),
      aiCompanionDailyLimit: aiCompanionDailyLimit === undefined
        ? normalizeLimit(current?.aiCompanionDailyLimit, DEFAULT_AI_COMPANION_DAILY_LIMIT)
        : normalizeLimit(aiCompanionDailyLimit, DEFAULT_AI_COMPANION_DAILY_LIMIT),
    };

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

router.get("/ai/usage", async (req, res) => {
  try {
    const userId = assertUserId(req.query.userId);
    const usageDate = typeof req.query.date === "string" && req.query.date.trim()
      ? req.query.date.trim()
      : getJakartaDateKey();
    let aiChatDailyLimit = DEFAULT_AI_CHAT_DAILY_LIMIT;
    let aiCompanionDailyLimit = DEFAULT_AI_COMPANION_DAILY_LIMIT;

    try {
      const settingsRow = await getGlobalAISettings();
      if (settingsRow) {
        aiChatDailyLimit = normalizeLimit((settingsRow as any).aiChatDailyLimit, DEFAULT_AI_CHAT_DAILY_LIMIT);
        aiCompanionDailyLimit = normalizeLimit((settingsRow as any).aiCompanionDailyLimit, DEFAULT_AI_COMPANION_DAILY_LIMIT);
      }
    } catch (settingsErr) {
      console.error("[AI Usage] Failed to fetch AI limits:", settingsErr);
    }

    const [rows] = await pool.execute<any[]>(
      `SELECT scope, usedCount, estimatedTokens, updatedAt
       FROM ai_usage_limits
       WHERE userId = ? AND usageDate = ?`,
      [userId, usageDate]
    );
    const byScope = new Map(rows.map((row) => [String(row.scope), row]));

    const buildScope = async (scope: AILimitScope, label: string, baseLimit: number) => {
      const row = byScope.get(scope);
      const limit = await getPlanAdjustedAILimit(userId, baseLimit);
      const used = Number(row?.usedCount || 0);
      const estimatedTokens = Number(row?.estimatedTokens || 0);
      const remaining = limit <= 0 ? null : Math.max(0, limit - used);
      const percent = limit <= 0 ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
      return {
        scope,
        label,
        used,
        limit,
        remaining,
        estimatedTokens,
        percent,
        updatedAt: row?.updatedAt || null,
      };
    };

    const scopes = [
      await buildScope("chat", "AI Biasa", aiChatDailyLimit),
      await buildScope("companion", "AI Companion", aiCompanionDailyLimit),
    ];

    res.json({
      userId,
      usageDate,
      totalRequests: scopes.reduce((total, scope) => total + scope.used, 0),
      totalEstimatedTokens: scopes.reduce((total, scope) => total + scope.estimatedTokens, 0),
      scopes,
    });
  } catch (error: any) {
    res.status(error.message === "userId wajib diisi" ? 400 : 500).json({
      error: error.message || "Gagal mengambil pemakaian AI",
    });
  }
});

router.get("/ai/subscription-plan", async (_req, res) => {
  try {
    const defaultDurations = [
      { label: "1 Bulan", months: 1 },
      { label: "3 Bulan", months: 3 },
      { label: "6 Bulan", months: 6 },
      { label: "1 Tahun", months: 12 },
    ];
    const [rows] = await pool.execute<any[]>(
      "SELECT price, durations FROM ai_subscription_plans WHERE id = 'global' LIMIT 1"
    );
    res.json({
      price: Number(rows?.[0]?.price || 15000),
      durations: rows?.length ? safeJsonArray(rows[0].durations, defaultDurations) : defaultDurations,
    });
  } catch (error) {
    console.error("[AI] Get subscription plan failed:", error);
    res.status(500).json({ error: "Gagal mengambil paket AI Pro" });
  }
});

router.post("/ai/subscription-plan", async (req, res) => {
  try {
    const price = Math.max(0, Math.floor(Number(req.body?.price) || 15000));
    const durations = safeJsonArray(req.body?.durations)
      .map((item: any) => ({
        label: String(item?.label || "").trim(),
        months: Math.max(1, Math.floor(Number(item?.months) || 1)),
      }))
      .filter((item: any) => item.label && item.months > 0);
    const normalizedDurations = durations.length ? durations : [
      { label: "1 Bulan", months: 1 },
      { label: "3 Bulan", months: 3 },
      { label: "6 Bulan", months: 6 },
      { label: "1 Tahun", months: 12 },
    ];

    await pool.execute(
      `INSERT INTO ai_subscription_plans (id, price, durations)
       VALUES ('global', ?, ?)
       ON DUPLICATE KEY UPDATE price = VALUES(price), durations = VALUES(durations), updatedAt = CURRENT_TIMESTAMP`,
      [price, JSON.stringify(normalizedDurations)]
    );
    res.json({ price, durations: normalizedDurations });
  } catch (error) {
    console.error("[AI] Save subscription plan failed:", error);
    res.status(500).json({ error: "Gagal menyimpan paket AI Pro" });
  }
});

router.get("/ai/chat-sessions", async (req, res) => {
  try {
    const userId = assertUserId(req.query.userId);
    const [rows] = await pool.execute<any[]>(
      "SELECT id, title, messages, createdAtMs FROM ai_chat_sessions WHERE userId = ? ORDER BY updatedAt DESC LIMIT 100",
      [userId]
    );
    res.json(rows.map(normalizeSessionRow));
  } catch (error: any) {
    res.status(error.message === "userId wajib diisi" ? 400 : 500).json({ error: error.message || "Gagal mengambil sesi AI Chat" });
  }
});

router.post("/ai/chat-sessions", async (req, res) => {
  try {
    const userId = assertUserId(req.body?.userId);
    const session = req.body?.session || {};
    const id = String(session.id || "").trim();
    if (!id) return res.status(400).json({ error: "id sesi wajib diisi" });
    const title = String(session.title || "Chat Baru").slice(0, 255);
    const messages = safeJsonArray(session.messages);
    const createdAt = Math.max(1, Math.floor(Number(session.createdAt) || Date.now()));

    await pool.execute(
      `INSERT INTO ai_chat_sessions (id, userId, title, messages, createdAtMs)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), messages = VALUES(messages), createdAtMs = VALUES(createdAtMs), updatedAt = CURRENT_TIMESTAMP`,
      [id, userId, title, JSON.stringify(messages), createdAt]
    );
    res.json({ success: true });
  } catch (error: any) {
    console.error("[AI] Save chat session failed:", error);
    res.status(error.message === "userId wajib diisi" ? 400 : 500).json({ error: error.message || "Gagal menyimpan sesi AI Chat" });
  }
});

router.delete("/ai/chat-sessions/:id", async (req, res) => {
  try {
    const userId = assertUserId(req.query.userId);
    await pool.execute("DELETE FROM ai_chat_sessions WHERE id = ? AND userId = ?", [req.params.id, userId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(error.message === "userId wajib diisi" ? 400 : 500).json({ error: error.message || "Gagal menghapus sesi AI Chat" });
  }
});

router.get("/ai/companion-sessions", async (req, res) => {
  try {
    const userId = assertUserId(req.query.userId);
    const [rows] = await pool.execute<any[]>(
      "SELECT id, title, messages, createdAtMs FROM ai_companion_sessions WHERE userId = ? ORDER BY updatedAt DESC LIMIT 100",
      [userId]
    );
    res.json(rows.map(normalizeSessionRow));
  } catch (error: any) {
    res.status(error.message === "userId wajib diisi" ? 400 : 500).json({ error: error.message || "Gagal mengambil sesi AI Companion" });
  }
});

router.post("/ai/companion-sessions", async (req, res) => {
  try {
    const userId = assertUserId(req.body?.userId);
    const session = req.body?.session || {};
    const id = String(session.id || "").trim();
    if (!id) return res.status(400).json({ error: "id sesi wajib diisi" });
    const title = String(session.title || "Sesi Baru").slice(0, 255);
    const messages = safeJsonArray(session.messages);
    const createdAt = Math.max(1, Math.floor(Number(session.createdAt) || Date.now()));

    await pool.execute(
      `INSERT INTO ai_companion_sessions (id, userId, title, messages, createdAtMs)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), messages = VALUES(messages), createdAtMs = VALUES(createdAtMs), updatedAt = CURRENT_TIMESTAMP`,
      [id, userId, title, JSON.stringify(messages), createdAt]
    );
    res.json({ success: true });
  } catch (error: any) {
    console.error("[AI] Save companion session failed:", error);
    res.status(error.message === "userId wajib diisi" ? 400 : 500).json({ error: error.message || "Gagal menyimpan sesi AI Companion" });
  }
});

router.delete("/ai/companion-sessions/:id", async (req, res) => {
  try {
    const userId = assertUserId(req.query.userId);
    await pool.execute("DELETE FROM ai_companion_sessions WHERE id = ? AND userId = ?", [req.params.id, userId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(error.message === "userId wajib diisi" ? 400 : 500).json({ error: error.message || "Gagal menghapus sesi AI Companion" });
  }
});

router.get("/ai/characters", async (req, res) => {
  try {
    const userId = typeof req.query.userId === "string" ? req.query.userId : "";
    const [rows] = await pool.execute<any[]>(
      "SELECT * FROM ai_characters WHERE visibility = 'public' OR ownerId = ? ORDER BY updatedAt DESC LIMIT 200",
      [userId]
    );
    res.json(rows);
  } catch (error: any) {
    console.error("[AI Character] Get characters failed:", error);
    res.status(500).json({ error: error.message || "Gagal mengambil karakter AI" });
  }
});

router.post("/ai/characters", async (req, res) => {
  try {
    const ownerId = assertUserId(req.body?.ownerId);
    const name = String(req.body?.name || "").trim();
    const personality = String(req.body?.personality || "").trim();
    if (!name || !personality) {
      return res.status(400).json({ error: "Nama dan personality karakter wajib diisi" });
    }

    const id = req.body?.id || `char-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = {
      tagline: String(req.body?.tagline || "").slice(0, 180),
      avatar: String(req.body?.avatar || ""),
      greeting: String(req.body?.greeting || `Halo, aku ${name}. Mau ngobrol apa hari ini?`),
      visibility: req.body?.visibility === "public" ? "public" : "private",
    };

    await pool.execute(
      `INSERT INTO ai_characters (id, ownerId, name, tagline, avatar, personality, greeting, visibility)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), tagline = VALUES(tagline), avatar = VALUES(avatar), personality = VALUES(personality), greeting = VALUES(greeting), visibility = VALUES(visibility), updatedAt = CURRENT_TIMESTAMP`,
      [id, ownerId, name.slice(0, 100), payload.tagline, payload.avatar, personality, payload.greeting, payload.visibility]
    );
    const [rows] = await pool.execute<any[]>("SELECT * FROM ai_characters WHERE id = ? LIMIT 1", [id]);
    res.json({ success: true, character: rows[0] });
  } catch (error: any) {
    console.error("[AI Character] Save character failed:", error);
    res.status(error.message === "userId wajib diisi" ? 400 : 500).json({ error: error.message || "Gagal menyimpan karakter AI" });
  }
});

router.get("/ai/character-sessions", async (req, res) => {
  try {
    const userId = assertUserId(req.query.userId);
    const characterId = typeof req.query.characterId === "string" ? req.query.characterId : "";
    const [rows] = await pool.execute<any[]>(
      characterId
        ? "SELECT * FROM ai_character_sessions WHERE userId = ? AND characterId = ? ORDER BY updatedAt DESC LIMIT 100"
        : "SELECT * FROM ai_character_sessions WHERE userId = ? ORDER BY updatedAt DESC LIMIT 100",
      characterId ? [userId, characterId] : [userId]
    );
    res.json(rows.map(normalizeSessionRow).map((session, index) => ({ ...session, characterId: rows[index].characterId })));
  } catch (error: any) {
    res.status(error.message === "userId wajib diisi" ? 400 : 500).json({ error: error.message || "Gagal mengambil sesi karakter AI" });
  }
});

router.post("/ai/character-sessions", async (req, res) => {
  try {
    const userId = assertUserId(req.body?.userId);
    const session = req.body?.session || {};
    const id = String(session.id || "").trim();
    const characterId = String(session.characterId || req.body?.characterId || "").trim();
    if (!id || !characterId) return res.status(400).json({ error: "id sesi dan characterId wajib diisi" });

    await pool.execute(
      `INSERT INTO ai_character_sessions (id, characterId, userId, title, messages, createdAtMs)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), messages = VALUES(messages), createdAtMs = VALUES(createdAtMs), updatedAt = CURRENT_TIMESTAMP`,
      [
        id,
        characterId,
        userId,
        String(session.title || "Character Chat").slice(0, 255),
        JSON.stringify(safeJsonArray(session.messages)),
        Math.max(1, Math.floor(Number(session.createdAt) || Date.now())),
      ]
    );
    res.json({ success: true });
  } catch (error: any) {
    console.error("[AI Character] Save session failed:", error);
    res.status(error.message === "userId wajib diisi" ? 400 : 500).json({ error: error.message || "Gagal menyimpan sesi karakter AI" });
  }
});

router.post("/ai/characters/:characterId/chat", async (req, res) => {
  try {
    const { characterId } = req.params;
    const messages = safeJsonArray(req.body?.messages);
    const userId = typeof req.body?.userId === "string" ? req.body.userId : undefined;
    const [rows] = await pool.execute<any[]>("SELECT * FROM ai_characters WHERE id = ? LIMIT 1", [characterId]);
    if (!rows.length) return res.status(404).json({ error: "Karakter AI tidak ditemukan" });
    const character = rows[0];

    const settingsRow = await getGlobalAISettings();
    const resolvedProvider = normalizeProvider(req.body?.aiProvider || settingsRow?.aiProvider || undefined);
    const resolvedKey = resolvedProvider === "obscura"
      ? (req.body?.obscuraKey || settingsRow?.obscuraKey)
      : (req.body?.apiKey || settingsRow?.openrouterKey);
    const resolvedModel = String(req.body?.model || (resolvedProvider === "obscura" ? settingsRow?.obscuraModel : settingsRow?.openrouterModel) || "openai/gpt-4o-mini");

    if (!resolvedKey) return res.status(503).json({ error: "API key belum dikonfigurasi." });

    const baseSystemPrompt = [
      `Kamu sedang berperan sebagai karakter bernama ${character.name}.`,
      character.tagline ? `Tagline karakter: ${character.tagline}` : "",
      `Personality dan aturan karakter:\n${character.personality}`,
      "Tetap in-character, natural, ekspresif, dan jawab dalam bahasa Indonesia kecuali user meminta bahasa lain.",
      "Jangan mengaku sebagai AI umum kecuali memang sesuai persona karakter.",
    ].filter(Boolean).join("\n\n");

    const systemPrompt = await buildDynamicSystemPrompt(userId, baseSystemPrompt);

    const limitState = await consumeAILimit({
      userKey: getRequestUserKey(userId, req),
      scope: "chat",
      dailyLimit: await getPlanAdjustedAILimit(
        userId,
        normalizeLimit((settingsRow as any)?.aiChatDailyLimit, DEFAULT_AI_CHAT_DAILY_LIMIT)
      ),
    });
    if (!limitState.allowed) {
      return res.status(429).json({ error: `Limit chat karakter harian sudah habis (${limitState.used}/${limitState.limit}).` });
    }

    if (resolvedProvider === "obscura") {
      const content = await callObscuraGenerate({
        apiKey: resolvedKey,
        prompt: messagesToPrompt(messages),
        systemPrompt,
        model: resolvedModel,
      });
      await addAIUsageTokens(
        limitState.usageId,
        estimateTokensFromMessages(messages) + estimateTokensFromText(systemPrompt) + estimateTokensFromText(content)
      );
      return res.json({ role: "assistant", content });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${String(resolvedKey).trim().replace(/^Bearer\s+/i, "")}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://toko-online.replit.app",
        "X-Title": "TokoArthur Character AI",
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "") })),
        ],
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as any;
      return res.status(response.status).json({ error: data?.error?.message || "Provider AI error" });
    }
    const data = await response.json() as any;
    await addAIUsageTokens(
      limitState.usageId,
      getProviderTokenUsage(data) ||
        estimateTokensFromMessages(messages) +
          estimateTokensFromText(systemPrompt) +
          estimateTokensFromText(data.choices?.[0]?.message?.content || "")
    );
    res.json({ role: "assistant", content: data.choices?.[0]?.message?.content || "" });
  } catch (error: any) {
    console.error("[AI Character] Chat failed:", error);
    res.status(500).json({ error: error.message || "Gagal chat dengan karakter AI" });
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
  const { messages, apiKey, obscuraKey, aiProvider, model: bodyModel, userId } = req.body as {
    messages: { role: string; content: string }[];
    apiKey?: string;
    obscuraKey?: string;
    aiProvider?: string;
    model?: string;
    userId?: string;
  };

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "messages wajib diisi dalam format array." });
    return;
  }

  // ─── CYBER INTERACTION / SLASH COMMAND INTERCEPTOR ────────────────────────
  const latestMessage = messages[messages.length - 1];
  const latestContent = latestMessage?.content ? String(latestMessage.content).trim() : "";

  if (latestContent.startsWith("/")) {
    const cleanUserId = typeof userId === "string" ? userId.trim() : "";
    let userRow: any = null;
    if (cleanUserId && !cleanUserId.startsWith("guest:")) {
      try {
        const [rows] = await pool.execute<any[]>(
          "SELECT name, email, role, coins, balance, isSultan, myCoinNft, balanceBtc, balanceEth, balanceUsdt, bio FROM users WHERE id = ? LIMIT 1",
          [cleanUserId]
        );
        if (rows && rows.length > 0) {
          userRow = rows[0];
        }
      } catch (err) {
        console.error("[AI Chat Cmd] Failed to fetch user info:", err);
      }
    }

    const args = latestContent.split(/\s+/);
    const command = args[0].toLowerCase();
    const isAdmin = userRow?.role === "admin";

    // 1. /help
    if (command === "/help") {
      let helpText = `=== ⚙️ TOKOARTHUR CYBER INTERACTION SYSTEM ===\n\n`;
      helpText += `💡 **Perintah Umum (User & Admin):**\n`;
      helpText += `• \`/help\` - Menampilkan daftar panduan perintah siber ini.\n`;
      helpText += `• \`/profile\` - Menampilkan resume detail profil akun Anda.\n`;
      helpText += `• \`/wallet\` atau \`/saldo\` - Menampilkan informasi saldo wallet & transaksi.\n`;
      helpText += `• \`/koin\` - Menampilkan jumlah Koin Toko & level keanggotaan Sultan VIP.\n`;
      helpText += `• \`/crypto\` - Menampilkan rincian aset crypto (BTC, ETH, USDT) & keanggotaan.\n`;
      helpText += `• \`/orders\` - Menampilkan status dari 3 transaksi pembelian terakhir Anda di database.\n\n`;
      
      if (isAdmin) {
        helpText += `👑 **Perintah Administratif (Khusus Admin):**\n`;
        helpText += `• \`/admin [keyword] = [content]\` atau \`/learn [keyword] = [content]\` - Melatih AI tentang fakta baru.\n`;
        helpText += `• \`/giftkoin [username/email] [jumlah]\` - Memberikan Koin Toko gratis ke pengguna.\n`;
        helpText += `• \`/giftsaldo [username/email] [jumlah]\` - Memberikan Saldo Wallet gratis ke pengguna.\n`;
        helpText += `• \`/ban [username/email] [alasan]\` - Memblokir akses pengguna dari sistem TokoArthur.\n`;
        helpText += `• \`/unban [username/email]\` - Memulihkan akses pengguna yang diblokir.\n`;
        helpText += `• \`/clearmemory\` - Menghapus semua memori/fakta yang pernah diajarkan ke AI.\n`;
      } else {
        helpText += `👑 *Minta role admin dari database untuk membuka fitur pembelajaran mandiri AI!*`;
      }
      res.json({ role: "assistant", content: helpText });
      return;
    }

    // 2. /profile
    if (command === "/profile") {
      if (!userRow) {
        res.json({ role: "assistant", content: "❌ **Akses Ditolak:** Anda harus masuk (login) terlebih dahulu untuk melihat profil Anda." });
        return;
      }
      const isSultan = Number(userRow.isSultan) === 1;
      const profileText = `=== 👤 RESUME PROFIL PENGGUNA ===\n\n` +
        `• **Nama Lengkap:** ${userRow.name}\n` +
        `• **Alamat Email:** ${userRow.email}\n` +
        `• **Peran Sistem:** ${String(userRow.role).toUpperCase()} ${isSultan ? "👑 (Sultan VIP Member)" : ""}\n` +
        `• **Koin Toko:** ${userRow.coins} Koin\n` +
        `• **Saldo Wallet:** Rp ${Number(userRow.balance || 0).toLocaleString("id-ID")}\n` +
        `• **Biografi:** "${userRow.bio || "Tidak ada biografi ditulis."}"\n\n` +
        `💡 *Gunakan perintah \`/wallet\` atau \`/crypto\` untuk detail aset finansial lainnya!*`;
      res.json({ role: "assistant", content: profileText });
      return;
    }

    // 3. /wallet atau /saldo
    if (command === "/wallet" || command === "/saldo") {
      if (!userRow) {
        res.json({ role: "assistant", content: "❌ **Akses Ditolak:** Silakan login terlebih dahulu untuk mengakses wallet Anda." });
        return;
      }
      const walletText = `=== 💰 DETIL DOMPET DIGITAL (WALLET) ===\n\n` +
        `• **Saldo Rupiah:** Rp ${Number(userRow.balance || 0).toLocaleString("id-ID")}\n` +
        `• **Akun Penjual/Seller:** ${userRow.role === "seller" ? "Aktif" : "Tidak Aktif"}\n` +
        `• **Status Premium Sultan:** ${Number(userRow.isSultan) === 1 ? "Aktif 👑" : "Tidak Aktif"}\n\n` +
        `💡 *Saldo Wallet dapat digunakan untuk berbelanja produk orisinal langsung di TokoArthur!*`;
      res.json({ role: "assistant", content: walletText });
      return;
    }

    // 4. /koin
    if (command === "/koin") {
      if (!userRow) {
        res.json({ role: "assistant", content: "❌ **Akses Ditolak:** Silakan login terlebih dahulu." });
        return;
      }
      const isSultan = Number(userRow.isSultan) === 1;
      const koinText = `=== 🪙 KOIN TOKO & KASTA MEMBER ===\n\n` +
        `• **Jumlah Koin Anda:** ${userRow.coins} Koin\n` +
        `• **Kasta Sultan VIP:** ${isSultan ? "AKTIF 🌟 (Tier Tertinggi)" : "TIDAK AKTIF"}\n\n` +
        `👑 **Benefit Member Sultan VIP:**\n` +
        `1. Badge Emas Premium bercahaya di profil.\n` +
        `2. Diskon & Voucher khusus dari seller resmi.\n` +
        `3. Kuota limit harian AI Chat dilipatgandakan 2x lipat!\n\n` +
        `💡 *Kumpulkan koin dengan menyelesaikan transaksi pembelian atau putar Mystery Royale Draw!*`;
      res.json({ role: "assistant", content: koinText });
      return;
    }

    // 5. /crypto
    if (command === "/crypto") {
      if (!userRow) {
        res.json({ role: "assistant", content: "❌ **Akses Ditolak:** Silakan login terlebih dahulu." });
        return;
      }
      const cryptoText = `=== 🌐 MATRIX CRYPTO ASSETS PORTFOLIO ===\n\n` +
        `• **MyCoin NFT Owned:** ID #${userRow.myCoinNft || "0"}\n` +
        `• **Saldo Bitcoin (BTC):** 🪙 ${userRow.balanceBtc || "0.00"} BTC\n` +
        `• **Saldo Ethereum (ETH):** 🪙 ${userRow.balanceEth || "0.00"} ETH\n` +
        `• **Saldo Tether (USDT):** 💵 $${userRow.balanceUsdt || "0.00"} USDT\n\n` +
        `💡 *Aset crypto digital Anda terenkripsi aman di dalam Matrix-Arthur Blockchain Protocol.*`;
      res.json({ role: "assistant", content: cryptoText });
      return;
    }

    // 6. /orders
    if (command === "/orders") {
      if (!userRow) {
        res.json({ role: "assistant", content: "❌ **Akses Ditolak:** Silakan login terlebih dahulu." });
        return;
      }
      try {
        const [orderRows] = await pool.execute<any[]>(
          "SELECT orderNumber, status, grandTotal, items, date FROM orders WHERE userId = ? ORDER BY date DESC LIMIT 3",
          [cleanUserId]
        );
        if (orderRows && orderRows.length > 0) {
          let ordersText = `=== 📦 3 RIWAYAT TRANSAKSI TERAKHIR ANDA ===\n\n`;
          orderRows.forEach((o, index) => {
            let itemsString = "";
            try {
              const parsedItems = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
              if (Array.isArray(parsedItems)) {
                itemsString = parsedItems.map((it: any) => `${it.name} (x${it.quantity})`).join(", ");
              }
            } catch (err) {
              itemsString = "Detail barang tidak terbaca";
            }
            const oDate = o.date ? new Date(o.date).toLocaleDateString("id-ID") : "Tanggal tidak diketahui";
            ordersText += `${index + 1}. **No Pesanan:** \`${o.orderNumber}\`\n`;
            ordersText += `   • **Tanggal:** ${oDate}\n`;
            ordersText += `   • **Status:** \`${String(o.status).toUpperCase()}\`\n`;
            ordersText += `   • **Total Belanja:** Rp ${Number(o.grandTotal || 0).toLocaleString("id-ID")}\n`;
            ordersText += `   • **Daftar Barang:** ${itemsString}\n\n`;
          });
          res.json({ role: "assistant", content: ordersText });
          return;
        } else {
          res.json({
            role: "assistant",
            content: "=== 📦 RIWAYAT TRANSAKSI ===\n\nBelum ada transaksi pembelian yang tercatat di database kami untuk akun Anda. Silakan jelajahi katalog produk premium kami!"
          });
          return;
        }
      } catch (err: any) {
        res.json({ role: "assistant", content: `❌ **Gagal mengambil data pesanan:** ${err.message}` });
        return;
      }
    }

    // 7. /admin atau /learn
    if (command === "/admin" || command === "/learn") {
      if (!isAdmin) {
        res.json({ role: "assistant", content: "❌ **Akses Ditolak:** Perintah administratif ini hanya diperbolehkan untuk Admin TokoArthur." });
        return;
      }
      
      const rawText = latestContent.substring(command.length).trim();
      const match = rawText.match(/^(.+?)\s*=\s*(.+)$/s);
      
      if (!match) {
        res.json({
          role: "assistant",
          content: `❌ **FORMAT SALAH!**\n\n` +
            `💡 **Cara melatih AI fakta baru:**\n` +
            `👉 \`/admin [keyword] = [konten fakta/pengetahuan]\`\n\n` +
            `**Contoh:** \`/admin jam operasional = TokoArthur buka 24 jam sehari, pengiriman instant kurir dilakukan dari jam 09.00 s/d 21.00 WIB.\``
        });
        return;
      }
      
      const keyword = match[1].trim();
      const content = match[2].trim();
      const knowledgeId = `knowledge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      
      try {
        await pool.execute(
          "INSERT INTO ai_knowledge (id, keyword, content, createdBy) VALUES (?, ?, ?, ?) " +
          "ON DUPLICATE KEY UPDATE content = VALUES(content), createdBy = VALUES(createdBy), updatedAt = CURRENT_TIMESTAMP",
          [knowledgeId, keyword, content, userRow.name || userRow.email || "Admin"]
        );
        
        res.json({
          role: "assistant",
          content: `✅ **SUKSES MENGAJARKAN AI FAKTA BARU!**\n\n` +
            `🔑 **Kata Kunci (Keyword):** \`${keyword}\`\n` +
            `📝 **Pengetahuan (Content):** "${content}"\n` +
            `👤 **Pengajar:** Admin *${userRow.name}*\n\n` +
            `💡 *AI sekarang akan secara otomatis mengingat fakta ini dan menggunakannya saat merespon obrolan user tentang topik terkait!*`
        });
        return;
      } catch (err: any) {
        res.json({ role: "assistant", content: `❌ **Gagal menyimpan ke database AI Self-Learning:** ${err.message}` });
        return;
      }
    }

    // 8. /giftkoin
    if (command === "/giftkoin") {
      if (!isAdmin) {
        res.json({ role: "assistant", content: "❌ **Akses Ditolak:** Perintah administratif ini hanya diperbolehkan untuk Admin." });
        return;
      }
      
      const rawText = latestContent.substring(command.length).trim();
      const match = rawText.match(/^(\S+)\s+(\d+)$/);
      
      if (!match) {
        res.json({
          role: "assistant",
          content: `❌ **FORMAT SALAH!**\n\n` +
            `👉 \`/giftkoin [username/email] [jumlah_koin]\`\n\n` +
            `**Contoh:** \`/giftkoin zaidan 15000\``
        });
        return;
      }
      
      const targetUser = match[1].trim();
      const amount = parseInt(match[2], 10);
      
      try {
        const [targetRows] = await pool.execute<any[]>(
          "SELECT id, name, email, coins FROM users WHERE name = ? OR email = ? LIMIT 1",
          [targetUser, targetUser]
        );
        
        if (!targetRows || targetRows.length === 0) {
          res.json({ role: "assistant", content: `❌ **Pengguna tidak ditemukan:** Tidak ada user dengan nama atau email \`${targetUser}\`.` });
          return;
        }
        
        const target = targetRows[0];
        const newCoins = (target.coins || 0) + amount;
        
        await pool.execute(
          "UPDATE users SET coins = ? WHERE id = ?",
          [newCoins, target.id]
        );
        
        res.json({
          role: "assistant",
          content: `🎁 **KOIN GRATIS BERHASIL DIKIRIM!**\n\n` +
            `👤 **Penerima:** *${target.name}* (${target.email})\n` +
            `🪙 **Jumlah Koin:** ${amount.toLocaleString("id-ID")} Koin\n` +
            `🛡️ **Eksekutor:** Admin *${userRow.name}*\n` +
            `📊 **Koin Baru Penerima:** ${newCoins.toLocaleString("id-ID")} Koin`
        });
        return;
      } catch (err: any) {
        res.json({ role: "assistant", content: `❌ **Gagal mengirim koin:** ${err.message}` });
        return;
      }
    }

    // 9. /giftsaldo
    if (command === "/giftsaldo") {
      if (!isAdmin) {
        res.json({ role: "assistant", content: "❌ **Akses Ditolak:** Perintah administratif ini hanya diperbolehkan untuk Admin." });
        return;
      }
      
      const rawText = latestContent.substring(command.length).trim();
      const match = rawText.match(/^(\S+)\s+(\d+)$/);
      
      if (!match) {
        res.json({
          role: "assistant",
          content: `❌ **FORMAT SALAH!**\n\n` +
            `👉 \`/giftsaldo [username/email] [jumlah_rupiah]\`\n\n` +
            `**Contoh:** \`/giftsaldo zaidan 50000\``
        });
        return;
      }
      
      const targetUser = match[1].trim();
      const amount = parseFloat(match[2]);
      
      try {
        const [targetRows] = await pool.execute<any[]>(
          "SELECT id, name, email, balance FROM users WHERE name = ? OR email = ? LIMIT 1",
          [targetUser, targetUser]
        );
        
        if (!targetRows || targetRows.length === 0) {
          res.json({ role: "assistant", content: `❌ **Pengguna tidak ditemukan:** Tidak ada user dengan nama atau email \`${targetUser}\`.` });
          return;
        }
        
        const target = targetRows[0];
        const currentBalance = parseFloat(target.balance || "0");
        const newBalance = currentBalance + amount;
        
        await pool.execute(
          "UPDATE users SET balance = ? WHERE id = ?",
          [String(newBalance), target.id]
        );
        
        res.json({
          role: "assistant",
          content: `💸 **SALDO WALLET BERHASIL DIKIRIM!**\n\n` +
            `👤 **Penerima:** *${target.name}* (${target.email})\n` +
            `💰 **Jumlah Saldo:** Rp ${amount.toLocaleString("id-ID")}\n` +
            `🛡️ **Eksekutor:** Admin *${userRow.name}*\n` +
            `📊 **Saldo Baru Penerima:** Rp ${newBalance.toLocaleString("id-ID")}`
        });
        return;
      } catch (err: any) {
        res.json({ role: "assistant", content: `❌ **Gagal mengirim saldo wallet:** ${err.message}` });
        return;
      }
    }

    // 10. /ban
    if (command === "/ban") {
      if (!isAdmin) {
        res.json({ role: "assistant", content: "❌ **Akses Ditolak:** Perintah administratif ini hanya diperbolehkan untuk Admin." });
        return;
      }
      
      const rawText = latestContent.substring(command.length).trim();
      const match = rawText.match(/^(\S+)(?:\s+(.+))?$/);
      
      if (!match) {
        res.json({
          role: "assistant",
          content: `❌ **FORMAT SALAH!**\n\n` +
            `👉 \`/ban [username/email] [alasan_pemblokiran]\`\n\n` +
            `**Contoh:** \`/ban spammer_akun Melakukan tindakan spamming di review produk.\``
        });
        return;
      }
      
      const targetUser = match[1].trim();
      const reason = match[2]?.trim() || "Pelanggaran pedoman komunitas TokoArthur.";
      
      try {
        const [targetRows] = await pool.execute<any[]>(
          "SELECT id, name, email, role FROM users WHERE name = ? OR email = ? LIMIT 1",
          [targetUser, targetUser]
        );
        
        if (!targetRows || targetRows.length === 0) {
          res.json({ role: "assistant", content: `❌ **Pengguna tidak ditemukan:** Tidak ada user dengan nama atau email \`${targetUser}\`.` });
          return;
        }
        
        const target = targetRows[0];
        if (target.role === "admin") {
          res.json({ role: "assistant", content: "❌ **Tindakan Dicegah:** Anda tidak bisa memblokir sesama Admin TokoArthur." });
          return;
        }
        
        await pool.execute(
          "UPDATE users SET isBanned = 1, banReason = ? WHERE id = ?",
          [reason, target.id]
        );
        
        res.json({
          role: "assistant",
          content: `🔨 **PENGGUNA BERHASIL DIBAN (BANNED)!**\n\n` +
            `👤 **Target:** *${target.name}* (${target.email})\n` +
            `📝 **Alasan:** "${reason}"\n` +
            `🛡️ **Eksekutor:** Admin *${userRow.name}*\n` +
            `💡 *Akses pengguna ini sekarang ditutup rapat dari seluruh sistem e-commerce.*`
        });
        return;
      } catch (err: any) {
        res.json({ role: "assistant", content: `❌ **Gagal memblokir pengguna:** ${err.message}` });
        return;
      }
    }

    // 11. /unban
    if (command === "/unban") {
      if (!isAdmin) {
        res.json({ role: "assistant", content: "❌ **Akses Ditolak:** Perintah administratif ini hanya diperbolehkan untuk Admin." });
        return;
      }
      
      const targetUser = latestContent.substring(command.length).trim();
      
      if (!targetUser) {
        res.json({
          role: "assistant",
          content: `❌ **FORMAT SALAH!**\n\n` +
            `👉 \`/unban [username/email]\`\n\n` +
            `**Contoh:** \`/unban spammer_akun\``
        });
        return;
      }
      
      try {
        const [targetRows] = await pool.execute<any[]>(
          "SELECT id, name, email FROM users WHERE name = ? OR email = ? LIMIT 1",
          [targetUser, targetUser]
        );
        
        if (!targetRows || targetRows.length === 0) {
          res.json({ role: "assistant", content: `❌ **Pengguna tidak ditemukan:** Tidak ada user dengan nama atau email \`${targetUser}\`.` });
          return;
        }
        
        const target = targetRows[0];
        
        await pool.execute(
          "UPDATE users SET isBanned = 0, banReason = NULL WHERE id = ?",
          [target.id]
        );
        
        res.json({
          role: "assistant",
          content: `🔓 **BAN PENGGUNA BERHASIL DICABUT (UNBANNED)!**\n\n` +
            `👤 **Target:** *${target.name}* (${target.email})\n` +
            `🛡️ **Eksekutor:** Admin *${userRow.name}*\n` +
            `💡 *Akses akun pengguna ini telah dipulihkan sepenuhnya ke kondisi normal.*`
        });
        return;
      } catch (err: any) {
        res.json({ role: "assistant", content: `❌ **Gagal memulihkan pengguna:** ${err.message}` });
        return;
      }
    }

    // 12. /clearmemory
    if (command === "/clearmemory") {
      if (!isAdmin) {
        res.json({ role: "assistant", content: "❌ **Akses Ditolak:** Perintah administratif ini hanya diperbolehkan untuk Admin." });
        return;
      }
      
      try {
        await pool.execute("DELETE FROM ai_knowledge");
        res.json({
          role: "assistant",
          content: `🧹 **MEMORI PEMBELAJARAN AI BERHASIL DIRESET!**\n\n` +
            `🛡️ **Eksekutor:** Admin *${userRow.name}*\n\n` +
            `💡 *Seluruh fakta yang diajarkan oleh tim Admin telah dibersihkan secara permanen dari database. AI sekarang kembali ke konfigurasi dasar.*`
        });
        return;
      } catch (err: any) {
        res.json({ role: "assistant", content: `❌ **Gagal mereset memori AI:** ${err.message}` });
        return;
      }
    }

    // Unknown command
    res.json({
      role: "assistant",
      content: `❌ **Perintah tidak dikenal:** Perintah \`${command}\` tidak tersedia di sistem TokoArthur.\n\n💡 Ketik \`/help\` untuk melihat daftar perintah siber yang tersedia!`
    });
    return;
  }

  let resolvedProvider = normalizeProvider(aiProvider);
  let resolvedKey = resolvedProvider === "obscura" ? obscuraKey : apiKey;
  let resolvedModel = bodyModel?.trim();
  let aiChatDailyLimit = DEFAULT_AI_CHAT_DAILY_LIMIT;

  let settingsRow: Awaited<ReturnType<typeof getGlobalAISettings>> | undefined;
  try {
    settingsRow = await getGlobalAISettings();
    if (settingsRow) {
      aiChatDailyLimit = normalizeLimit((settingsRow as any).aiChatDailyLimit, DEFAULT_AI_CHAT_DAILY_LIMIT);
    }
  } catch (dbErr) {
    console.error("[AI] Failed to fetch AI limits for chat:", dbErr);
  }

  if (!resolvedKey) {
    try {
      if (settingsRow) {
        resolvedProvider = normalizeProvider(aiProvider || settingsRow.aiProvider || undefined);
        resolvedKey = resolvedProvider === "obscura"
          ? settingsRow.obscuraKey || undefined
          : settingsRow.openrouterKey || undefined;
        if (!resolvedModel) {
          resolvedModel = resolvedProvider === "obscura"
            ? settingsRow.obscuraModel || undefined
            : settingsRow.openrouterModel || undefined;
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

  let limitState: Awaited<ReturnType<typeof consumeAILimit>> | undefined;
  try {
    limitState = await consumeAILimit({
      userKey: getRequestUserKey(userId, req),
      scope: "chat",
      dailyLimit: await getPlanAdjustedAILimit(userId, aiChatDailyLimit),
    });
    if (!limitState.allowed) {
      res.status(429).json({
        error: `Limit AI biasa harian sudah habis (${limitState.used}/${limitState.limit}). Coba lagi besok atau minta admin naikkan limit.`,
        limit: limitState.limit,
        used: limitState.used,
        remaining: limitState.remaining,
      });
      return;
    }
  } catch (limitErr) {
    console.error("[AI] Failed to consume chat limit:", limitErr);
    res.status(500).json({ error: "Gagal mengecek limit AI. Coba lagi sebentar." });
    return;
  }

  try {
    const latestUserMessage = getLatestUserPrompt(messages);
    
    // Universal search: trigger for ANY non-trivial query (more than 3 words, or contains question words, or any factual topic)
    // Only skip pure greetings/small-talk with no question substance
    const pureGreeting = /^(halo|hai|hi|hey|hei|selamat pagi|selamat siang|selamat sore|selamat malam|apa kabar|hows it going|thanks|makasih|oke|ok|sip|iya|ya|tidak|nggak|no|yes|wow|bagus|keren|mantap|lanjut|siap|done|selesai|test|coba)[\s!.?]*$/i.test(latestUserMessage.trim());
    const shouldSearch = !pureGreeting && latestUserMessage.trim().length > 5;

    let webSearchContext = "";
    if (shouldSearch && latestUserMessage) {
      console.log(`[AI Search] Universal search triggered for: "${latestUserMessage}"...`);
      const searchResults = await fetchWebSearch(latestUserMessage);
      if (searchResults) {
        webSearchContext = `
=== HASIL PENCARIAN WEB REAL-TIME (UNIVERSAL WEB SEARCH) ===
Pertanyaan/Topik Pengguna: "${latestUserMessage}"
Informasi dari Internet:
${searchResults}

💡 INSTRUKSI:
1. Gunakan data di atas sebagai referensi utama untuk menjawab secara akurat, detail, dan faktual.
2. JANGAN katakan tidak punya akses internet atau pengetahuan terbatas. Jawab langsung dan percaya diri berdasarkan data di atas.
3. Jika data di atas tidak relevan dengan pertanyaan, abaikan dan jawab dari pengetahuan sendiri.
`;
        console.log(`[AI Search] Search results injected successfully!`);
      } else {
        console.log(`[AI Search] Search returned no results.`);
      }
    }

    const baseSystemPrompt = `Kamu adalah TokoArthur AI Companion, sebuah kecerdasan buatan super (Super AI) yang sangat cerdas, responsif, berpengetahuan tidak terbatas, dan serba tahu.
Gaya Komunikasi:
1. Berbicaralah secara santai, gaul, kasual, menggunakan bahasa Indonesia yang gaul ("gw", "lu", "bro", "jier", "anying" jika cocok/pengguna menggunakannya), sangat akrab, ceria, dan asyik seperti teman dekat. Hindari gaya bicara robotik, kaku, formal, atau membosankan!
2. Anda harus sangat percaya diri, cerdas, solutif, dan berwawasan luas (expert level).
3. Jika ditanya tentang konsep teknologi, pemrograman, e-commerce, atau info umum, jelaskan secara mendalam, asyik, dan mudah dipahami layaknya senior developer/asisten AI elite.
4. Anda MEMILIKI akses internet real-time dan selalu up-to-date dengan berita terkini, politik, luar negeri/dalam negeri, teknologi, dan waktu nyata saat ini.
`;
    const systemPrompt = await buildDynamicSystemPrompt(userId, baseSystemPrompt, webSearchContext);

    if (resolvedProvider === "obscura") {
      try {
        if (await isObscuraImageModel(model)) {
          const result = await callObscuraCloudflare({
            apiKey: resolvedKey,
            prompt: getLatestUserPrompt(messages),
            modelId: model,
          });
          await addAIUsageTokens(
            limitState?.usageId,
            result.imageUrl
              ? IMAGE_USAGE_TOKEN_COST
              : estimateTokensFromMessages(messages) + estimateTokensFromText(result.content)
          );
          res.json({ role: "assistant", content: result.content, imageUrl: result.imageUrl });
          return;
        }

        // ObscuraWorks uses GET with URL query params, so system prompt is limited.
        // To guarantee news/search context always reaches the model, we embed it directly in the user prompt.
        const compactBasePrompt = `Kamu adalah TokoArthur AI, asisten super cerdas, gaul, percaya diri, dan selalu up-to-date. Jawab secara natural, santai, dan detail. JANGAN pernah bilang tidak tahu info terbaru atau tidak punya akses internet. Kamu MEMILIKI akses internet real-time.`;

        const nowJakarta = new Date();
        const formatOptions: Intl.DateTimeFormatOptions = {
          timeZone: "Asia/Jakarta",
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        };
        const currentTimeString = new Intl.DateTimeFormat("id-ID", formatOptions).format(nowJakarta);
        const timeContext = `\n=== INFORMASI WAKTU SEKARANG (REAL-TIME SYSTEM TIME) ===\n- Waktu saat ini: ${currentTimeString} WIB\n- Gunakan info waktu ini untuk menjawab pertanyaan tentang hari, tanggal, jam, atau waktu saat ini secara langsung!\n\n`;

        let rawPrompt = timeContext + messagesToPrompt(messages);

        // Inject news context directly into the prompt for ObscuraWorks (since system prompt is URL-limited)
        if (webSearchContext) {
          console.log(`[ObscuraWorks] Injecting ${webSearchContext.length} chars of search context directly into prompt...`);
          const newsBlock = `\n\n=== INFORMASI TERBARU DARI INTERNET (REAL-TIME) ===\n${webSearchContext}\n\nINSTRUKSI PENTING: Gunakan informasi di atas untuk menjawab pertanyaan berikut secara percaya diri dan natural. JANGAN katakan tidak tahu atau tidak punya akses internet!\n\n=== PERTANYAAN PENGGUNA ===\n`;
          // Insert news block before the last user message
          rawPrompt = newsBlock + rawPrompt;
        }

        // Keep prompt within safe URL length
        if (rawPrompt.length > 3000) {
          rawPrompt = rawPrompt.slice(0, 3000);
        }

        const content = await callObscuraGenerate({
          apiKey: resolvedKey,
          prompt: rawPrompt,
          systemPrompt: compactBasePrompt,
          model: resolvedModel,
        });
        await addAIUsageTokens(
          limitState?.usageId,
          estimateTokensFromMessages(messages) + estimateTokensFromText(content)
        );
        res.json({ role: "assistant", content });
        return;
      } catch (obscuraErr: any) {
        console.error(`[AI Chat] ObscuraWorks failed:`, obscuraErr.message);
        throw obscuraErr; // Respect user preference to throw original error to stay on ObscuraWorks!
      }
    }

    const cleanKey = resolvedKey.trim().replace(/^Bearer\s+/i, "");
    
    const finalMessages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    messages.forEach((m: any, idx) => {
      // Inject strict internet context override system message right before the latest user message
      if (idx === messages.length - 1 && webSearchContext) {
        finalMessages.push({
          role: "system",
          content: "[INFORMASI PENTING: Anda MEMILIKI koneksi internet aktif saat ini! Hasil pencarian web real-time terlampir di system prompt atas adalah data valid dan nyata dari internet. Jawablah langsung menggunakan informasi tersebut secara percaya diri, detail, dan natural tanpa memberi alasan 'tidak terhubung internet' atau 'tidak tahu info berita terbaru' atau 'keterbatasan model bahasa' atau 'tidak bisa menyimpan data sebelum tanggal tersebut'!]"
        });
      }
      
      finalMessages.push({
        role: m.role === "system" ? "system" : m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "")
      });
    });

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
        messages: finalMessages,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as any;
      throw { status: response.status, message: errorData.error?.message || "OpenRouter Error" };
    }

    const data = (await response.json()) as any;
    await addAIUsageTokens(
      limitState?.usageId,
      getProviderTokenUsage(data) ||
        estimateTokensFromMessages(messages) +
          estimateTokensFromText(data.choices?.[0]?.message?.content || "")
    );
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
    const { id, name, modelId, description, color, isEnabled, isReleased, accessLevel, sortOrder } = req.body as {
      id?: string;
      name: string;
      modelId: string;
      description?: string;
      color?: string;
      isEnabled?: boolean;
      isReleased?: boolean;
      accessLevel?: string;
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
        isReleased: isReleased !== undefined ? isReleased : false,
        accessLevel: ["free", "pro", "dev"].includes(accessLevel || "") ? accessLevel : "pro",
        sortOrder: sortOrder || 0,
      } as any).where(eq(aiCompanionModels.id, id));
      res.json({ success: true, id });
    } else {
      // Insert new
      const newId = `cmodel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await db.insert(aiCompanionModels).values({
        id: newId, name, modelId,
        description: description || null,
        color: color || "#6366f1",
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        isReleased: isReleased !== undefined ? isReleased : false,
        accessLevel: ["free", "pro", "dev"].includes(accessLevel || "") ? accessLevel : "pro",
        sortOrder: sortOrder || 0,
      } as any);
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
  const { messages, modelIds, apiKey, researchMode, userId } = req.body as {
    messages: { role: string; content: string }[];
    modelIds: string[]; // Array of OpenRouter model IDs to run in parallel
    apiKey?: string;
    researchMode?: boolean;
    userId?: string;
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

  let aiCompanionDailyLimit = DEFAULT_AI_COMPANION_DAILY_LIMIT;
  try {
    const settingsRow = await getGlobalAISettings();
    if (settingsRow) {
      aiCompanionDailyLimit = normalizeLimit((settingsRow as any).aiCompanionDailyLimit, DEFAULT_AI_COMPANION_DAILY_LIMIT);
    }
  } catch (dbErr) {
    console.error("[AI] Failed to fetch AI limits for companion:", dbErr);
  }

  let limitState: Awaited<ReturnType<typeof consumeAILimit>> | undefined;
  try {
    limitState = await consumeAILimit({
      userKey: getRequestUserKey(userId, req),
      scope: "companion",
      dailyLimit: await getPlanAdjustedAILimit(userId, aiCompanionDailyLimit),
    });
    if (!limitState.allowed) {
      res.status(429).json({
        error: `Limit AI Companion harian sudah habis (${limitState.used}/${limitState.limit}). Coba lagi besok atau minta admin naikkan limit.`,
        limit: limitState.limit,
        used: limitState.used,
        remaining: limitState.remaining,
      });
      return;
    }
  } catch (limitErr) {
    console.error("[AI] Failed to consume companion limit:", limitErr);
    res.status(500).json({ error: "Gagal mengecek limit AI Companion. Coba lagi sebentar." });
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

  const baseSystemPrompt = "Kamu adalah asisten AI TokoArthur yang ramah, profesional, dan objektif. Jawab dalam bahasa Indonesia.";
  const systemPrompt = await buildDynamicSystemPrompt(userId, baseSystemPrompt);

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
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "") })),
            ],
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

  await addAIUsageTokens(
    limitState?.usageId,
    estimateTokensFromMessages(messages) * modelIds.length +
      responses.reduce((total, response) => total + estimateTokensFromText(response.content), 0)
  );

  res.json({ responses });
});

router.post("/ai/companion/stream", async (req, res) => {
  const { messages, modelIds, apiKey, obscuraKey, obscuraModel, aiProvider, researchMode, userId } = req.body as {
    messages: { role: string; content: string }[];
    modelIds: string[];
    apiKey?: string;
    obscuraKey?: string;
    obscuraModel?: string;
    aiProvider?: string;
    researchMode?: boolean;
    userId?: string;
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

  let aiCompanionDailyLimit = DEFAULT_AI_COMPANION_DAILY_LIMIT;
  let resolvedProvider = normalizeProvider(aiProvider);
  let resolvedOpenRouterKey: string | undefined = apiKey;
  let resolvedObscuraKey: string | undefined = obscuraKey;
  let resolvedKey: string | undefined = resolvedProvider === "obscura" ? resolvedObscuraKey : resolvedOpenRouterKey;
  let resolvedObscuraModel: string | undefined = obscuraModel?.trim() || undefined;
  let settingsRow: Awaited<ReturnType<typeof getGlobalAISettings>> | undefined;
  try {
    settingsRow = await getGlobalAISettings();
    if (settingsRow) {
      aiCompanionDailyLimit = normalizeLimit((settingsRow as any).aiCompanionDailyLimit, DEFAULT_AI_COMPANION_DAILY_LIMIT);
    }
  } catch (dbErr) {
    console.error("[AI] Failed to fetch AI limits for companion stream:", dbErr);
  }

  let limitState: Awaited<ReturnType<typeof consumeAILimit>> | undefined;
  try {
    limitState = await consumeAILimit({
      userKey: getRequestUserKey(userId, req),
      scope: "companion",
      dailyLimit: await getPlanAdjustedAILimit(userId, aiCompanionDailyLimit),
    });
    if (!limitState.allowed) {
      res.status(429).json({
        error: `Limit AI Companion harian sudah habis (${limitState.used}/${limitState.limit}). Coba lagi besok atau minta admin naikkan limit.`,
        limit: limitState.limit,
        used: limitState.used,
        remaining: limitState.remaining,
      });
      return;
    }
  } catch (limitErr) {
    console.error("[AI] Failed to consume companion stream limit:", limitErr);
    res.status(500).json({ error: "Gagal mengecek limit AI Companion. Coba lagi sebentar." });
    return;
  }

  if (!resolvedKey) {
    try {
      if (settingsRow) {
        resolvedProvider = normalizeProvider(aiProvider || settingsRow.aiProvider || undefined);
        resolvedOpenRouterKey = resolvedOpenRouterKey || settingsRow.openrouterKey || undefined;
        resolvedObscuraKey = resolvedObscuraKey || settingsRow.obscuraKey || undefined;
        resolvedKey = resolvedProvider === "obscura" ? resolvedObscuraKey : resolvedOpenRouterKey;
        resolvedObscuraModel = resolvedObscuraModel || settingsRow.obscuraModel || undefined;
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
  let streamedOutputTokens = 0;
  let imageModelCount = 0;

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
    const baseSystemPrompt = `Kamu adalah model ${modelId} di arena perbandingan. Jawab dengan pendekatan dan gaya yang berbeda dari model lain: pilih struktur, contoh, analogi, dan prioritas analisismu sendiri. Jangan meniru format generik atau mengulang jawaban model lain.`;
    const systemPrompt = await buildDynamicSystemPrompt(userId, baseSystemPrompt);

    const modelMessages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages.map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "") })),
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
          streamedOutputTokens += IMAGE_USAGE_TOKEN_COST;
          imageModelCount += 1;
          sendEvent({ type: "image", modelId, imageUrl });
          sendEvent({ type: "done", modelId, latency: Date.now() - startedAt });
        } else if (content) {
          streamedOutputTokens += estimateTokensFromText(content);
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
      let outputText = "";

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
              outputText += delta;
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
        streamedOutputTokens += estimateTokensFromText(outputText);
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
          streamedOutputTokens += estimateTokensFromText(fallbackContent);
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
  const textModelCount = Math.max(0, modelIds.length - imageModelCount);
  await addAIUsageTokens(
    limitState?.usageId,
    estimateTokensFromMessages(messages) * textModelCount + streamedOutputTokens
  );
  if (!clientClosed) {
    sendEvent({ type: "complete" });
    res.end();
  }
});

export default router;
