"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, ThumbsUp, ThumbsDown, Check, AlertCircle, MessageSquarePlus } from "lucide-react";
import BlogFeedbackDialog from "@/components/BlogFeedbackDialog";
import type { FeedbackVote } from "@/lib/blogFeedback";

interface Props {
  slug: string;
  initialViews?: number;
  /** true bila pengunjung belum login — dialog catatan minta nama + verifikasi */
  isGuest?: boolean;
  displayName?: string;
}

interface Stats {
  views: number;
  likes: number;
  dislikes: number;
}

type StatsResponse = Partial<Stats> & { success?: boolean; error?: string };

/**
 * Gabungkan stats dari server tanpa pernah menurunkan angka view.
 * View sudah di-increment server-side saat artikel dibuka, jadi
 * klik like/dislike tidak boleh membuatnya kembali jadi 0.
 */
function mergeStats(prev: Stats, incoming: StatsResponse): Stats {
  return {
    views: Math.max(prev.views, incoming.views ?? 0),
    likes: incoming.likes ?? prev.likes,
    dislikes: incoming.dislikes ?? prev.dislikes,
  };
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

type ToastKind = "like" | "dislike" | "undo" | "error";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const TOAST_STYLE: Record<ToastKind, { box: string; icon: string }> = {
  like: {
    box: "border-primary/25 bg-primary/5 text-foreground",
    icon: "bg-primary text-white",
  },
  dislike: {
    box: "border-border bg-secondary/60 text-foreground",
    icon: "bg-foreground/80 text-white",
  },
  undo: {
    box: "border-border bg-white text-foreground",
    icon: "bg-muted text-foreground/70",
  },
  error: {
    box: "border-red-500/25 bg-red-500/5 text-foreground",
    icon: "bg-red-500 text-white",
  },
};

export default function BlogEngagement({
  slug,
  initialViews = 0,
  isGuest = true,
  displayName = "",
}: Props) {
  const [stats, setStats] = useState<Stats>({ views: initialViews, likes: 0, dislikes: 0 });
  const [userVote, setUserVote] = useState<FeedbackVote | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dialog "catatan": dibuka otomatis 1x per sesi setelah vote, atau lewat tombol
  const [dialogVote, setDialogVote] = useState<FeedbackVote | null>(null);
  const notePromptKey = `blog_note_prompted_${slug}`;

  // Tampilkan pop-up singkat di atas tombol (auto-hide)
  const showToast = (kind: ToastKind, message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), kind, message });
    toastTimer.current = setTimeout(() => setToast(null), kind === "error" ? 4000 : 2600);
  };

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  // Key untuk localStorage agar vote tersimpan per artikel per browser
  const storageKey = `blog_vote_${slug}`;

  useEffect(() => {
    // Baca vote sebelumnya dari localStorage
    try {
      const saved = localStorage.getItem(storageKey) as FeedbackVote | null;
      setUserVote(saved);
    } catch {}

    // Ambil stats awal (views sudah di-track server-side saat artikel dibuka)
    fetch(`/api/blog/${slug}/engage`)
      .then((r) => r.json())
      .then((data: StatsResponse) => setStats((prev) => mergeStats(prev, data)))
      .catch(() => {});
  }, [slug, storageKey]);

  // Sinkronkan bila prop views diperbarui server (mis. navigasi ulang)
  useEffect(() => {
    setStats((prev) => (initialViews > prev.views ? { ...prev, views: initialViews } : prev));
  }, [initialViews]);

  const handleVote = async (vote: FeedbackVote) => {
    if (loading) return;
    setLoading(true);

    try {
      let action: string;
      let newVote: FeedbackVote | null;

      if (userVote === vote) {
        // Toggle off — undo vote
        action = vote === "like" ? "unlike" : "undislike";
        newVote = null;
      } else {
        // Undo vote sebelumnya dulu jika ada
        if (userVote) {
          await fetch(`/api/blog/${slug}/engage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: userVote === "like" ? "unlike" : "undislike" }),
          });
        }
        action = vote;
        newVote = vote;
      }

      const res = await fetch(`/api/blog/${slug}/engage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data: StatsResponse = await res.json();

      // Hanya terapkan bila server benar-benar menyimpan (jangan timpa dgn 0 saat error)
      if (res.ok && data.success !== false) {
        setStats((prev) => mergeStats(prev, data));
        setUserVote(newVote);

        try {
          if (newVote) localStorage.setItem(storageKey, newVote);
          else localStorage.removeItem(storageKey);
        } catch {}

        if (newVote === "like") showToast("like", "Terima kasih! Kamu menyukai artikel ini.");
        else if (newVote === "dislike") showToast("dislike", "Masukanmu tercatat. Terima kasih!");
        else showToast("undo", "Vote dibatalkan.");

        // Tawarkan menulis catatan — otomatis dibuka 1x per sesi per artikel
        if (newVote) {
          let prompted = false;
          try {
            prompted = sessionStorage.getItem(notePromptKey) === "1";
            if (!prompted) sessionStorage.setItem(notePromptKey, "1");
          } catch {}

          if (!prompted) {
            // beri jeda agar pop-up ucapan sempat terbaca
            window.setTimeout(() => setDialogVote(newVote), 900);
          }
        }
      } else {
        showToast("error", data.error || "Maaf, votemu belum tersimpan. Coba lagi ya.");
      }
    } catch {
      showToast("error", "Koneksi terputus. Vote belum tersimpan.");
    }

    setLoading(false);
  };

  return (
    <div className="relative flex flex-col gap-4">
      {/* Views counter */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Eye className="h-3.5 w-3.5" />
        <span>{formatCount(stats.views)} kali dilihat</span>
      </div>

      {/* Like / Dislike */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleVote("like")}
          disabled={loading}
          aria-label="Suka artikel ini"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black border transition-all active:scale-95 disabled:opacity-60 ${
            userVote === "like"
              ? "bg-primary text-white border-primary shadow-sm"
              : "bg-white border-border text-foreground/70 hover:border-primary hover:text-primary"
          }`}
        >
          <ThumbsUp className={`h-3.5 w-3.5 ${userVote === "like" ? "fill-white" : ""}`} />
          <span>{formatCount(stats.likes)}</span>
        </button>

        <button
          onClick={() => handleVote("dislike")}
          disabled={loading}
          aria-label="Tidak suka artikel ini"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black border transition-all active:scale-95 disabled:opacity-60 ${
            userVote === "dislike"
              ? "bg-foreground/80 text-white border-foreground/80 shadow-sm"
              : "bg-white border-border text-foreground/70 hover:border-foreground/40 hover:text-foreground"
          }`}
        >
          <ThumbsDown className={`h-3.5 w-3.5 ${userVote === "dislike" ? "fill-white" : ""}`} />
          <span>{formatCount(stats.dislikes)}</span>
        </button>

        {/* Pembuka manual dialog catatan */}
        <button
          onClick={() => setDialogVote(userVote ?? "dislike")}
          disabled={loading}
          aria-label="Tulis catatan untuk artikel ini"
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border bg-transparent px-3 py-2 text-[11px] font-black text-muted-foreground transition-colors hover:border-primary hover:text-primary active:scale-95 disabled:opacity-60"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Tulis catatan</span>
        </button>
      </div>

      {/* Pop-up konfirmasi like / dislike */}
      {toast && (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute bottom-full left-0 z-50 mb-3 w-full max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div
            className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 shadow-lg backdrop-blur-sm ${TOAST_STYLE[toast.kind].box}`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${TOAST_STYLE[toast.kind].icon}`}
            >
              {toast.kind === "error" ? (
                <AlertCircle className="h-3.5 w-3.5" />
              ) : toast.kind === "dislike" ? (
                <ThumbsDown className="h-3.5 w-3.5 fill-white" />
              ) : toast.kind === "like" ? (
                <ThumbsUp className="h-3.5 w-3.5 fill-white" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </span>
            <p className="text-[11px] font-black leading-snug">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Dialog catatan pembaca */}
      <BlogFeedbackDialog
        slug={slug}
        vote={dialogVote ?? "dislike"}
        open={dialogVote !== null}
        onClose={() => setDialogVote(null)}
        isGuest={isGuest}
        defaultName={displayName}
      />
    </div>
  );
}
