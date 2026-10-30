"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Loader2,
  ExternalLink,
  Search,
} from "lucide-react";
import type { BlogFeedback, BlogFeedbackStatus } from "@/lib/blogFeedback";
import { formatReviewDateTime } from "@/lib/reviews";

type Filter = "all" | BlogFeedbackStatus;

// Label status didefinisikan lokal agar supabase-js tidak ikut ke bundle klien
const STATUS_LABEL: Record<BlogFeedbackStatus, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: "pending", label: "Menunggu" },
  { key: "approved", label: "Tayang" },
  { key: "rejected", label: "Ditolak" },
  { key: "all", label: "Semua" },
];

const STATUS_BADGE: Record<BlogFeedbackStatus, string> = {
  pending: "bg-amber-500/10 text-amber-700 border-amber-500/25",
  approved: "bg-emerald-500/10 text-emerald-700 border-emerald-500/25",
  rejected: "bg-red-500/10 text-red-600 border-red-500/25",
};

export default function AdminBlogFeedbackManager({
  initialFeedback,
}: {
  initialFeedback: BlogFeedback[];
}) {
  const [items, setItems] = useState<BlogFeedback[]>(initialFeedback);
  const [filter, setFilter] = useState<Filter>("pending");
  const [keyword, setKeyword] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const counts = useMemo(
    () => ({
      all: items.length,
      pending: items.filter((i) => i.status === "pending").length,
      approved: items.filter((i) => i.status === "approved").length,
      rejected: items.filter((i) => i.status === "rejected").length,
    }),
    [items]
  );

  const visible = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "all" && item.status !== filter) return false;
      if (!kw) return true;
      return (
        item.note.toLowerCase().includes(kw) ||
        item.slug.toLowerCase().includes(kw) ||
        (item.display_name ?? "").toLowerCase().includes(kw)
      );
    });
  }, [items, filter, keyword]);

  async function reload() {
    const res = await fetch("/api/admin/blog-feedback", { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.success) setItems((data.feedback as BlogFeedback[]) ?? []);
  }

  async function setStatus(id: string, status: BlogFeedbackStatus) {
    setBusyId(id);
    setNotice("");
    try {
      const res = await fetch("/api/admin/blog-feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        setNotice(data?.message ?? "Gagal memperbarui status catatan.");
        return;
      }

      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
      setNotice(data?.message ?? "Status catatan diperbarui.");
    } catch {
      setNotice("Koneksi terputus. Perubahan belum tersimpan.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Hapus catatan ini secara permanen?")) return;
    setBusyId(id);
    setNotice("");
    try {
      const res = await fetch(`/api/admin/blog-feedback?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        setNotice(data?.message ?? "Catatan gagal dihapus.");
        return;
      }

      setItems((prev) => prev.filter((i) => i.id !== id));
      setNotice("Catatan berhasil dihapus.");
    } catch {
      setNotice("Koneksi terputus. Catatan belum terhapus.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-black transition-colors ${
                filter === f.key
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-white text-foreground/70 hover:border-primary hover:text-primary"
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`rounded-full px-1.5 text-[10px] ${
                  filter === f.key ? "bg-white/25" : "bg-secondary"
                }`}
              >
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Cari catatan atau artikel..."
            className="w-full rounded-full border border-border bg-white py-2 pl-9 pr-3 text-xs font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {notice && (
        <p className="rounded-2xl border border-border bg-secondary/40 px-4 py-2.5 text-xs font-bold text-foreground">
          {notice}
        </p>
      )}

      {/* Daftar catatan */}
      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-white/50 px-6 py-12 text-center">
          <p className="text-sm font-black text-foreground">Belum ada catatan di sini</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            Catatan pembaca akan muncul setelah mereka menekan like/dislike pada artikel.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => {
            const busy = busyId === item.id;
            return (
              <li
                key={item.id}
                className="rounded-3xl border border-border bg-white px-4 py-4 shadow-cartoon-sm sm:px-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black ${STATUS_BADGE[item.status]}`}
                  >
                    {STATUS_LABEL[item.status]}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black ${
                      item.vote === "like"
                        ? "border-primary/25 bg-primary/10 text-primary"
                        : "border-border bg-secondary text-foreground/70"
                    }`}
                  >
                    {item.vote === "like" ? (
                      <ThumbsUp className="h-2.5 w-2.5" />
                    ) : (
                      <ThumbsDown className="h-2.5 w-2.5" />
                    )}
                    {item.vote === "like" ? "Suka" : "Kurang suka"}
                  </span>

                  <span className="text-xs font-black text-foreground">
                    {item.display_name || "Pembaca"}
                  </span>
                  {item.user_id && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      Anggota
                    </span>
                  )}

                  <span className="ml-auto text-[10px] font-bold text-muted-foreground">
                    {formatReviewDateTime(item.created_at)}
                  </span>
                </div>

                <p className="mt-3 text-xs font-semibold leading-relaxed text-foreground/85">
                  {item.note}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/blog/${item.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-[11px] font-black text-foreground/70 transition-colors hover:border-primary hover:text-primary"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span className="max-w-[180px] truncate">{item.slug}</span>
                  </Link>

                  <div className="ml-auto flex items-center gap-1.5">
                    {item.status !== "approved" && (
                      <button
                        onClick={() => setStatus(item.id, "approved")}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-[11px] font-black text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        Setujui
                      </button>
                    )}

                    {item.status !== "rejected" && (
                      <button
                        onClick={() => setStatus(item.id, "rejected")}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-1.5 text-[11px] font-black text-foreground/70 transition-colors hover:border-red-500/40 hover:text-red-600 disabled:opacity-50"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Tolak
                      </button>
                    )}

                    {item.status !== "pending" && (
                      <button
                        onClick={() => setStatus(item.id, "pending")}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-[11px] font-black text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                      >
                        Tinjau ulang
                      </button>
                    )}

                    <button
                      onClick={() => remove(item.id)}
                      disabled={busy}
                      aria-label="Hapus catatan"
                      className="inline-flex items-center justify-center rounded-full border border-border bg-white p-1.5 text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {item.reviewed_by && (
                  <p className="mt-2 text-[10px] font-bold text-muted-foreground">
                    Ditinjau oleh {item.reviewed_by}
                    {item.reviewed_at ? ` — ${formatReviewDateTime(item.reviewed_at)}` : ""}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <button
        onClick={reload}
        className="text-[11px] font-black text-primary hover:underline"
      >
        Muat ulang daftar
      </button>
    </div>
  );
}
