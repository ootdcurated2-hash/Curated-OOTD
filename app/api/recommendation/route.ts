/**
 * app/api/recommendation/route.ts
 * ─────────────────────────────────────────────────────────────
 * Endpoint "Tanya AI" Curated OOTD.
 *
 * Yang berubah dibanding versi lama:
 *  1. Tidak lagi menunggu Gemini dengan Promise.race 3,5 detik (jawabannya
 *     sering terbuang karena model lambat dianggap gagal).
 *  2. Semua provider dipanggil lewat SATU rantai fallback (runAiChain):
 *     Gemini → Groq → OpenRouter (DeepSeek/Qwen/Llama/GPT-OSS gratis) →
 *     OpenAI → Grok. Begitu satu provider quota habis/error, otomatis
 *     lanjut ke AI berikutnya tanpa menunggu user menekan ulang.
 *  3. Jawaban AI dinormalisasi (lib/aiResponse) sehingga UI tidak pernah
 *     crash walau model mengembalikan field tidak lengkap / beda nama.
 * ─────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getConsultationResponse,
  SKIN_TONE_DATA,
} from "@/lib/skinToneAdvisor";
import { runAiChain, describeAttempts, type ChainAttempt } from "@/lib/aiFallbackChain";
import { parseAiJson, isUsableRecommendation, normalizeRecommendation } from "@/lib/aiResponse";
import { getAdminContext } from "@/lib/adminServer";
import { DAILY_LIMIT, getTodayDateString, getNextResetTime } from "@/lib/aiQuota";

/** Netlify/Vercel boleh memangkas ini; batas internal rantai AI ada di AI_DEADLINE_MS */
export const maxDuration = 60;

const SYSTEM_PROMPT = `Kamu Fashion Consultant AI untuk Curated OOTD (Indonesia). Jawab HANYA JSON valid tanpa markdown, tanpa penjelasan tambahan:
{
  "skinToneKey": "cokelat"|"kuning_langsat"|"gelap"|"terang"|"custom",
  "skinToneTitle": "judul spesifik jawaban",
  "summary": "2-3 kalimat jawaban langsung ke pertanyaan",
  "undertoneAnalysis": "analisis undertone singkat",
  "tips": {
    "title": "Formula Gaya",
    "advice": "saran praktis",
    "colorPalette": [{"name":"Krem","hex":"#F5E6D3"}],
    "avoidColors": ["..."],
    "recommendedStyles": ["..."],
    "examplePieces": [{"name":"Kemeja Linen","category":"Atasan","reason":"..."}]
  },
  "quickPrompts": ["...","...","..."]
}
Aturan: colorPalette minimal 4 item dengan hex format #RRGGBB, examplePieces minimal 2 item, semua teks Bahasa Indonesia yang ramah dan singkat.`;

/** Label provider yang dibaca UI untuk menampilkan badge "Analisis … AI" */
const PROVIDER_LABELS: Record<string, string> = {
  gemini_ai: "Gemini AI",
  groq_ai: "Groq Llama AI",
  openai: "ChatGPT AI",
  grok_ai: "Grok AI",
  deepseek: "DeepSeek AI",
  qwen: "Qwen AI",
  meta: "Meta Llama AI",
  liquid_ai: "Liquid AI",
  cohere: "Cohere AI",
  poolside: "Poolside AI",
  dots_ai: "Dots AI",
  nvidia_ai: "NVIDIA Nemotron AI",
};

function providerLabel(provider: string): string {
  if (PROVIDER_LABELS[provider]) return PROVIDER_LABELS[provider];
  const cleaned = provider.replace(/^openrouter_/, "").replace(/_/g, " ");
  return `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)} AI`;
}

/** Provider mana saja yang sudah terpasang API key-nya (untuk GET / health-check) */
function providerKeyStatus() {
  return {
    gemini: Boolean(process.env.GEMINI_API_KEY?.trim()),
    groq: Boolean(process.env.GROQ_API_KEY?.trim()),
    openrouter: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
    openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
    grok: Boolean((process.env.XAI_API_KEY || process.env.GROK_API_KEY || "").trim()),
  };
}

