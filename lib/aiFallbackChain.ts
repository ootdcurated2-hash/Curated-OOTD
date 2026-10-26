/**
 * aiFallbackChain.ts
 * ─────────────────────────────────────────────────────────────
 * Chain fallback AI gratis via OpenRouter.ai
 * Urutan: Gemini → Grok → DeepSeek → Qwen → ChatGPT (free) → Meta Llama
 *
 * Semua model di bawah pakai tier GRATIS OpenRouter.
 * Daftar lengkap: https://openrouter.ai/models?q=free
 * ─────────────────────────────────────────────────────────────
 */

export interface AIResult {
  text: string;
  model: string;
  provider: string;
}

/** Model gratis di OpenRouter — diurutkan dari yang paling stabil dan responsif */
const FREE_OPENROUTER_MODELS = [
  {
    id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    label: "Nemotron 3 Nano Omni",
    provider: "nvidia_ai",
  },
] as const;

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

/**
 * Coba satu model OpenRouter.
 * Return null jika gagal / quota habis / tidak ada response valid.
 */
async function tryOpenRouterModel(
  apiKey: string,
  modelId: string,
  provider: string,
  systemPrompt: string,
  userMessage: string
): Promise<AIResult | null> {
  try {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://curated-ootd.vercel.app",
        "X-Title": "Curated OOTD Fashion AI",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.45,
        max_tokens: 1500,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[OpenRouter] ${modelId} → HTTP ${res.status}:`, errText.slice(0, 300));
      return null;
    }

    const data = await res.json();

    // Tangani error dari OpenRouter (bukan HTTP error, tapi body error)
    if (data.error) {
      console.warn(`[OpenRouter] ${modelId} → API error:`, data.error?.message || data.error);
      return null;
    }

    const text = (data.choices?.[0]?.message?.content || "").trim();
    if (!text) return null;

    return { text, model: modelId, provider };
  } catch (err) {
    console.warn(`[OpenRouter] ${modelId} → request failed:`, err);
    return null;
  }
}

/**
 * Jalankan seluruh chain fallback OpenRouter.
 * Coba model satu per satu sampai ada yang berhasil.
 */
export async function runOpenRouterFallback(
  systemPrompt: string,
  userMessage: string
): Promise<AIResult | null> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    console.info("[OpenRouter] OPENROUTER_API_KEY tidak ditemukan, skip fallback.");
    return null;
  }

  for (const { id, provider } of FREE_OPENROUTER_MODELS) {
    const result = await tryOpenRouterModel(apiKey, id, provider, systemPrompt, userMessage);
    if (result) {
      console.info(`[OpenRouter] ✅ Berhasil dengan model: ${id}`);
      return result;
    }
  }

  console.warn("[OpenRouter] ❌ Semua model fallback gagal.");
  return null;
}

/**
 * Deteksi apakah error Gemini/Grok adalah quota habis (429 / rate limit).
 * Digunakan route handler untuk memutuskan apakah perlu fallback atau tidak.
 */
export function isQuotaError(status: number): boolean {
  return status === 429 || status === 503;
}
