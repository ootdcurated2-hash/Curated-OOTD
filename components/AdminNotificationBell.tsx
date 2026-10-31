"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Clock, Inbox, Loader2, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AdminNotification, formatReviewDateTime } from "@/lib/reviews";

// Interval cadangan bila koneksi Realtime tidak tersedia
const POLL_INTERVAL_MS = 60000;
const REALTIME_TOPIC = "admin-notifications";
const HIGHLIGHT_EVENT = "admin:highlight-review";
// ID notifikasi yang sudah pernah ditampilkan sebagai pop-up tengah
const SEEN_POPUP_KEY = "admin_notif_seen_popup_ids";

function loadSeenPopupIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_POPUP_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(arr) ? arr.filter((v): v is string => typeof v === "string") : []);
  } catch {
    return new Set();
  }
}

function saveSeenPopupIds(ids: Set<string>) {
  try {
    localStorage.setItem(SEEN_POPUP_KEY, JSON.stringify(Array.from(ids).slice(-300)));
  } catch {
    // abaikan
  }
}

export default function AdminNotificationBell() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarking, setIsMarking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Pop-up notifikasi baru di tengah layar (mobile & desktop)
  const [popupItems, setPopupItems] = useState<AdminNotification[]>([]);
  const [showPopup, setShowPopup] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memuat notifikasi.");
      }
      const list = (json.notifications as AdminNotification[]) ?? [];
      setNotifications(list);
      setUnreadCount(Number(json.unreadCount) || 0);
      setError(null);

      // Notifikasi belum dibaca yang belum pernah dipop-up → tampilkan di tengah layar
      const seen = loadSeenPopupIds();
      const fresh = list.filter((n) => !n.is_read && !seen.has(n.id));
      if (fresh.length > 0) {
        setPopupItems(fresh.slice(0, 5));
        setShowPopup(true);
        fresh.forEach((n) => seen.add(n.id));
        saveSeenPopupIds(seen);
      }
    } catch (err: any) {
      setError(err?.message || "Gagal memuat notifikasi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Muat pertama kali + polling + refresh saat tab kembali aktif
  useEffect(() => {
    void loadNotifications();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void loadNotifications();
    }, POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void loadNotifications();
    };
    const handleFocus = () => void loadNotifications();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadNotifications]);

  // Supabase Realtime: trigger database menyiarkan sinyal ke channel publik ini
  // setiap ada notifikasi baru, lalu daftar diambil ulang lewat API admin.
  useEffect(() => {
    let channel: any = null;
    try {
      const supabase: any = createClient();
      if (typeof supabase?.channel !== "function") return;

      channel = supabase
        .channel(REALTIME_TOPIC, { config: { private: false } })
        .on("broadcast", { event: "notification" }, () => {
          void loadNotifications();
        })
        .subscribe();
    } catch {
      // Realtime tidak tersedia — polling di atas tetap menjadi jalur cadangan
    }

    return () => {
      try {
        const supabase: any = createClient();
        if (channel && typeof supabase?.removeChannel === "function") {
          void supabase.removeChannel(channel);
        }
      } catch {
        // abaikan
      }
    };
  }, [loadNotifications]);

  // Tutup panel saat klik di luar
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const markAsRead = async (payload: { ids: string[] } | { all: true }) => {
    setIsMarking(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal memperbarui notifikasi.");
      await loadNotifications();
    } catch (err: any) {
      setError(err?.message || "Gagal memperbarui notifikasi.");
    } finally {
      setIsMarking(false);
    }
  };

  const deleteNotifications = async (payload: { ids: string[] } | { all: true }) => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal menghapus notifikasi.");
      await loadNotifications();
    } catch (err: any) {
      setError(err?.message || "Gagal menghapus notifikasi.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelect = async (notification: AdminNotification) => {
    setIsOpen(false);
    if (!notification.is_read) {
      await markAsRead({ ids: [notification.id] });
    }

    // Notifikasi catatan blog diarahkan ke fitur Catatan, bukan ke Ulasan/Testimoni
    if (notification.type === "blog_feedback_pending") {
      router.push("/admin/catatan?highlight=pending");
      return;
    }

    if (notification.review_id) {
      window.dispatchEvent(
        new CustomEvent(HIGHLIGHT_EVENT, { detail: notification.review_id })
      );
      router.push(`/admin/reviews?highlight=${notification.review_id}`);
    } else {
      router.push("/admin/reviews");
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={`Notifikasi${unreadCount > 0 ? `, ${unreadCount} belum dibaca` : ""}`}
        aria-expanded={isOpen}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white/60 text-foreground shadow-cartoon-sm backdrop-blur-md transition-all hover:bg-secondary hover:shadow-cartoon active:scale-95"
      >
        <Bell className="h-3.5 w-3.5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full border border-white/40 bg-primary px-1 text-[9px] font-black leading-[14px] text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-[19rem] max-w-[calc(100vw-1.5rem)] rounded-[1.5rem] border border-white/40 bg-white/80 shadow-cartoon-lg backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
            <p className="text-xs font-black font-nunito text-foreground">
              Notifikasi Masuk
            </p>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAsRead({ all: true })}
                  disabled={isMarking}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-black text-foreground transition-all hover:shadow-cartoon-sm disabled:opacity-60"
                >
                  {isMarking ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    <CheckCheck className="h-2.5 w-2.5" />
                  )}
                  Tandai semua
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Hapus semua notifikasi? Tindakan ini tidak bisa dibatalkan.")) {
                      void deleteNotifications({ all: true });
                    }
                  }}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2 py-0.5 text-[10px] font-black text-red-500 transition-all hover:bg-red-50 hover:shadow-cartoon-sm disabled:opacity-60"
                >
                  {isDeleting ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-2.5 w-2.5" />
                  )}
                  Hapus semua
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {error && (
              <p className="border-b border-border bg-primary/10 px-3 py-2 text-[10px] font-bold text-foreground">
                {error}
              </p>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-3 py-8 text-[11px] font-bold text-foreground/60">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Memuat notifikasi...
              </div>
            ) : notifications.length === 0 ? (
              <div className="space-y-1 px-3 py-8 text-center">
                <Inbox className="mx-auto h-6 w-6 text-foreground/40" />
                <p className="text-[11px] font-black font-nunito text-foreground">
                  Belum ada notifikasi
                </p>
                <p className="text-[10px] font-semibold text-foreground/60">
                  Testimoni dan catatan artikel baru akan muncul di sini.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((notification) => (
                  <li key={notification.id} className="relative group/item">
                    <button
                      type="button"
                      onClick={() => handleSelect(notification)}
                      className={`w-full px-3 py-2.5 pr-9 text-left transition-colors hover:bg-primary/5 ${
                        notification.is_read ? "bg-white" : "bg-secondary/60"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!notification.is_read && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full border border-white/40 bg-primary" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-black font-nunito text-foreground">
                            {notification.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[10px] font-semibold text-foreground/70">
                            {notification.message}
                          </p>
                          <p className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-foreground/50">
                            <Clock className="h-2.5 w-2.5" />
                            {formatReviewDateTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void deleteNotifications({ ids: [notification.id] });
                      }}
                      disabled={isDeleting}
                      aria-label="Hapus notifikasi ini"
                      title="Hapus notifikasi"
                      className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white p-1.5 text-red-500 shadow-cartoon-sm transition-all hover:bg-red-50 active:scale-90 disabled:opacity-60"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border px-3 py-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push("/admin/reviews");
              }}
              className="w-full rounded-full border border-border bg-secondary px-3 py-1.5 text-[10px] font-black text-foreground shadow-cartoon-sm transition-all hover:-translate-y-1 hover:shadow-cartoon active:scale-95"
            >
              Buka Kelola Testimoni
            </button>
          </div>
        </div>
      )}

      {/* Pop-up notifikasi baru — selalu di tengah layar, mobile & desktop */}
      {showPopup && popupItems.length > 0 && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowPopup(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Notifikasi baru masuk"
        >
          <div
            className="w-full max-w-sm rounded-[1.5rem] border border-white/40 bg-white p-5 shadow-cartoon-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/30">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-black font-nunito text-foreground">Notifikasi Baru</p>
                  <p className="text-[10px] font-bold text-foreground/60">
                    {popupItems.length === 1 ? "1 notifikasi" : `${popupItems.length} notifikasi`} belum dibaca
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                aria-label="Tutup"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-secondary text-foreground transition-all hover:shadow-cartoon-sm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {popupItems.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPopup(false);
                      void handleSelect(notification);
                    }}
                    className="w-full rounded-2xl border border-border bg-secondary/40 px-3 py-2.5 text-left transition-all hover:bg-primary/5 hover:shadow-cartoon-sm"
                  >
                    <p className="text-[11px] font-black font-nunito text-foreground">{notification.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[10px] font-semibold text-foreground/70">{notification.message}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-foreground/50">
                      <Clock className="h-2.5 w-2.5" />
                      {formatReviewDateTime(notification.created_at)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="flex-1 rounded-full border border-border bg-white px-3 py-2 text-[11px] font-black text-foreground shadow-cartoon-sm transition-all hover:-translate-y-0.5 active:scale-95"
              >
                Nanti
              </button>
              <button
                type="button"
                onClick={async () => {
                  await markAsRead({ ids: popupItems.map((n) => n.id) });
                  setShowPopup(false);
                }}
                disabled={isMarking}
                className="flex-1 rounded-full border border-border bg-primary px-3 py-2 text-[11px] font-black text-white shadow-cartoon-sm transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
              >
                {isMarking ? "Memproses..." : "Tandai dibaca"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
