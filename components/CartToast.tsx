"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, Check } from "lucide-react";

export interface CartToastEventDetail {
  action: "added" | "removed";
  title: string;
}

export const CART_TOAST_EVENT = "cart_toast_notification";

export function notifyCartToast(action: "added" | "removed", title: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<CartToastEventDetail>(CART_TOAST_EVENT, {
        detail: { action, title },
      })
    );
  }
}

export default function CartToast() {
  const [toast, setToast] = useState<{
    id: number;
    action: "added" | "removed";
    title: string;
  } | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<CartToastEventDetail>;
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

    window.addEventListener(CART_TOAST_EVENT, handleEvent);
    return () => {
      window.removeEventListener(CART_TOAST_EVENT, handleEvent);
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
              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
              : "bg-red-500/10 text-red-600 border border-red-500/20"
          }`}
        >
          {isAdded ? (
            <Check className="h-5 w-5 text-emerald-600 stroke-[3]" />
          ) : (
            <ShoppingBag className="h-5 w-5 text-red-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-foreground">
            {isAdded ? "Ditambahkan ke Keranjang!" : "Dihapus dari Keranjang"}
          </p>
          <p className="text-[11px] font-semibold text-foreground/70 truncate">
            {toast.title}
          </p>
        </div>
      </div>
    </div>
  );
}
