"use client";

import { useEffect, useState } from "react";
import { RecommendationResponse, SKIN_TONE_DATA, getConsultationResponse } from "@/lib/skinToneAdvisor";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  BookOpen,
  AlertCircle,
  Loader2,
  Clock,
  ShieldCheck,
  Zap,
  X,
  Info,
} from "lucide-react";
import {
  AIQuotaStatus,
  DAILY_LIMIT,
  getClientQuotaStatus,
  recordLocalUsage,
  getTodayDateString,
} from "@/lib/aiQuota";
import { createClient } from "@/lib/supabase/client";
import { isUserAdmin } from "@/lib/admin";

interface SkinToneAdvisorProps {
  onApplyPalette?: (paletteColors: string[]) => void;
}

type SourceType =
  | "grok_ai"
  | "gemini_ai"
  | "nvidia_ai"
  | "recursive_ai"
  | "dots_ai"
  | "preset"
  | "fallback"
  | "fallback_api_error"
  | "fallback_empty_response"
  | "fallback_no_api_response"
  | "local_curator"
  | (string & {})
  | null;

export default function SkinToneAdvisor({ onApplyPalette }: SkinToneAdvisorProps) {
  const [query, setQuery] = useState("");
  const [activeSkinKey, setActiveSkinKey] = useState<string>("cokelat");
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [source, setSource] = useState<SourceType>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiNote, setApiNote] = useState<string | null>(null);

  // Status Kuota Harian (10 pertanyaan / hari untuk role user)
  const [quota, setQuota] = useState<AIQuotaStatus>({
    limit: DAILY_LIMIT,
    used: 0,
    remaining: DAILY_LIMIT,
    isAdmin: false,
    canAsk: true,
    resetsAt: "",
    resetDateStr: getTodayDateString(),
  });
  const [showQuotaModal, setShowQuotaModal] = useState<boolean>(false);
  const [quotaNotification, setQuotaNotification] = useState<string | null>(null);

  // Inisialisasi kuota dan verifikasi admin di sisi klien
  useEffect(() => {
    async function initQuota() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        const adminCheck = isUserAdmin(user);
        const currentQuota = getClientQuotaStatus(adminCheck);
        setQuota(currentQuota);
      } catch {
        setQuota(getClientQuotaStatus(false));
      }
    }
    initQuota();
  }, []);

  const handleAsk = async (customText?: string) => {
    const textToQuery = customText !== undefined ? customText : query;
    if (!textToQuery.trim()) return;

    // Cek kuota sebelum mengirim ke backend
    if (!quota.isAdmin && quota.remaining <= 0) {
      setShowQuotaModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setApiNote(null);
    setQuotaNotification(null);

    try {
      const res = await fetch("/api/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: textToQuery,
          clientUsedCount: quota.used,
        }),
      });

      const json = await res.json();

      // Jika kuota habis dari sisi backend (HTTP 429)
      if (res.status === 429 || json.quotaExceeded) {
        if (json.quota) {
          setQuota(json.quota);
        } else {
          setQuota((prev) => ({
            ...prev,
            used: DAILY_LIMIT,
            remaining: 0,
            canAsk: false,
          }));
        }
        setShowQuotaModal(true);
        setError(json.message || "Batas bertanya AI harian kamu sudah habis.");
        return;
      }

      if (json.success && json.data) {
        setResult(json.data);
        setSource(json.source || "fallback");
        setApiNote(json.note || null);
        if (json.data.skinToneKey && json.data.skinToneKey !== "custom") {
          setActiveSkinKey(json.data.skinToneKey);
        }
        setError(null);

        // Update kuota harian setelah berhasil bertanya
        if (!quota.isAdmin) {
          const updatedUsage = recordLocalUsage(1);
          const newUsed = updatedUsage.count;
          const newRemaining = Math.max(0, DAILY_LIMIT - newUsed);
          const updatedQuota: AIQuotaStatus = {
            ...quota,
            used: newUsed,
            remaining: newRemaining,
            canAsk: newRemaining > 0,
          };
          setQuota(updatedQuota);

          // Tampilkan notifikasi sisa pertanyaan
          if (newRemaining === 0) {
            setShowQuotaModal(true);
            setQuotaNotification(
              `Ini pertanyaan terakhir kamu untuk hari ini (0/${DAILY_LIMIT} tersisa). Kuota akan di-reset besok pukul 00.00 WIB.`
            );
          } else if (newRemaining <= 3) {
            setQuotaNotification(
              `Perhatian: Sisa kesempatan bertanya kamu hari ini tersisa ${newRemaining} kali.`
            );
          } else {
            setQuotaNotification(
              `Pertanyaan berhasil! Sisa kuota bertanya kamu hari ini: ${newRemaining} dari ${DAILY_LIMIT} kali.`
            );
          }
        }
      } else {
        const fallback = getConsultationResponse(textToQuery);
        setResult(fallback);
        setSource("fallback");
        setActiveSkinKey(fallback.skinToneKey);
      }
    } catch (err) {
      console.error("Consultation fetch error:", err);
      const fallback = getConsultationResponse(textToQuery);
      setResult(fallback);
      setSource("fallback");
      setActiveSkinKey(fallback.skinToneKey);
      setError("Gagal menghubungi AI. Menampilkan rekomendasi dari basis data lokal.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (key: string) => {
    setActiveSkinKey(key);
    const data = SKIN_TONE_DATA[key];
    if (data) {
      setResult(data);
      setSource("preset");
      setQuery(""); // Clear query when selecting preset
    }
  };

  const isFromAI = Boolean(
    source &&
      (source === "grok_ai" ||
        source === "gemini_ai" ||
        source === "nvidia_ai" ||
        source === "recursive_ai" ||
        source === "dots_ai" ||
        source.includes("ai"))
  );
  const aiBadgeLabel =
    source === "gemini_ai"
      ? "Analisis Gemini AI"
      : source === "grok_ai"
        ? "Analisis Grok AI"
        : source === "nvidia_ai"
          ? "Analisis NVIDIA Nemotron AI"
          : isFromAI
            ? "Analisis Cloud AI"
            : source === "local_curator" || source === "fallback"
              ? "Penasihat Gaya Fashion"
              : "Preset Warna Kulit";

  return (
    <div id="advisor" className="cartoon-card bg-white/40 p-6 sm:p-10 space-y-8 backdrop-blur-2xl border-white/40 relative">
      {/* ── Pop-up Modal Saat Batas Kuota Habis ── */}
      {showQuotaModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-rose-100 text-center space-y-5">
            <button
              onClick={() => setShowQuotaModal(false)}
              className="absolute top-4 right-4 p-2 text-foreground/40 hover:text-foreground rounded-full hover:bg-muted transition-colors"
              aria-label="Tutup popup"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-primary">
              <Clock className="h-8 w-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-100 text-primary">
                Batas Harian Tercapai (10/10)
              </span>
              <h3 className="text-xl sm:text-2xl font-black font-nunito text-foreground">
                Batas Tanya AI Hari Ini Habis
              </h3>
              <p className="text-xs sm:text-sm text-foreground/70 font-semibold leading-relaxed">
                Kamu telah mencapai kuota maksimal <strong>10 pertanyaan</strong> untuk hari ini.
                Untuk menjaga kenyamanan dan mencegah spam, kuota kamu akan otomatis di-reset besok pukul <strong>00.00 WIB</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border text-left space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-black text-foreground">
                <Info className="h-4 w-4 text-primary shrink-0" />
                <span>Tips Selama Menunggu Reset:</span>
              </div>
              <ul className="list-disc list-inside text-foreground/70 font-medium space-y-1 pl-1 text-[11px]">
                <li>Gunakan preset panduan warna kulit di bawah (tidak dibatasi kuota).</li>
                <li>Simpan inspirasi OOTD dari galeri utama ke favorit.</li>
                <li>Buat padu padan busana di studio Creator OOTD.</li>
              </ul>
            </div>

            <button
              onClick={() => setShowQuotaModal(false)}
              className="cartoon-btn w-full bg-primary text-white py-3.5 text-sm font-black shadow-cartoon-sm"
            >
              Mengerti, Terima Kasih!
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-border pb-8">
        <div className="space-y-2 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-accent/10 text-accent px-4 py-1 rounded-full border border-accent/20 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> Penasihat Fashion AI
            </span>

            {/* Badge Indikator Sisa Kuota */}
            {quota.isAdmin ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full shadow-xs">
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin: Akses Kuota Unlimited
              </span>
            ) : (
              <button
                onClick={() => {
                  if (quota.remaining <= 0) setShowQuotaModal(true);
                }}
                className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-xs transition-transform active:scale-95 ${
                  quota.remaining <= 2
                    ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                    : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                }`}
                title="Batas bertanya: 10 kali/hari. Reset setiap hari pukul 00.00 WIB."
              >
                <Zap className="h-3 w-3 fill-current" />
                Sisa Kuota Hari Ini: {quota.remaining}/{DAILY_LIMIT}
              </button>
            )}
          </div>

          <h2 className="text-2xl sm:text-4xl font-black font-nunito tracking-tighter text-foreground">
            {result && source !== "preset" ? "Laporan Gaya AI" : "Panduan Warna Kulit & Gaya"}
          </h2>
          <p className="text-sm sm:text-base font-bold text-foreground/60 leading-relaxed">
            Dapatkan rekomendasi outfit dipersonalisasi dengan Gemini AI (gratis) atau Grok sebagai cadangan.
          </p>
        </div>

        {/* Quick Tone Selectors */}
        <div className="flex flex-wrap items-center gap-2 p-2 bg-white/60 rounded-[1.5rem] border border-border shadow-cartoon-sm text-xs font-black backdrop-blur-md">
          {[
            { key: "cokelat", label: "Sawo Matang", active: "bg-primary text-white" },
            { key: "kuning_langsat", label: "Ivory Hangat", active: "bg-accent text-white" },
            { key: "gelap", label: "Gelap", active: "bg-cartoon-purple text-white" },
            { key: "terang", label: "Terang", active: "bg-cartoon-mint text-foreground" },
          ].map(({ key, label, active }) => (
            <button
              key={key}
              onClick={() => handleQuickSelect(key)}
              className={`px-4 py-2 rounded-2xl transition-all duration-300 ${
                activeSkinKey === key
                  ? `${active} shadow-cartoon-sm scale-105`
                  : "text-foreground/60 hover:text-foreground hover:bg-white/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Banner Notifikasi Sisa Kuota ── */}
      {quotaNotification && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-primary/20 bg-primary/5 text-foreground text-xs font-bold animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2.5">
            <Zap className="h-4 w-4 text-primary shrink-0" />
            <span>{quotaNotification}</span>
          </div>
          <button
            onClick={() => setQuotaNotification(null)}
            className="p-1 text-foreground/40 hover:text-foreground rounded-lg"
            aria-label="Tutup notifikasi"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleAsk()}
            placeholder={
              !quota.isAdmin && quota.remaining <= 0
                ? "Batas harian habis (10/10). Reset besok pukul 00.00 WIB."
                : `Tanya apa saja... (Sisa kuota: ${quota.isAdmin ? 'Unlimited' : `${quota.remaining}/${DAILY_LIMIT}`})`
            }
            disabled={!quota.isAdmin && quota.remaining <= 0}
            className="w-full sm:flex-1 rounded-[1.5rem] border border-border bg-white/60 px-6 py-4 text-sm font-bold text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-cartoon-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading || (!quota.isAdmin && quota.remaining <= 0)}
            className="cartoon-btn w-full sm:w-auto shrink-0 bg-primary text-white px-8 py-4 text-sm font-black disabled:opacity-50 flex items-center gap-2 sm:min-w-[160px] justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menganalisis...
              </>
            ) : !quota.isAdmin && quota.remaining <= 0 ? (
              <>
                <Clock className="h-4 w-4" />
                Batas Habis (10/10)
              </>
            ) : (
              <>
                <Bot className="h-4 w-4" />
                Tanya AI
              </>
            )}
          </button>
        </div>

        {/* Quick Prompts */}
        {result && (
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="text-foreground/60 font-black uppercase tracking-widest text-[10px]">Topik Populer:</span>
            {result.quickPrompts.slice(0, 3).map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => { setQuery(prompt); handleAsk(prompt); }}
                className="rounded-full border border-border bg-white/80 px-4 py-1.5 text-[11px] font-black text-foreground shadow-cartoon-sm hover:bg-secondary hover:scale-105 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="rounded-[2rem] border border-border bg-white/40 p-8 space-y-6 shadow-cartoon animate-pulse backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/20 border border-primary/20 flex items-center justify-center">
              <Bot className="h-7 w-7 text-primary animate-bounce" />
            </div>
            <div className="space-y-2">
              <div className="h-5 w-64 bg-foreground/10 rounded-full" />
              <div className="h-3 w-80 bg-foreground/10 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-foreground/5 h-20" />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-3 w-full bg-foreground/10 rounded-full" />
            <div className="h-3 w-4/5 bg-foreground/10 rounded-full" />
            <div className="h-3 w-3/5 bg-foreground/10 rounded-full" />
          </div>
        </div>
      )}

      {/* Error banner hanya jika request gagal total tanpa ada hasil */}
      {error && !result && !loading && (
        <div className="flex items-center gap-3 rounded-[1.5rem] border-2 border-primary/20 bg-primary/5 px-6 py-4 text-sm font-black text-primary">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Card */}
      {result && !loading && (
        <div className="space-y-8 rounded-[2.5rem] border border-white/40 bg-white/60 p-6 sm:p-10 shadow-cartoon backdrop-blur-2xl">

          {/* Source badge */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <h3 className="text-3xl sm:text-4xl font-black font-nunito tracking-tighter text-foreground">
                {result.skinToneTitle}
              </h3>
              <p className="text-sm sm:text-base font-bold leading-relaxed text-foreground/60 max-w-2xl">
                {result.summary}
              </p>
            </div>
            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border text-[10px] font-black tracking-widest uppercase shadow-cartoon-sm shrink-0 ${
              isFromAI ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
            }`}>
              {isFromAI ? (
                <><Bot className="h-3.5 w-3.5" /> {aiBadgeLabel}</>
              ) : (
                <><BookOpen className="h-3.5 w-3.5" /> {aiBadgeLabel}</>
              )}
            </span>
          </div>

          {/* Undertone */}
          {result.undertoneAnalysis && (
            <div className="rounded-[1.5rem] border border-border bg-white/80 px-6 py-4 shadow-cartoon-sm backdrop-blur-md">
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Analisis Warna Dasar Kulit</span>
              <p className="text-sm sm:text-base font-bold text-foreground mt-1 leading-relaxed">{result.undertoneAnalysis}</p>
            </div>
          )}

          {/* Color Palette */}
          <div className="space-y-4 rounded-[2rem] border border-border bg-white/80 p-6 shadow-cartoon-sm backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-foreground">
                Palet Rekomendasi
              </span>
              {onApplyPalette && (
                <button
                  onClick={() => onApplyPalette(result.tips.colorPalette.map(c => c.hex))}
                  className="text-[11px] font-black text-primary hover:underline underline-offset-4"
                >
                  Terapkan ke Studio &rarr;
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 pt-2">
              {result.tips.colorPalette.map((color, idx) => (
                <div key={idx} className="flex flex-col items-center p-3 rounded-2xl border border-border bg-white text-center shadow-cartoon-sm hover:scale-105 transition-all">
                  <div className="h-12 w-full rounded-xl border border-border/50 shadow-inner" style={{ backgroundColor: color.hex }} />
                  <span className="mt-2 text-[10px] font-black line-clamp-1 text-foreground leading-tight">{color.name}</span>
                  <span className="text-[9px] font-mono font-bold text-foreground/30 uppercase">{color.hex}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Advice + Avoid grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-[2rem] border border-border bg-white/80 p-6 space-y-4 shadow-cartoon-sm">
              <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Panduan Gaya</h4>
              <p className="text-sm font-bold text-foreground/70 leading-relaxed">{result.tips.advice}</p>
              <div className="pt-2 flex flex-wrap gap-2">
                {result.tips.recommendedStyles.map((style, i) => (
                  <span key={i} className="rounded-full border border-border bg-accent/10 px-4 py-1 text-[11px] font-black text-accent shadow-cartoon-sm">
                    #{style}
                  </span>
                ))}
              </div>
            </div>

            {result.tips.avoidColors && result.tips.avoidColors.length > 0 && (
              <div className="rounded-[2rem] border border-border bg-white/80 p-6 space-y-4 shadow-cartoon-sm">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary">Yang Dihindari</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.tips.avoidColors.map((avoid, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-foreground/70 bg-primary/5 p-2 rounded-xl border border-primary/10">
                      <span className="text-primary font-black">✕</span>
                      <span>{avoid}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Example Pieces — only if AI returned them */}
          {result.tips.examplePieces && result.tips.examplePieces.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-foreground">
                  Pilihan Kurasi AI
                </span>
                <Link href="/creator" className="text-xs text-primary font-black hover:underline underline-offset-4">
                  Ke Studio &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {result.tips.examplePieces.map((piece, idx) => (
                  <div key={idx} className="cartoon-card bg-white p-6 flex flex-col justify-between space-y-4 shadow-cartoon-sm border-border hover:shadow-cartoon transition-all">
                    <div className="space-y-2">
                      <span className="inline-block px-3 py-1 rounded-full text-[9px] font-black bg-secondary border border-border text-primary uppercase tracking-widest">
                        {piece.category}
                      </span>
                      <h5 className="text-sm font-black text-foreground line-clamp-2 leading-tight">{piece.name}</h5>
                      <p className="text-[11px] font-bold text-foreground/50 leading-relaxed">{piece.reason}</p>
                    </div>
                    <a
                      href={`https://shopee.co.id/search?keyword=${encodeURIComponent(piece.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cartoon-btn text-center bg-primary text-white py-3 text-xs font-black w-full shadow-cartoon-sm"
                    >
                      Belanja Sekarang &rarr;
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI disclaimer */}
          {isFromAI && (
            <p className="text-[10px] font-black text-foreground/30 text-center pt-4 uppercase tracking-widest">
              Konten dibuat AI · Dapat berbeda tiap konsultasi
            </p>
          )}
        </div>
      )}

      {/* Empty state — belum ada hasil */}
      {!result && !loading && (
        <div className="rounded-[2.5rem] border-2 border-dashed border-border bg-white/20 p-16 text-center space-y-4 backdrop-blur-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-border bg-white shadow-cartoon-sm">
            <Bot className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <div className="space-y-1">
            <p className="text-xl font-black text-foreground font-nunito tracking-tight">Stylist AI Anda Siap</p>
            <p className="text-sm font-bold text-foreground/50">
              Tulis pertanyaan fashion di atas atau pilih warna kulit untuk memulai.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