export async function GET() {
  const keys = providerKeyStatus();
  const active = Object.entries(keys)
    .filter(([, ok]) => ok)
    .map(([name]) => name);
  return NextResponse.json({
    success: true,
    message:
      active.length > 0
        ? `Rantai AI aktif: ${active.join(" → ")}. Urutan fallback: Gemini → Groq → OpenRouter → OpenAI → Grok.`
        : "Belum ada API key AI yang terpasang. Tambahkan GEMINI_API_KEY dan/atau OPENROUTER_API_KEY di .env.local.",
    keys,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { question, skinTone, clientUsedCount } = await req.json();

    if (skinTone && SKIN_TONE_DATA[skinTone]) {
      return NextResponse.json({
        success: true,
        data: SKIN_TONE_DATA[skinTone],
        source: "preset",
      });
    }

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { success: false, message: "Pertanyaan tidak boleh kosong." },
        { status: 400 }
      );
    }

    // ─── Pengecekan Role & Kuota Harian (Maksimal 10 Pertanyaan untuk User) ────
    const adminCtx = await getAdminContext();
    const isAdmin = adminCtx.isAdmin;
    const resetsAt = getNextResetTime().toISOString();
    const today = getTodayDateString();

    if (!isAdmin) {
      const currentUsed = typeof clientUsedCount === "number" ? clientUsedCount : 0;
      if (currentUsed >= DAILY_LIMIT) {
        return NextResponse.json(
          {
            success: false,
            quotaExceeded: true,
            message: `Batas bertanya AI harian kamu sudah habis (${DAILY_LIMIT}/${DAILY_LIMIT}). Kuota akan di-reset otomatis besok hari pukul 00.00 WIB.`,
            quota: {
              limit: DAILY_LIMIT,
              used: DAILY_LIMIT,
              remaining: 0,
              isAdmin: false,
              resetsAt,
              resetDateStr: today,
            },
          },
          { status: 429 }
        );
      }
    }

    const localFallback = getConsultationResponse(question);
    const cleanQuestion = question.trim();

    const newUsed = isAdmin ? 0 : typeof clientUsedCount === "number" ? clientUsedCount + 1 : 1;
    const quotaInfo = {
      limit: DAILY_LIMIT,
      used: isAdmin ? 0 : Math.min(DAILY_LIMIT, newUsed),
      remaining: isAdmin ? 9999 : Math.max(0, DAILY_LIMIT - newUsed),
      isAdmin,
      resetsAt,
      resetDateStr: today,
    };

    // ─── Jalankan rantai AI: Gemini → Groq → OpenRouter → OpenAI → Grok ───────
    const attemptLog: ChainAttempt[] = [];
    const chain = await runAiChain({
      systemPrompt: SYSTEM_PROMPT,
      userMessage: cleanQuestion,
      isUsable: (text) => isUsableRecommendation(parseAiJson(text)),
      onAttempt: (a) => attemptLog.push(a),
    });

    if (chain) {
      const parsed = parseAiJson(chain.text);

      if (parsed && isUsableRecommendation(parsed)) {
        const data = normalizeRecommendation(parsed, localFallback);
        const attempts = chain.attempts;
        console.info(
          `[Recommendation] ✅ ${chain.provider}:${chain.model} dalam ${chain.elapsedMs}ms | ${describeAttempts(attempts)}`
        );

        return NextResponse.json({
          success: true,
          data,
          source: chain.provider,
          providerLabel: providerLabel(chain.provider),
          model: chain.model,
          elapsedMs: chain.elapsedMs,
          attempts,
          note:
            attempts.filter((a) => a.outcome !== "ok" && a.outcome !== "no_key").length > 0
              ? `Beberapa AI sebelumnya tidak tersedia, otomatis beralih ke ${providerLabel(chain.provider)}.`
              : undefined,
          quota: quotaInfo,
        });
      }

      // AI menjawab tapi formatnya tidak rapi → tetap dipakai, bagian yang hilang
      // dilengkapi dari kurasi lokal (UI dijamin tidak crash).
      const data = normalizeRecommendation(parsed ?? {}, localFallback);
      data.skinToneKey = "custom";
      console.warn(`[Recommendation] ⚠️ Jawaban ${chain.provider} tidak lengkap, dinormalisasi.`);

      return NextResponse.json({
        success: true,
        data,
        source: chain.provider,
        providerLabel: providerLabel(chain.provider),
        model: chain.model,
        attempts: chain.attempts,
        note: `Jawaban ${providerLabel(chain.provider)} tidak lengkap dan dilengkapi otomatis dari basis data kami.`,
        quota: quotaInfo,
      });
    }

    // ─── Semua AI gagal / tidak ada key → kurasi lokal ────────────────────────
    const keys = providerKeyStatus();
    const hasAnyKey = Object.values(keys).some(Boolean);
    console.warn(
      `[Recommendation] ❌ Seluruh rantai AI gagal. Status key: ${JSON.stringify(keys)} | ${describeAttempts(
        attemptLog
      )}`
    );

    return NextResponse.json({
      success: true,
      data: localFallback,
      source: "local_curator",
      providerLabel: "Penasihat Gaya Lokal",
      attempts: attemptLog,
      note: hasAnyKey
        ? "Semua AI yang terhubung sedang sibuk/kuota habis. Ini rekomendasi dari basis data Curated OOTD — coba lagi sebentar ya."
        : "Belum ada API key AI yang terpasang. Tambahkan GEMINI_API_KEY dan/atau OPENROUTER_API_KEY agar jawaban datang dari AI.",
      quota: quotaInfo,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[Recommendation] Unexpected error:", error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
