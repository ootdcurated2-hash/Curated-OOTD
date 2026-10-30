/**
 * aiResponse.ts
 * ─────────────────────────────────────────────────────────────
 * Validasi & normalisasi JSON yang dikirim model AI.
 *
 * Kenapa perlu: tiap provider (Gemini, Groq, OpenRouter, dsb.) punya kebiasaan
 * format berbeda — ada yang membungkus markdown ```json, ada yang memakai
 * nama field beda (color_palette / palette), ada yang tidak mengirim
 * quickPrompts sama sekali. Tanpa normalisasi, UI akan crash saat mengakses
 * result.tips.colorPalette.map() atau result.quickPrompts.slice().
 * ─────────────────────────────────────────────────────────────
 */

import { RecommendationResponse, SKIN_TONE_DATA } from "@/lib/skinToneAdvisor";

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const DEFAULT_QUICK_PROMPTS = [
  "Warna apa yang cocok untuk acara formal?",
  "Outfit casual untuk kulit gelap",
  "Kulit kuning langsat cocok pakai lipstik warna apa?",
];

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(asString).filter(Boolean);
  }
  if (typeof value === "string") {
    // Beberapa model mengirim "a, b, c" alih-alih array
    return value
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/** Cek apakah objek tampak berisi jawaban rekomendasi (bukan bungkus acak) */
function looksLikeRecommendation(obj: Record<string, unknown>): boolean {
  const keys = [
    "skinToneTitle",
    "skin_tone_title",
    "title",
    "summary",
    "tips",
    "colorPalette",
    "color_palette",
    "undertoneAnalysis",
  ];
  return keys.some((k) => obj[k] !== undefined && obj[k] !== null);
}

/** Ambil objek pertama yang mungkin muat berisi jawaban JSON */
function pickSource(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  if (looksLikeRecommendation(obj)) return obj;

  // Beberapa model membungkus jawaban di { response: {...} } atau { data: {...} }
  for (const key of ["response", "data", "result", "recommendation", "output"]) {
    const inner = obj[key];
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      return inner as Record<string, unknown>;
    }
  }
  return obj;
}

/**
 * Parse teks AI menjadi objek. Toleran terhadap pagar markdown dan teks
 * pengantar sebelum/sesudah JSON.
 */
export function parseAiJson(text: string): Record<string, unknown> | null {
  const cleaned = text
    .replace(/^\uFEFF/, "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
  } catch {
    // lanjut ke pencarian substring {...}
  }

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
  } catch {
    return null;
  }

  return null;
}

function normalizePalette(value: unknown, fallback: RecommendationResponse) {
  const list = Array.isArray(value) ? value : [];
  const palette = list
    .map((item) => {
      if (typeof item === "string") {
        // format "Nama (#FF0000)" atau "#FF0000"
        const hex = item.match(HEX_RE)?.[0] || item.match(/#[0-9a-fA-F]{3,6}/)?.[0] || "";
        const name = item.replace(/#[0-9a-fA-F]{3,6}/g, "").replace(/[()\[\]]/g, "").trim();
        return hex ? { name: name || hex, hex } : null;
      }
      const obj = (item || {}) as Record<string, unknown>;
      const hex = asString(obj.hex || obj.color || obj.value || obj.code);
      if (!HEX_RE.test(hex)) return null;
      return { name: asString(obj.name || obj.label) || hex, hex };
    })
    .filter(Boolean) as { name: string; hex: string }[];

  return palette.length > 0 ? palette.slice(0, 12) : fallback.tips.colorPalette;
}

/** Jawaban masih dianggap layak kalau ada judul/isi dan minimal 1 warna valid */
export function isUsableRecommendation(raw: unknown): boolean {
  const src = pickSource(raw);
  if (!src) return false;

  const title = asString(src.skinToneTitle || src.title || src.judul);
  const summary = asString(src.summary || src.ringkasan || src.description);
  if (!title && !summary) return false;

  const tips = (src.tips || src.rekomendasi || src) as Record<string, unknown>;
  const palette = tips?.colorPalette || tips?.color_palette || tips?.palette;
  return normalizePalette(palette, SKIN_TONE_DATA.cokelat).length > 0;
}

/**
 * Rapikan JSON AI menjadi RecommendationResponse yang dijamin lengkap,
 * memakai `fallback` (kurasi lokal) untuk setiap field yang hilang.
 */
export function normalizeRecommendation(
  raw: unknown,
  fallback: RecommendationResponse
): RecommendationResponse {
  const src = pickSource(raw) || {};
  const tips = ((src.tips || src.rekomendasi || {}) as Record<string, unknown>) || {};

  const skinToneKeyRaw = asString(src.skinToneKey || src.skin_tone_key).toLowerCase();
  const skinToneKey = SKIN_TONE_DATA[skinToneKeyRaw] ? skinToneKeyRaw : "custom";

  const title =
    asString(src.skinToneTitle || src.title) || fallback.skinToneTitle;
  const summary = asString(src.summary) || fallback.summary;
  const undertone =
    asString(src.undertoneAnalysis || src.undertone) || fallback.undertoneAnalysis;

  const colorPalette = normalizePalette(
    tips.colorPalette || tips.color_palette || tips.palette,
    fallback
  );

  const examplePiecesRaw = Array.isArray(tips.examplePieces || tips.example_pieces)
    ? (tips.examplePieces || tips.example_pieces)
    : [];
  const examplePieces = (examplePiecesRaw as unknown[])
    .map((item) => {
      const obj = (typeof item === "string" ? { name: item } : item || {}) as Record<string, unknown>;
      const name = asString(obj.name || obj.item || obj.produk);
      if (!name) return null;
      return {
        name,
        category: asString(obj.category) || "Atasan",
        reason: asString(obj.reason || obj.alasan) || "Cocok dengan palet warna kamu",
      };
    })
    .filter(Boolean) as RecommendationResponse["tips"]["examplePieces"];

  const quickPrompts = asStringArray(src.quickPrompts || src.quick_prompts).slice(0, 6);

  return {
    skinToneKey,
    skinToneTitle: title,
    summary,
    undertoneAnalysis: undertone,
    tips: {
      title: asString(tips.title) || "Formula Gaya",
      advice: asString(tips.advice) || fallback.tips.advice,
      colorPalette,
      avoidColors: asStringArray(tips.avoidColors || tips.avoid_colors),
      recommendedStyles: asStringArray(
        tips.recommendedStyles || tips.recommended_styles || tips.styles
      ),
      examplePieces: examplePieces.length > 0 ? examplePieces : fallback.tips.examplePieces,
    },
    quickPrompts: quickPrompts.length > 0 ? quickPrompts : DEFAULT_QUICK_PROMPTS,
  };
}

export const FALLBACK_QUICK_PROMPTS = DEFAULT_QUICK_PROMPTS;
