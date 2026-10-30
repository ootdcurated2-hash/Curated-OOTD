/**
 * aiFallbackChain.ts
 * ─────────────────────────────────────────────────────────────
 * RANTAI FALLBACK AI MULTI-PROVIDER (otomatis ganti AI saat token habis)
 *
 * Cara kerja:
 *   Gemini (Google)  →  Groq (Llama)  →  OpenRouter (DeepSeek/Qwen/GPT-OSS/
 *   Nemotron/dsb. tier GRATIS)  →  OpenAI (ChatGPT)  →  xAI (Grok)
 *
 * Provider dilewati bila:
 *   • API key-nya tidak ada di environment
 *   • balasannya quota habis (HTTP 429 / 503)
 *   • balasannya error / kosong / JSON-nya tidak layak pakai
 *
 * Semua provider di atas punya tier gratis. OpenRouter adalah kunci permintaan
 * "DeepSeek / Qwen / ChatGPT gratis" karena satu key bisa memanggil puluhan
 * model `:free`. Daftar: https://openrouter.ai/models?q=free
 *
 * Environment opsional:
 *   AI_DEADLINE_MS      total budget waktu rantai (default 8500)
 *   GEMINI_TIMEOUT_MS   timeout per request Gemini
 *   GROQ_MODEL / OPENROUTER_MODEL / OPENAI_MODEL / GROK_MODEL  override model
 *   AI_RETRY_FAILED     "true" = jangan skip provider walau quota habis (debug)
 * ─────────────────────────────────────────────────────────────
 */

import { generateGeminiText } from "@/lib/geminiClient";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

/** Perintah "ganti AI lain" dipicu bila kuota / gangguan sementara terdeteksi */
const QUOTA_STATUSES = new Set([429, 502, 503, 529]);

/** Sisa waktu minimal agar masih layak mencoba provider berikutnya */
const MIN_REMAINING_MS = 1200;

const DEFAULT_DEADLINE_MS = 8500;

export interface AIResult {
  text: string;
  model: string;
  provider: string;
}

export interface ChainAttempt {
  provider: string;
  model: string;
  outcome: "ok" | "quota" | "http_error" | "empty" | "invalid" | "no_key" | "skipped";
  ms: number;
  detail?: string;
}

export interface ChainSuccess extends AIResult {
  attempts: ChainAttempt[];
  elapsedMs: number;
}

/**
 * Model gratis OpenRouter yang SUDAH diuji dan terbukti tersedia, tercepat dulu.
 * Model yang lambat (12–27 detik) ditaruh di ekor daftar supaya tidak
 * menghabiskan budget waktu sebelum AI lain sempat dicoba.
 */
const FAST_OPENROUTER_MODELS = [{ id: "liquid/lfm-2.5-2.6b:free", provider: "liquid_ai" }];

const SLOW_OPENROUTER_MODELS = [
  { id: "cohere/north-mini-code:free", provider: "cohere" },
  { id: "poolside/laguna-s-2.1:free", provider: "poolside" },
  { id: "dots-studio/dots-3-note-preview:free", provider: "dots_ai" },
  { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", provider: "nvidia_ai" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", provider: "nvidia_ai" },
];

const KNOWN_OPENROUTER_MODELS = [...FAST_OPENROUTER_MODELS, ...SLOW_OPENROUTER_MODELS];

/** Vendor yang disukai user (ChatGPT/DeepSeek/Qwen/dll) dapat prioritas ekstra */
const PREFERRED_KEYWORDS = [
  "deepseek",
  "qwen",
  "llama",
  "gemma",
  "mistral",
  "phi",
  "gpt-oss",
  "glm",
  "kimi",
  "command",
  "lfm",
];

const OPENROUTER_MODELS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let freeModelCache: { list: { id: string; provider: string }[]; expiresAt: number } | null = null;

/**
 * Model `:free` punya rate-limit per menit. Kalau satu model balas 429 atau
 * terlalu lambat, kita "dinginkan" 60 detik agar request berikutnya memakai
 * model lain — ini yang membuat fallback terasa otomatis, bukan selalu gagal.
 */
const cooldown = new Map<string, number>();
const COOLDOWN_MS = 60_000;

