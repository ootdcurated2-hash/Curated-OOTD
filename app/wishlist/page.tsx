"use client";

import Link from "next/link";
import { Heart, ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import OutfitGrid from "@/components/OutfitGrid";
import type { Outfit } from "@/components/OutfitCard";
import { getWishlist, WISHLIST_UPDATED_EVENT } from "@/lib/wishlist";

export default function WishlistPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const load = useCallback(() => {
    setOutfits(getWishlist() as Outfit[]);
    setHydrated(true);
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(WISHLIST_UPDATED_EVENT, load);
    return () => window.removeEventListener(WISHLIST_UPDATED_EVENT, load);
  }, [load]);

  return (
    <main className="container max-w-7xl py-6 sm:py-8 px-3 sm:px-6 space-y-6 min-w-0">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-black text-foreground shadow-cartoon-sm hover:-translate-y-1 hover:shadow-cartoon active:scale-95 transition-all"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
      </Link>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl border border-border bg-primary shadow-cartoon-sm flex items-center justify-center text-white shrink-0">
          <Heart className="h-6 w-6 fill-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black font-nunito tracking-tighter text-foreground">
            Favorit Saya
          </h1>
          <p className="text-xs font-bold text-foreground/70">
            {hydrated
              ? `${outfits.length} outfit tersimpan di perangkat ini`
              : "Memuat favorit..."}
          </p>
        </div>
      </div>

      {!hydrated ? null : outfits.length === 0 ? (
        <div className="cartoon-card bg-white/60 backdrop-blur-xl p-8 sm:p-12 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-secondary shadow-cartoon-sm">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black font-nunito text-foreground">
              Belum Ada Outfit Tersimpan
            </h3>
            <p className="text-xs font-semibold text-foreground/70 max-w-md mx-auto">
              Simpan outfit yang Anda sukai dengan menekan ikon hati pada galeri untuk dilihat kembali kapan saja.
            </p>
          </div>
          <div>
            <Link
              href="/"
              className="cartoon-btn inline-block bg-primary text-white px-6 py-2.5 text-xs sm:text-sm font-black"
            >
              Jelajahi Inspirasi OOTD Sekarang &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <OutfitGrid outfits={outfits} isLoggedIn={true} />
      )}
    </main>
  );
}
