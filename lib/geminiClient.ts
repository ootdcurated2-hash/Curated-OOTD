const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

const PREFERRED_MODELS = [
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
];

let cachedModelNames: string[] | null = null;
let cacheExpiresAt = 0;

function geminiHeaders(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-goog-api-key": apiKey,
  };
}

async function resolveModelOrder(apiKey: string, envModel?: string): Promise<string[]> {
  const ordered: string[] = [];
  if (envModel?.trim()) ordered.push(envModel.trim());
  for (const id of PREFERRED_MODELS) {
    if (!ordered.includes(id)) ordered.push(id);
  }
  return ordered;
}

export interface GeminiResult {
  text: string;
  model: string;
  /** true = quota/rate-limit habis (HTTP 429) → langsung fallback ke AI lain */
  quotaExhausted?: boolean;
}

export async function generateGeminiText(
  apiKey: string,
  prompt: string,
  envModel?: string
): Promise<GeminiResult | null> {
  const key = apiKey.trim();
  if (!key) return null;

  const models = await resolveModelOrder(key, envModel);
  // Coba maksimal 2 model teratas saja agar tidak blocking lama
  const topModels = models.slice(0, 2);

  for (const model of topModels) {
    const url = `${GEMINI_BASE}/models/${model}:generateContent`;

    try {
      const res = await fetch(url, {
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
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        if (text) {
          return { text, model };
        }
      }

      if (res.status === 429 || res.status === 503) {
        return { text: "", model, quotaExhausted: true };
      }
    } catch {
      // Timeout atau network error, lanjut fallback
    }
  }

  return null;
}