function isInCooldown(id: string): boolean {
  const until = cooldown.get(id);
  if (!until) return false;
  if (until < Date.now()) {
    cooldown.delete(id);
    return false;
  }
  return true;
}

function coolDown(id: string, ms = COOLDOWN_MS): void {
  cooldown.set(id, Date.now() + ms);
}

/** Groq: gratis + paling cepat di kelasnya */
const FREE_GROQ_MODELS = ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"];

/** OpenAI (ChatGPT) dipakai bila user punya key sendiri */
const OPENAI_MODELS = ["gpt-4o-mini", "gpt-4.1-mini", "gpt-3.5-turbo"];

const XAI_MODELS = ["grok-2-1212", "grok-3-mini"];

function envList(name: string): string[] {
  return (process.env[name] || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function modelList(envName: string, builtIn: string[]): string[] {
  const custom = envList(envName);
  return custom.length > 0 ? [...custom, ...builtIn] : builtIn;
}

function openRouterProviderName(id: string): string {
  const vendor = id.split("/")[0] || "openrouter";
  const known = KNOWN_OPENROUTER_MODELS.find((m) => m.id === id);
  if (known) return known.provider;
  return `openrouter_${vendor.replace(/[^a-z0-9]/gi, "_")}`;
}

/**
 * Ambil daftar model `:free` yang benar-benar tersedia saat ini.
 * Disimpan 6 jam di memori server supaya tidak tiap pertanyaan kena API list.
 */
async function discoverFreeModels(timeoutMs: number): Promise<{ id: string; provider: string }[]> {
  if (freeModelCache && freeModelCache.expiresAt > Date.now()) return freeModelCache.list;

  let discovered: { id: string; provider: string }[] = [];
  try {
    const res = await fetch(`${OPENROUTER_BASE}/models`, {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY?.trim() || ""}` },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok) {
      const data = (await res.json()) as { data?: { id?: string }[] };
      const freeIds = (data.data || [])
        .map((m) => (typeof m.id === "string" ? m.id : ""))
        .filter((id) => id.endsWith(":free"));

      const rank = (id: string) => {
        const lower = id.toLowerCase();
        const idx = PREFERRED_KEYWORDS.findIndex((k) => lower.includes(k));
        return idx === -1 ? PREFERRED_KEYWORDS.length : idx;
      };

      discovered = freeIds
        .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
        .slice(0, 24)
        .map((id) => ({ id, provider: openRouterProviderName(id) }));
    }
  } catch (err) {
    console.warn(`[OpenRouter] gagal daftar model: ${err instanceof Error ? err.name : "?"}`);
  }

  const merged = [
    ...FAST_OPENROUTER_MODELS,
    ...discovered.filter(
      (d) => !KNOWN_OPENROUTER_MODELS.some((p) => p.id === d.id) && !isInCooldown(d.id)
    ),
    ...SLOW_OPENROUTER_MODELS,
  ];
  freeModelCache = { list: merged, expiresAt: Date.now() + OPENROUTER_MODELS_CACHE_TTL_MS };
  console.info(`[OpenRouter] ${merged.length} model siap dicoba (prioritas + dinamis).`);
  return merged;
}

function openRouterModelList(): { id: string; provider: string }[] {
  const custom = envList("OPENROUTER_MODEL").map((id) => ({
    id,
    provider: openRouterProviderName(id),
  }));
  return custom.length > 0
    ? [...custom, ...FAST_OPENROUTER_MODELS, ...SLOW_OPENROUTER_MODELS]
    : [...FAST_OPENROUTER_MODELS, ...SLOW_OPENROUTER_MODELS];
}

function readDeadlineMs(): number {
  const fromEnv = Number(process.env.AI_DEADLINE_MS);
  return Number.isFinite(fromEnv) && fromEnv >= 3000 ? fromEnv : DEFAULT_DEADLINE_MS;
}

/**
 * Pemanggil generic API format OpenAI (/chat/completions).
 * Dipakai Groq, OpenRouter, OpenAI, xAI, dan endpoint kompatibel lainnya.
 */
async function callOpenAICompatible(options: {
  baseUrl: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  userMessage: string;
  timeoutMs: number;
  extraHeaders?: HeadersInit;
  jsonMode?: boolean;
}): Promise<{ text: string; status: number; error?: string }> {
  const body: Record<string, unknown> = {
    model: options.model,
    messages: [
      { role: "system", content: options.systemPrompt },
      { role: "user", content: options.userMessage },
    ],
    temperature: 0.45,
    // Model reasoning (nemotron/dots) menghabiskan token untuk berpikir;
    // batas kecil membuat finish_reason=length dengan content === null.
    max_tokens: 4000,
  };
  if (options.jsonMode) body.response_format = { type: "json_object" };

  try {
    const res = await fetch(`${options.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.apiKey}`,
        ...options.extraHeaders,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(options.timeoutMs),
    });

    const raw = await res.text().catch(() => "");

    if (!res.ok) {
      return { text: "", status: res.status, error: raw.slice(0, 220) };
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return { text: "", status: res.status, error: "response bukan JSON" };
    }

    if (data.error) {
      const message =
        typeof data.error === "object"
          ? ((data.error as Record<string, unknown>).message as string)
          : String(data.error);
      return { text: "", status: res.status, error: message || "API error" };
    }

    const choices = data.choices as Array<Record<string, unknown>> | undefined;
    const message = choices?.[0]?.message as Record<string, unknown> | undefined;
    const content = typeof message?.content === "string" ? message.content.trim() : "";

    // Beberapa model menaruh jawaban di `reasoning` saat content kosong
    const reasoning = typeof message?.reasoning === "string" ? message.reasoning.trim() : "";
    const fallbackFromReasoning = content ? "" : extractJsonBlock(reasoning);

    return { text: content || fallbackFromReasoning, status: res.status };
  } catch (err) {
    return { text: "", status: 0, error: err instanceof Error ? err.name : "request failed" };
  }
}

/** Ambil potongan `{...}` dari teks yang mungkin bercampur penjelasan */
function extractJsonBlock(text: string): string {
  if (!text) return "";
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  if (cleaned.startsWith("{")) return cleaned;
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return "";
  return cleaned.slice(start, end + 1);
}

export interface RunChainParams {
  systemPrompt: string;
  userMessage: string;
  /** Validasi tambahan: pastikan balasan benar-benar bisa dipakai UI */
  isUsable?: (text: string) => boolean;
  deadlineMs?: number;
  /** Dipanggil tiap kali satu AI dicoba — dipakai untuk log/debug */
  onAttempt?: (attempt: ChainAttempt) => void;
}

/**
 * Jalankan rantai provider sampai ada yang memberi jawaban layak pakai.
 * Return null bila semua provider gagal (panggilan lokal fallback).
 */
export async function runAiChain(params: RunChainParams): Promise<ChainSuccess | null> {
  const deadlineMs = params.deadlineMs ?? readDeadlineMs();
  const startedAt = Date.now();
  const attempts: ChainAttempt[] = [];
  const isUsable = params.isUsable ?? ((t: string) => t.length > 40);

  const remaining = () => deadlineMs - (Date.now() - startedAt);
  const budget = (cap: number) => Math.max(1200, Math.min(cap, remaining()));

  const record = (a: ChainAttempt) => {
    attempts.push(a);
    params.onAttempt?.(a);
  };
  const timeUsed = () => Date.now() - startedAt;

  /* ── 1. GEMINI (Google AI Studio — gratis) ─────────────────────── */
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    const result = await generateGeminiText(
      geminiKey,
      `${params.systemPrompt}\n\nPertanyaan: ${params.userMessage}`,
      process.env.GEMINI_MODEL,
      budget(9000)
    );
    if (result?.quotaExhausted) {
      record({
        provider: "gemini_ai",
        model: result.model,
        outcome: "quota",
        ms: timeUsed(),
        detail: "Kuota Gemini habis (429/503) → ganti AI lain",
      });
    } else if (result?.text && isUsable(result.text)) {
      record({ provider: "gemini_ai", model: result.model, outcome: "ok", ms: timeUsed() });
      return { ...result, provider: "gemini_ai", attempts, elapsedMs: timeUsed() };
    } else {
      record({
        provider: "gemini_ai",
        model: result?.model || "gemini",
        outcome: result?.text ? "invalid" : "empty",
        ms: timeUsed(),
      });
    }
  } else {
    record({ provider: "gemini_ai", model: "-", outcome: "no_key", ms: 0 });
  }

  /* ── 2. GROQ (Llama gratis, paling cepat) ──────────────────────── */
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey && remaining() > MIN_REMAINING_MS) {
    for (const model of modelList("GROQ_MODEL", FREE_GROQ_MODELS)) {
      if (remaining() < MIN_REMAINING_MS) break;
      const t0 = Date.now();
      const res = await callOpenAICompatible({
        baseUrl: "https://api.groq.com/openai/v1",
        apiKey: groqKey,
        model,
        systemPrompt: params.systemPrompt,
        userMessage: params.userMessage,
        timeoutMs: budget(7000),
        jsonMode: true,
      });
      if (QUOTA_STATUSES.has(res.status)) {
        record({ provider: "groq_ai", model, outcome: "quota", ms: Date.now() - t0, detail: res.error });
        break;
      }
      if (!res.text) {
        record({
          provider: "groq_ai",
          model,
          outcome: res.status ? "http_error" : "empty",
          ms: Date.now() - t0,
          detail: res.error,
        });
        continue;
      }
      if (!isUsable(res.text)) {
        record({ provider: "groq_ai", model, outcome: "invalid", ms: Date.now() - t0 });
        continue;
      }
      record({ provider: "groq_ai", model, outcome: "ok", ms: Date.now() - t0 });
      return { text: res.text, model, provider: "groq_ai", attempts, elapsedMs: Date.now() - startedAt };
    }
  } else if (!groqKey) {
    record({ provider: "groq_ai", model: "-", outcome: "no_key", ms: 0 });
  }

  /* ── 3. OPENROUTER (DeepSeek / Qwen / Llama / GPT-OSS / dst GRATIS) ── */
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey && remaining() > MIN_REMAINING_MS) {
    const candidates =
      envList("OPENROUTER_MODEL").length > 0
        ? openRouterModelList()
        : await discoverFreeModels(budget(4000));

    for (const { id, provider } of candidates) {
      if (remaining() < MIN_REMAINING_MS) {
        record({ provider, model: id, outcome: "skipped", ms: 0, detail: "deadline habis" });
        break;
      }
      if (isInCooldown(id)) {
        record({ provider, model: id, outcome: "skipped", ms: 0, detail: "cooldown" });
        continue;
      }
      const t0 = Date.now();
      const res = await callOpenAICompatible({
        baseUrl: OPENROUTER_BASE,
        apiKey: openRouterKey,
        model: id,
        systemPrompt: params.systemPrompt,
        userMessage: params.userMessage,
        timeoutMs: budget(4500),
        extraHeaders: {
          "HTTP-Referer": "https://curated-ootd.netlify.app",
          "X-Title": "Curated OOTD Fashion AI",
        },
      });
      if (QUOTA_STATUSES.has(res.status)) {
        coolDown(id);
        record({ provider, model: id, outcome: "quota", ms: Date.now() - t0, detail: res.error });
        continue;
      }
      if (res.status === 404) {
        // model tidak tersedia untuk tier gratis → jangan coba lagi 30 menit
        coolDown(id, 30 * 60_000);
        record({ provider, model: id, outcome: "http_error", ms: Date.now() - t0, detail: res.error });
        continue;
      }
      if (res.status === 401 || res.status === 403) {
        // key bermasalah → percuma coba model OpenRouter lain
        record({ provider, model: id, outcome: "http_error", ms: Date.now() - t0, detail: res.error });
        break;
      }
      if (!res.text) {
        if (!res.status) coolDown(id); // timeout → model ini sedang antri panjang
        record({
          provider,
          model: id,
          outcome: res.status ? "http_error" : "empty",
          ms: Date.now() - t0,
          detail: res.error,
        });
        continue;
      }
      if (!isUsable(res.text)) {
        coolDown(id, 5 * 60_000);
        record({ provider, model: id, outcome: "invalid", ms: Date.now() - t0 });
        continue;
      }
      record({ provider, model: id, outcome: "ok", ms: Date.now() - t0 });
      return { text: res.text, model: id, provider, attempts, elapsedMs: Date.now() - startedAt };
    }
  } else if (!openRouterKey) {
    record({ provider: "openrouter", model: "-", outcome: "no_key", ms: 0 });
  }

  /* ── 4. OPENAI (ChatGPT) — opsional, hanya bila punya key ──────── */
  const openAIKey = process.env.OPENAI_API_KEY?.trim();
  if (openAIKey && remaining() > MIN_REMAINING_MS) {
    const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    for (const model of modelList("OPENAI_MODEL", OPENAI_MODELS)) {
      if (remaining() < MIN_REMAINING_MS) break;
      const t0 = Date.now();
      const res = await callOpenAICompatible({
        baseUrl,
        apiKey: openAIKey,
        model,
        systemPrompt: params.systemPrompt,
        userMessage: params.userMessage,
        timeoutMs: budget(8000),
        jsonMode: true,
      });
      if (QUOTA_STATUSES.has(res.status)) {
        record({ provider: "openai", model, outcome: "quota", ms: Date.now() - t0, detail: res.error });
        break;
      }
      if (!res.text || !isUsable(res.text)) {
        record({
          provider: "openai",
          model,
          outcome: !res.text ? (res.status ? "http_error" : "empty") : "invalid",
          ms: Date.now() - t0,
          detail: res.error,
        });
        if (res.status === 401) break;
        continue;
      }
      record({ provider: "openai", model, outcome: "ok", ms: Date.now() - t0 });
      return { text: res.text, model, provider: "openai", attempts, elapsedMs: Date.now() - startedAt };
    }
  } else if (!openAIKey) {
    record({ provider: "openai", model: "-", outcome: "no_key", ms: 0 });
  }

  /* ── 5. xAI GROK — dicoba terakhir (key lama sering tidak valid) ─ */
  const xaiKey = (process.env.XAI_API_KEY || process.env.GROK_API_KEY || "").trim();
  if (xaiKey && remaining() > MIN_REMAINING_MS) {
    for (const model of modelList("GROK_MODEL", XAI_MODELS)) {
      if (remaining() < MIN_REMAINING_MS) break;
      const t0 = Date.now();
      const res = await callOpenAICompatible({
        baseUrl: "https://api.x.ai/v1",
        apiKey: xaiKey,
        model,
        systemPrompt: params.systemPrompt,
        userMessage: params.userMessage,
        timeoutMs: budget(7000),
      });
      if (QUOTA_STATUSES.has(res.status)) {
        record({ provider: "grok_ai", model, outcome: "quota", ms: Date.now() - t0, detail: res.error });
        break;
      }
      if (!res.text || !isUsable(res.text)) {
        record({
          provider: "grok_ai",
          model,
          outcome: !res.text ? (res.status ? "http_error" : "empty") : "invalid",
          ms: Date.now() - t0,
          detail: res.error,
        });
        if (res.status === 401) break; // key salah → percuma lanjut
        continue;
      }
      record({ provider: "grok_ai", model, outcome: "ok", ms: Date.now() - t0 });
      return { text: res.text, model, provider: "grok_ai", attempts, elapsedMs: Date.now() - startedAt };
    }
  } else if (!xaiKey) {
    record({ provider: "grok_ai", model: "-", outcome: "no_key", ms: 0 });
  }

  return null;
}

/** Ringkasan provider yang sudah dicoba, untuk dicetak ke log server */
export function describeAttempts(attempts: ChainAttempt[]): string {
  return attempts
    .map((a) => `${a.provider}:${a.model}=${a.outcome}(${a.ms}ms)`)
    .join(" → ");
}

/**
 * Deteksi apakah error adalah quota habis (429 / rate limit / gangguan sementara).
 */
export function isQuotaError(status: number): boolean {
  return QUOTA_STATUSES.has(status);
}

/**
 * Coba satu model OpenRouter saja (dipakai untuk health-check / testing).
 */
export async function runOpenRouterFallback(
  systemPrompt: string,
  userMessage: string
): Promise<AIResult | null> {
  const result = await runAiChain({ systemPrompt, userMessage, deadlineMs: 15000 });
  if (result && result.provider !== "gemini_ai") {
    const { text, model, provider } = result;
    return { text, model, provider };
  }
  return null;
}
