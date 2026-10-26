"use client";

import { useEffect, useState } from "react";
import { Heart, Trash2 } from "lucide-react";

export interface WishlistToastEventDetail {
  action: "added" | "removed";
  title: string;
}

export const WISHLIST_TOAST_EVENT = "wishlist_toast_notification";

export function notifyWishlistToast(action: "added" | "removed", title: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<WishlistToastEventDetail>(WISHLIST_TOAST_EVENT, {
        detail: { action, title },
      })
    );
  }
}

export default function WishlistToast() {
  const [toast, setToast] = useState<{
    id: number;
    action: "added" | "removed";
    title: string;
  } | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<WishlistToastEventDetail>;
      if (!customEvent.detail) return;

      const { action, title } = customEvent.detail;
      setToast({
        id: Date.now(),
        action,
        title,
      });

      clearTimeout(timer);
      timer = setTimeout(() => {
        setToast(null);
      }, 3000);
    };

    window.addEventListener(WISHLIST_TOAST_EVENT, handleEvent);
    return () => {
      window.removeEventListener(WISHLIST_TOAST_EVENT, handleEvent);
      clearTimeout(timer);
    };
  }, []);

  if (!toast) return null;

  const isAdded = toast.action === "added";

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-[100] max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-white/95 px-4 py-3.5 shadow-2xl backdrop-blur-xl dark:bg-card/95">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isAdded
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-red-500/10 text-red-600 border border-red-500/20"
          }`}
        >
          {isAdded ? (
            <Heart className="h-5 w-5 fill-primary text-primary animate-pulse" />
          ) : (
            <Trash2 className="h-5 w-5 text-red-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-foreground">
            {isAdded ? "Berhasil Disimpan!" : "Dihapus dari Favorit"}
          </p>
          <p className="text-[11px] font-semibold text-foreground/70 truncate">
            {toast.title}
          </p>
        </div>
      </div>
    </div>
  );
}
