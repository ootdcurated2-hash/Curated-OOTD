"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, ThumbsUp, ThumbsDown, Loader2, Check } from "lucide-react";
import CloudflareTurnstile from "@/components/CloudflareTurnstile";
import type { FeedbackVote } from "@/lib/blogFeedback";

// Didefinisikan ulang di sisi klien agar tidak ikut menarik supabase-js
// ke bundle browser (lib/blogFeedback.ts bersifat server-only).
const MAX_NOTE_LENGTH = 500;
const MAX_NAME_LENGTH = 60;

interface Props {
  slug: string;
  vote: FeedbackVote;
  open: boolean;
  onClose: () => void;
  /** true bila pengunjung belum login — wajib verifikasi Turnstile + isi nama */
  isGuest: boolean;
  defaultName?: string;
  onSubmitted?: () => void;
}

export default function BlogFeedbackDialog({
  slug,
  vote,
  open,
  onClose,
  isGuest,
  defaultName = "",
  onSubmitted,
}: Props) {
  const [note, setNote] = useState("");
  const [name, setName] = useState(defaultName);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDone = status === "done";

  // Reset tiap kali dialog dibuka kembali
  useEffect(() => {
    if (!open) return;
    setStatus("idle");
    setMessage("");
    setToken("");
    const id = window.setTimeout(() => textareaRef.current?.focus(), 120);
    return () => window.clearTimeout(id);
  }, [open]);

  // Tutup dengan tombol Esc + kunci scroll halaman di belakang dialog
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const canSubmit =
    status !== "sending" &&
    note.trim().length >= 3 &&
    (!isGuest || token.length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setStatus("sending");
    setMessage("");

    try {
      const res = await fetch(`/api/blog/${slug}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vote,
          note: note.trim(),
          name: name.trim(),
          turnstileToken: token,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setStatus("done");
        setMessage(data.message ?? "Catatan terkirim!");
        onSubmitted?.();
        window.setTimeout(() => onClose(), 2200);
      } else {
        setStatus("error");
        setMessage(data.message ?? "Catatan gagal dikirim. Coba lagi ya.");
      }
    } catch {
      setStatus("error");
      setMessage("Koneksi terputus. Catatan belum terkirim.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="blog-feedback-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Tutup dialog catatan"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200"
      />

      <div className="relative w-full max-w-md rounded-3xl border border-border bg-white p-5 sm:p-6 shadow-cartoon animate-in fade-in slide-in-from-bottom-4 duration-200 dark:bg-card">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {isDone ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/25">
              <Check className="h-6 w-6 text-primary" />
            </span>
            <h2 id="blog-feedback-title" className="text-base font-black font-nunito text-foreground">
              Terima kasih atas catatannya!
            </h2>
            <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
              {message} Catatan akan tampil di artikel setelah disetujui admin.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 pr-8">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  vote === "like" ? "bg-primary text-white" : "bg-foreground/80 text-white"
                }`}
              >
                {vote === "like" ? (
                  <ThumbsUp className="h-4 w-4 fill-white" />
                ) : (
                  <ThumbsDown className="h-4 w-4 fill-white" />
                )}
              </span>
              <div>
                <h2
                  id="blog-feedback-title"
                  className="text-base sm:text-lg font-black font-nunito tracking-tighter text-foreground leading-tight"
                >
                  {vote === "like" ? "Apa yang kamu suka?" : "Bagian mana yang kurang pas?"}
                </h2>
                <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">
                  Opsional — tulis catatan singkat biar artikelnya makin bagus.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <textarea
                  ref={textareaRef}
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE_LENGTH))}
                  rows={4}
                  maxLength={MAX_NOTE_LENGTH}
                  placeholder={
                    vote === "like"
                      ? "Contoh: bagian tips padu padannya gampang dipraktikkan..."
                      : "Contoh: rekomendasinya kurang cocok untuk kulit gelap..."
                  }
                  className="w-full resize-none rounded-2xl border border-border bg-secondary/30 px-3.5 py-3 text-xs font-semibold text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="mt-1 text-right text-[10px] font-bold text-muted-foreground">
                  {note.length}/{MAX_NOTE_LENGTH}
                </p>
              </div>

              {isGuest && (
                <div>
                  <label
                    htmlFor="blog-feedback-name"
                    className="mb-1 block text-[11px] font-black text-foreground"
                  >
                    Nama panggilan <span className="font-bold text-muted-foreground">(opsional)</span>
                  </label>
                  <input
                    id="blog-feedback-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, MAX_NAME_LENGTH))}
                    placeholder="Pembaca"
                    maxLength={MAX_NAME_LENGTH}
                    className="w-full rounded-2xl border border-border bg-white px-3.5 py-2.5 text-xs font-semibold text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              {isGuest && (
                <div className="flex justify-center rounded-2xl border border-border bg-secondary/20 py-2">
                  <CloudflareTurnstile
                    onVerify={(t) => setToken(t)}
                    onExpire={() => setToken("")}
                    onError={() => {
                      setToken("");
                      setStatus("error");
                      setMessage("Verifikasi keamanan gagal. Muat ulang halaman lalu coba lagi.");
                    }}
                  />
                </div>
              )}

              {status === "error" && message && (
                <p className="rounded-xl border border-red-500/25 bg-red-500/5 px-3 py-2 text-[11px] font-bold text-red-600">
                  {message}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-full border border-border bg-white px-4 py-2.5 text-xs font-black text-foreground/70 transition-colors hover:bg-secondary"
                >
                  Nanti saja
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="flex flex-[1.4] items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-black text-white shadow-cartoon-sm transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  {status === "sending" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>{status === "sending" ? "Mengirim..." : "Kirim catatan"}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
