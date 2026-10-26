import { NextRequest, NextResponse } from "next/server";
import {
  getConsultationResponse,
  SKIN_TONE_DATA,
  RecommendationResponse,
} from "@/lib/skinToneAdvisor";
import { generateGeminiText } from "@/lib/geminiClient";
import { runOpenRouterFallback } from "@/lib/aiFallbackChain";

const GROK_MODEL = process.env.GROK_MODEL || "grok-2-1212";

function parseRecommendationJson(raw: string): RecommendationResponse {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as RecommendationResponse;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("JSON AI tidak valid");
    return JSON.parse(match[0]) as RecommendationResponse;
  }
}

function isValidRecommendation(data: RecommendationResponse): boolean {
  return Boolean(data.skinToneTitle && data.tips?.colorPalette?.length);
}

const SYSTEM_PROMPT = `Kamu Fashion Consultant AI untuk Curated OOTD (Indonesia). Jawab HANYA JSON valid tanpa markdown:
{
  "skinToneKey": "cokelat"|"kuning_langsat"|"gelap"|"terang"|"custom",
  "skinToneTitle": "judul spesifik jawaban",
  "summary": "2-3 kalimat jawaban",
  "undertoneAnalysis": "analisis singkat",
  "tips": {
    "title": "Formula Gaya",
    "advice": "saran praktis",
    "colorPalette": [{"name":"...","hex":"#XXXXXX"} x5],
    "avoidColors": ["..."],
    "recommendedStyles": ["..."],
    "examplePieces": [{"name":"...","category":"Atasan|Bawahan","reason":"..."}]
  },
  "quickPrompts": ["...","...","..."]
}`;

export async function POST(req: NextRequest) {
  try {
    const { question, skinTone } = await req.json();

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

    const fallbackRecommendation = getConsultationResponse(question);
    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
    const xaiApiKey = (process.env.XAI_API_KEY || process.env.GROK_API_KEY)?.trim();
    const fullPrompt = `${SYSTEM_PROMPT}\n\nPertanyaan: ${question.trim()}`;

    // ─── 1. Coba Gemini (dengan timeout ketat 3.5 detik) ─────────────────────
    if (geminiApiKey) {
      try {
        const geminiPromise = generateGeminiText(
          geminiApiKey,
          fullPrompt,
          process.env.GEMINI_MODEL
        );
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
        const gemini = await Promise.race([geminiPromise, timeoutPromise]);

        if (gemini?.text) {
          try {
            const parsed = parseRecommendationJson(gemini.text);
            if (isValidRecommendation(parsed)) {
              return NextResponse.json({
                success: true,
                data: parsed,
                source: "gemini_ai",
                model: gemini.model,
              });
            }
          } catch (parseErr) {
            console.error("[Route] Gemini JSON parse error:", parseErr);
          }
        }
      } catch (geminiErr) {
        console.error("[Route] Gemini request failed:", geminiErr);
      }
    }

    // ─── 2. Coba Grok (hanya jika key berformat standar xai-) ──────────────────
    if (xaiApiKey && xaiApiKey.startsWith("xai-")) {
      try {
        const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${xaiApiKey}`,
          },
          body: JSON.stringify({
            model: GROK_MODEL,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: question.trim() },
            ],
            temperature: 0.4,
            max_tokens: 1500,
          }),
          signal: AbortSignal.timeout(3000),
        });

        if (grokRes.ok) {
          const grokData = await grokRes.json();
          const rawContent = grokData.choices?.[0]?.message?.content || "";
          if (rawContent) {
            try {
              const parsed = parseRecommendationJson(rawContent);
              if (isValidRecommendation(parsed)) {
                return NextResponse.json({
                  success: true,
                  data: parsed,
                  source: "grok_ai",
                  model: GROK_MODEL,
                });
              }
            } catch (parseErr) {
              console.error("[Route] Grok JSON parse error:", parseErr);
            }
          }
        }
      } catch (grokErr) {
        console.error("[Route] Grok request failed:", grokErr);
      }
    }

    // ─── 3. Fallback ke OpenRouter (DeepSeek / Qwen / GPT-4o-mini / Llama / dst) ─
    const openrouterResult = await runOpenRouterFallback(SYSTEM_PROMPT, question.trim());
    if (openrouterResult) {
      try {
        const parsed = parseRecommendationJson(openrouterResult.text);
        if (isValidRecommendation(parsed)) {
          return NextResponse.json({
            success: true,
            data: parsed,
            source: openrouterResult.provider,
            model: openrouterResult.model,
          });
        }
      } catch (parseErr) {
        console.error("OpenRouter JSON parse error:", parseErr);
      }
    }

    // ─── 4. Fallback lokal (tidak ada API yang berhasil) ─────────────────────
    return NextResponse.json({
      success: true,
      data: fallbackRecommendation,
      source: "local_curator",
      note: "Semua AI (Gemini, Grok, OpenRouter) tidak dapat dijangkau atau quota habis. Pastikan OPENROUTER_API_KEY sudah ditambahkan di .env.local untuk fallback otomatis.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
