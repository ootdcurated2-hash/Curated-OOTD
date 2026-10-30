/**
 * geminiClient.ts
 * ─────────────────────────────────────────────────────────────
 * Pemanggil API Gemini (Google AI Studio) — tier GRATIS.
 *
 * CATATAN PENTING (hasil pengujian nyata ke endpoint Gemini):
 *  - `gemini-3.8-flash`      → HTTP 503 (model ini tidak tersedia)
 *  - `gemini-flash-latest`   → sering menggantung > 20 detik
 *  - `gemini-2.5-flash*`     → HTTP 404 "no longer available to new users"
 *  - `gemini-3.1-flash-lite` → HTTP 200, ±2,5 detik  ✅ paling cepat
 *  - `gemini-3.5-flash-lite` → HTTP 200, ±3,4 detik  ✅ stabil
 *  - `gemini-3.5-flash`      → HTTP 200, ±11 detik   ✅ tapi lambat
 * Urutan di bawah disusun berdasarkan hasil ukur tersebut, supaya
 * tidak ada lagi percobaan sia-sia ke model yang sudah mati.
 * ─────────────────────────────────────────────────────────────
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

/** Diurutkan dari yang tercepat & paling stabil hasil pengujian nyata */
const PREFERRED_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-flash-latest",
];

/** Timeout longgar: model gratisan kadang lambat di antrian. Bisa di-override via env. */
const DEFAULT_TIMEOUT_MS = 9000;

export interface GeminiResult {
  text: string;
  model: string;
  /** true = quota / rate limit habis (429, 503) → rantai AI langsung ganti provider */
  quotaExhausted?: boolean;
}

function geminiHeaders(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-goog-api-key": apiKey,
  };
}

function resolveModelOrder(envModel?: string): string[] {
  const ordered: string[] = [];
  const custom = envModel?.trim();
  if (custom) ordered.push(custom);
  for (const id of PREFERRED_MODELS) {
    if (!ordered.includes(id)) ordered.push(id);
  }
  return ordered;
}

function readTimeoutMs(deadlineMs?: number): number {
  const fromEnv = Number(process.env.GEMINI_TIMEOUT_MS);
  const base = Number.isFinite(fromEnv) && fromEnv >= 2000 ? fromEnv : DEFAULT_TIMEOUT_MS;
  // Jangan pernah melebihi sisa deadline global
  return deadlineMs ? Math.max(1500, Math.min(base, deadlineMs)) : base;
}

/**
 * Coba model Gemini satu per satu sampai ada yang mengembalikan teks valid.
 * PENTING: limit free-tier Google dihitung PER MODEL (RPD tiap model beda),
 * jadi saat satu model balas 429 kita tetap coba model Gemini berikutnya
 * sebelum menyerah ke provider lain.
 */
export async function generateGeminiText(
  apiKey: string,
  prompt: string,
  envModel?: string,
  deadlineMs?: number
): Promise<GeminiResult | null> {
  const key = apiKey.trim();
  if (!key) return null;

  const models = resolveModelOrder(envModel);
  const timeoutMs = readTimeoutMs(deadlineMs);
  let sawQuota = false;

  for (const model of models) {
    const startedAt = Date.now();
    try {
      const res = await fetch(`${GEMINI_BASE}/models/${model}:generateContent`, {
        method: "POST",
        headers: geminiHeaders(key),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.45,
            maxOutputTokens: 1500,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (res.status === 429 || res.status === 503) {
        // Catat, tapi lanjut ke model Gemini berikutnya (limit per model)
        console.warn(`[Gemini] ${model} → HTTP ${res.status} (quota/rate-limit)`);
        sawQuota = true;
        continue;
      }

      if (res.status === 401 || res.status === 403) {
        // Key mati — percuma coba model lain
        console.warn(`[Gemini] ${model} → HTTP ${res.status} (API key ditolak)`);
        return null;
      }

      if (res.ok) {
        const data = await res.json();
        const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
        if (text) {
          console.info(`[Gemini] ✅ ${model} dalam ${Date.now() - startedAt}ms`);
          return { text, model };
        }
        console.warn(`[Gemini] ${model} → balasan kosong (kemungkinan diblokir safety)`);
        continue;
      }

      const errBody = await res.text().catch(() => "");
      console.warn(
        `[Gemini] ${model} → HTTP ${res.status}: ${errBody.slice(0, 200)}`
      );
      // 404 = model tidak tersedia untuk key ini → lanjut ke model berikutnya
    } catch (err) {
      console.warn(
        `[Gemini] ${model} → gagal (${Date.now() - startedAt}ms): ${
          err instanceof Error ? err.name : "unknown"
        }`
      );
    }
  }

  if (sawQuota) {
    return { text: "", model: models[0] ?? "gemini", quotaExhausted: true };
  }
  return null;
}
