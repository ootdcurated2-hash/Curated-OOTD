"use client";

import { useState } from "react";
import { ExternalLink, ShoppingBag, Plus, Check } from "lucide-react";
import { OutfitItem } from "./OutfitCard";
import { addToCart } from "@/lib/cart";
import { notifyCartToast } from "./CartToast";

interface ShopTheLookProps {
  imageUrl: string;
  items: OutfitItem[];
  outfitId?: string;
}

export function getMarketplaceInfo(url: string | undefined) {
  if (!url) {
    return {
      name: "Toko Online",
      badgeColor: "bg-gray-100 text-gray-700 border-gray-200",
      bg: "bg-primary hover:bg-primary/90",
    };
  }

  const lower = url.toLowerCase();
  if (lower.includes("shopee") || lower.includes("shp.ee") || lower.includes("shope.ee")) {
    return {
      name: "Shopee",
      badgeColor: "bg-orange-50 text-orange-600 border-orange-200",
      bg: "bg-[#EE4D2D] hover:bg-[#d73f20]",
    };
  }

  if (lower.includes("tokopedia") || lower.includes("tokope.da") || lower.includes("tkp.me")) {
    return {
      name: "Tokopedia",
      badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200",
      bg: "bg-[#03AC0E] hover:bg-[#028f0c]",
    };
  }

  if (lower.includes("tiktok") || lower.includes("shop.tiktok")) {
    return {
      name: "TikTok Shop",
      badgeColor: "bg-slate-100 text-slate-900 border-slate-300",
      bg: "bg-[#111111] hover:bg-black",
    };
  }

  if (lower.includes("lazada")) {
    return {
      name: "Lazada",
      badgeColor: "bg-blue-50 text-blue-600 border-blue-200",
      bg: "bg-[#0F146D] hover:bg-[#0a0e50]",
    };
  }

  if (lower.includes("zalora")) {
    return {
      name: "Zalora",
      badgeColor: "bg-zinc-100 text-zinc-900 border-zinc-300",
      bg: "bg-[#222222] hover:bg-black",
    };
  }

  return {
    name: "Toko Resmi",
    badgeColor: "bg-primary/10 text-primary border-primary/20",
    bg: "bg-primary hover:bg-primary/90",
  };
}

export default function ShopTheLook({
  imageUrl,
  items,
  outfitId,
}: ShopTheLookProps) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const handleTrackClick = async (item: OutfitItem) => {
    try {
      fetch("/api/track-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outfit_id: outfitId,
          item_id: item.id,
          target_url: item.affiliate_url,
        }),
      }).catch((e) => console.error("Track failed", e));
    } catch (e) {
      // Ignore background tracking errors
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Image with interactive hotspot pins */}
      <div className="relative aspect-[3/4] w-full rounded-2xl border border-border bg-muted">
        {/* Gambar diklip sendiri agar tooltip hotspot tidak ikut terpotong di layer atas */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <img
            src={imageUrl}
            alt="Tampilan Outfit"
            className="h-full w-full object-cover"
          />
        </div>

        {items.map((item) => {
          if (item.x === undefined || item.y === undefined) return null;
          const isSelected = activeItemId === item.id;
          return (
            <div
              key={item.id}
              style={{ left: `${item.x}%`, top: `${item.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 transform cursor-pointer"
              onClick={() => setActiveItemId(isSelected ? null : item.id)}
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute inline-flex h-8 w-8 sm:h-7 sm:w-7 animate-ping rounded-full bg-primary/40 opacity-75" />
                <button
                  className={`relative flex h-7 w-7 sm:h-6 sm:w-6 items-center justify-center rounded-full text-xs font-bold shadow-cartoon-sm transition-transform ${
                    isSelected
                      ? "scale-125 bg-primary text-primary-foreground"
                      : "bg-background/90 text-foreground hover:scale-110"
                  }`}
                >
                  +
                </button>
              </div>

              {/* Tooltip popup */}
              {isSelected && (
                <div className="absolute bottom-8 left-1/2 z-20 w-48 -translate-x-1/2 rounded-2xl border border-border bg-popover p-3 text-xs text-popover-foreground shadow-cartoon-lg">
                  <p className="font-semibold">{item.name}</p>
                  {item.brand && (
                    <p className="text-muted-foreground">{item.brand}</p>
                  )}
                  {item.price && (
                    <p className="mt-1 font-bold">
                      Rp {item.price.toLocaleString("id-ID")}
                    </p>
                  )}
                  {(() => {
                    const pinMp = getMarketplaceInfo(item.affiliate_url);
                    return (
                      <a
                        href={item.affiliate_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleTrackClick(item)}
                        className={`mt-2.5 flex items-center justify-center gap-1.5 rounded-full py-1.5 px-3 text-center text-xs font-black text-white shadow-sm transition-all hover:opacity-90 ${pinMp.bg}`}
                      >
                        Beli di {pinMp.name} <ExternalLink className="h-3 w-3" />
                      </a>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Product List Breakdown */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3 gap-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Belanja Tampilan Ini</h2>
          </div>

          {/* Tombol Utama Langsung Belanja Tampilan Ini ke Toko (Shopee/Tokopedia/TikTok Shop) */}
          {items.length > 0 && items[0]?.affiliate_url && (
            <a
              href={items[0].affiliate_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleTrackClick(items[0])}
              className={`cartoon-btn inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-black text-white shadow-cartoon-sm transition-all hover:scale-105 ${
                getMarketplaceInfo(items[0].affiliate_url).bg
              }`}
            >
              <span>Belanja di {getMarketplaceInfo(items[0].affiliate_url).name}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const mp = getMarketplaceInfo(item.affiliate_url);
            return (
              <div
                key={item.id}
                onMouseEnter={() => setActiveItemId(item.id)}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 sm:p-5 transition-all duration-300 ${
                  activeItemId === item.id
                    ? "border-primary bg-primary/5 shadow-cartoon-sm"
                    : "border-border bg-white/70 hover:border-primary/40 backdrop-blur-md"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-base text-foreground font-nunito">{item.name}</p>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${mp.badgeColor}`}>
                      {mp.name}
                    </span>
                  </div>
                  {item.brand && (
                    <p className="text-xs font-medium text-foreground/60 mt-0.5">Brand: {item.brand}</p>
                  )}
                  {item.price && (
                    <p className="mt-1.5 font-black text-sm text-primary">
                      Rp {item.price.toLocaleString("id-ID")}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      addToCart({
                        id: item.id,
                        name: item.name,
                        brand: item.brand,
                        price: item.price,
                        affiliate_url: item.affiliate_url,
                        outfitId,
                        outfitImage: imageUrl,
                      });
                      notifyCartToast("added", item.name);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs font-black text-foreground bg-secondary hover:bg-secondary/80 border border-border shadow-cartoon-sm transition-all active:scale-95"
                    title="Tambah ke Keranjang"
                  >
                    <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                    <span className="hidden xs:inline">+ Keranjang</span>
                  </button>

                  <a
                    href={item.affiliate_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleTrackClick(item)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 sm:px-5 py-2.5 text-xs font-black text-white shadow-cartoon-sm hover:opacity-90 transition-all active:scale-95 ${mp.bg}`}
                  >
                    Beli di {mp.name}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-white/30 p-8 text-center text-xs font-bold text-foreground/50">
              Belum ada link produk toko yang ditautkan untuk outfit ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
