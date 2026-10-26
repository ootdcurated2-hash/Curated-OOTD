"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import {
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  CartItem,
  CART_UPDATED_EVENT,
} from "@/lib/cart";
import { notifyCartToast } from "@/components/CartToast";
import { getMarketplaceInfo } from "@/components/ShopTheLook";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const load = useCallback(() => {
    setCartItems(getCart());
    setMounted(true);
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(CART_UPDATED_EVENT, load);
    return () => window.removeEventListener(CART_UPDATED_EVENT, load);
  }, [load]);

  const handleUpdateQty = (id: string, delta: number) => {
    updateCartQuantity(id, delta);
  };

  const handleRemove = (item: CartItem) => {
    removeFromCart(item.id);
    notifyCartToast("removed", item.name);
  };

  const handleClear = () => {
    if (confirm("Kosongkan semua item di keranjang belanja?")) {
      clearCart();
    }
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  const totalCount = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );

  return (
    <main className="container max-w-4xl py-6 sm:py-10 px-3 sm:px-6 space-y-6 min-w-0">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-black text-foreground shadow-cartoon-sm hover:-translate-y-1 hover:shadow-cartoon active:scale-95 transition-all"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
      </Link>

      <div className="flex items-center justify-between gap-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl border border-border bg-primary shadow-cartoon-sm flex items-center justify-center text-white shrink-0">
            <ShoppingBag className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-nunito tracking-tight text-foreground">
              Keranjang Belanja
            </h1>
            <p className="text-xs font-bold text-foreground/70">
              {mounted
                ? `${totalCount} produk tersimpan untuk dibeli`
                : "Memuat keranjang..."}
            </p>
          </div>
        </div>

        {mounted && cartItems.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Kosongkan</span>
          </button>
        )}
      </div>

      {!mounted ? null : cartItems.length === 0 ? (
        <div className="cartoon-card bg-white/70 backdrop-blur-xl p-8 sm:p-12 text-center space-y-4 rounded-3xl border border-border">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-secondary shadow-cartoon-sm">
            <ShoppingBag className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black font-nunito text-foreground">
              Keranjang Belanja Masih Kosong
            </h3>
            <p className="text-xs font-semibold text-foreground/70 max-w-md mx-auto">
              Temukan produk outfit favorit Anda pada katalog dan tambahkan ke keranjang untuk memudahkan checkout toko.
            </p>
          </div>
          <div>
            <Link
              href="/"
              className="cartoon-btn inline-block bg-primary text-white px-6 py-2.5 text-xs sm:text-sm font-black rounded-full shadow-cartoon-sm hover:scale-105 transition-all"
            >
              Jelajahi Inspirasi OOTD Sekarang &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* List of items */}
          <div className="lg:col-span-2 space-y-3">
            {cartItems.map((item) => {
              const market = getMarketplaceInfo(item.affiliate_url);
              const subtotal = (item.price || 0) * (item.quantity || 1);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-white/90 backdrop-blur-md p-3.5 sm:p-4 shadow-cartoon-sm flex gap-3 sm:gap-4 items-center group transition-all"
                >
                  {/* Thumbnail / Icon */}
                  {item.outfitImage ? (
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border border-border shrink-0 bg-secondary">
                      <img
                        src={item.outfitImage}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl border border-border shrink-0 bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      <ShoppingBag className="h-7 w-7" />
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider mb-1 ${market.badgeColor}`}
                        >
                          {market.name}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground line-clamp-1">
                          {item.name}
                        </h4>
                        {item.brand && (
                          <p className="text-[11px] text-foreground/60 font-medium">
                            Brand: {item.brand}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleRemove(item)}
                        className="p-1.5 text-foreground/40 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        aria-label="Hapus item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/40">
                      <div>
                        <span className="text-xs sm:text-sm font-black text-primary">
                          {item.price
                            ? `Rp ${subtotal.toLocaleString("id-ID")}`
                            : "Harga di Toko"}
                        </span>
                        {item.price && item.quantity > 1 && (
                          <span className="text-[10px] text-foreground/50 ml-1.5 block sm:inline">
                            (@ Rp {item.price.toLocaleString("id-ID")})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-border rounded-full bg-white px-1.5 py-0.5 shadow-sm">
                          <button
                            onClick={() => handleUpdateQty(item.id, -1)}
                            className="p-1 hover:text-primary transition-colors disabled:opacity-40"
                            aria-label="Kurang satu"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-black px-2 min-w-[20px] text-center">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item.id, 1)}
                            className="p-1 hover:text-primary transition-colors"
                            aria-label="Tambah satu"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Open Product Link */}
                        <a
                          href={item.affiliate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-xs font-bold bg-primary text-white rounded-full hover:opacity-90 flex items-center gap-1 shadow-sm transition-all"
                        >
                          <span>Beli</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checkout / Summary Box */}
          <div className="lg:col-span-1 rounded-2xl border border-border bg-white/95 backdrop-blur-md p-5 shadow-cartoon space-y-4 sticky top-24">
            <h3 className="text-base font-black font-nunito text-foreground border-b border-border/60 pb-2">
              Ringkasan Belanja
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-foreground/70">
                <span>Total Item</span>
                <span className="font-bold text-foreground">{totalCount} item</span>
              </div>
              <div className="flex justify-between text-foreground/70">
                <span>Estimasi Total</span>
                <span className="font-bold text-foreground">
                  {totalPrice > 0
                    ? `Rp ${totalPrice.toLocaleString("id-ID")}`
                    : "-"}
                </span>
              </div>
            </div>

            <div className="border-t border-dashed border-border pt-3">
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-sm font-black text-foreground">Total</span>
                <span className="text-lg font-black text-primary">
                  {totalPrice > 0
                    ? `Rp ${totalPrice.toLocaleString("id-ID")}`
                    : "Sesuai Toko"}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] text-foreground/60 leading-tight">
                  * Pembelian dilakukan langsung di e-commerce / marketplace resmi terkait.
                </p>

                {cartItems.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <p className="text-[11px] font-bold text-foreground">
                      Kunjungi Produk:
                    </p>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {cartItems.map((item) => {
                        const m = getMarketplaceInfo(item.affiliate_url);
                        return (
                          <a
                            key={item.id}
                            href={item.affiliate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2 rounded-xl border border-border/80 hover:border-primary bg-secondary/50 hover:bg-primary/5 text-xs font-bold text-foreground transition-all group"
                          >
                            <span className="truncate max-w-[150px]">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-primary flex items-center gap-1 shrink-0">
                              Buka {m.name} &rarr;
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
