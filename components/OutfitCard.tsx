"use client";

import Link from "next/link";
import GuestGuardLink from "@/components/GuestGuardLink";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  isInWishlist,
  toggleWishlistEntry,
  WISHLIST_UPDATED_EVENT,
} from "@/lib/wishlist";
import { notifyWishlistToast } from "@/components/WishlistToast";
import { notifyCartToast } from "@/components/CartToast";
import {
  isInCart,
  addToCart,
  removeFromCart,
  CART_UPDATED_EVENT,
} from "@/lib/cart";

export interface OutfitItem {
  id: string;
  name: string;
  brand?: string;
  price?: number;
  affiliate_url: string;
  x?: number;
  y?: number;
}

export interface Outfit {
  id: string;
  title: string;
  image_url: string;
  description?: string;
  likes_count?: number;
  tags?: string[];
  items?: OutfitItem[];
}

interface OutfitCardProps {
  outfit: Outfit;
  isLoggedIn?: boolean;
  onSelectTag?: (tag: string) => void;
}

export default function OutfitCard({ outfit, isLoggedIn: initialIsLoggedIn, onSelectTag }: OutfitCardProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [isAuth, setIsAuth] = useState<boolean | null>(
    typeof initialIsLoggedIn === "boolean" ? initialIsLoggedIn : null
  );

  useEffect(() => {
    const cartId = `outfit_${outfit.id}`;
    setLiked(isInWishlist(outfit.id));
    setInCart(isInCart(cartId));
    const syncWishlist = () => setLiked(isInWishlist(outfit.id));
    const syncCart = () => setInCart(isInCart(cartId));
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncWishlist);
    window.addEventListener(CART_UPDATED_EVENT, syncCart);
    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncWishlist);
      window.removeEventListener(CART_UPDATED_EVENT, syncCart);
    };
  }, [outfit.id]);

  useEffect(() => {
    if (typeof initialIsLoggedIn === "boolean") {
      setIsAuth(initialIsLoggedIn);
      return;
    }

    // Cek status auth via supabase client bila prop isLoggedIn tidak dioper
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: any) => {
      const hasUser = !!data?.user;
      const hasAdmin = typeof document !== "undefined" && document.cookie.includes("admin_session=adminootd_authenticated");
      setIsAuth(hasUser || hasAdmin);
    });
  }, [initialIsLoggedIn]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Pastikan status autentikasi terbaru
    let authenticated = isAuth;
    if (authenticated === null) {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const hasAdmin = typeof document !== "undefined" && document.cookie.includes("admin_session=adminootd_authenticated");
      authenticated = !!data?.user || hasAdmin;
      setIsAuth(authenticated);
    }

    // Jika guest (belum login), redirect ke login page
    if (!authenticated) {
      router.push(`/auth/login?next=${encodeURIComponent(window.location.pathname || "/")}`);
      return;
    }

    const nowLiked = toggleWishlistEntry({
      id: outfit.id,
      title: outfit.title,
      image_url: outfit.image_url,
      description: outfit.description,
      tags: outfit.tags,
    });
    setLiked(nowLiked);

    // Tampilkan pop-up notifikasi toast
    notifyWishlistToast(nowLiked ? "added" : "removed", outfit.title);
  };

  const toggleCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Pastikan status autentikasi terbaru
    let authenticated = isAuth;
    if (authenticated === null) {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const hasAdmin = typeof document !== "undefined" && document.cookie.includes("admin_session=adminootd_authenticated");
      authenticated = !!data?.user || hasAdmin;
      setIsAuth(authenticated);
    }

    // Jika guest (belum login), redirect ke login page
    if (!authenticated) {
      router.push(`/auth/login?next=${encodeURIComponent(window.location.pathname || "/")}`);
      return;
    }

    const firstItem = outfit.items?.[0];
    const cartId = `outfit_${outfit.id}`;
    const nowInCart = isInCart(cartId);

    // Ambil harga minimum dari item-item dalam outfit
    const validPrices = (outfit.items || [])
      .map((it) => it.price)
      .filter((p): p is number => p !== undefined && p !== null && !isNaN(p) && p > 0);
    const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : undefined;

    if (nowInCart) {
      removeFromCart(cartId);
      setInCart(false);
      notifyCartToast("removed", outfit.title);
    } else {
      addToCart({
        id: cartId,
        name: outfit.title,
        affiliate_url: firstItem?.affiliate_url ?? "",
        price: minPrice,
        outfitId: outfit.id,
        outfitTitle: outfit.title,
        outfitImage: outfit.image_url,
        quantity: 1,
      });
      setInCart(true);
      notifyCartToast("added", outfit.title);
    }
  };

  // Hitung rentang atau harga item outfit
  const validPrices = (outfit.items || [])
    .map((it) => it.price)
    .filter((p): p is number => p !== undefined && p !== null && !isNaN(p) && p > 0);

  const priceDisplay = (() => {
    if (validPrices.length === 0) return null;
    const minPrice = Math.min(...validPrices);
    const maxPrice = Math.max(...validPrices);

    if (minPrice === maxPrice) {
      return `Rp ${minPrice.toLocaleString("id-ID")}`;
    }
    return `Rp ${minPrice.toLocaleString("id-ID")} - ${maxPrice.toLocaleString("id-ID")}`;
  })();

  return (
    <div className="outfit-card group relative overflow-hidden cartoon-card bg-white/75 backdrop-blur-xl transition-all duration-300 border-border hover:shadow-cartoon-lg hover:-translate-y-1">
      <div className="relative">
        <GuestGuardLink href={`/outfit/${outfit.id}`} isLoggedIn={isAuth === true} className="block overflow-hidden">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-primary/5 border-b border-border">
            <img
              src={outfit.image_url}
              alt={outfit.title}
              className="outfit-card-img h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              loading="lazy"
            />
            {/* Elegant gradient overlay on hover */}
            <div className="outfit-card-overlay" />
          </div>
        </GuestGuardLink>

        {/* Tombol Wishlist di pojok kanan atas gambar outfit */}
        <div className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 z-20 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={toggleWishlist}
            aria-label={liked ? "Hapus dari Favorit" : "Simpan ke Favorit"}
            aria-pressed={liked}
            className={`group/btn flex h-7 w-7 sm:h-10 sm:w-10 items-center justify-center rounded-full border shadow-md backdrop-blur-md transition-all duration-300 hover:scale-115 active:scale-90 ${
              liked
                ? "border-pink-300 bg-white/95 text-primary shadow-pink-500/25 ring-2 ring-primary/20 scale-105"
                : "border-white/80 bg-white/85 text-foreground/60 hover:text-primary hover:border-pink-200 hover:bg-white shadow-black/15"
            }`}
          >
            <Heart
              className={`h-3.5 w-3.5 sm:h-5 sm:w-5 transition-all duration-300 ${
                liked
                  ? "fill-primary text-primary scale-110"
                  : "stroke-[2.2] group-hover/btn:text-primary group-hover/btn:scale-110"
              }`}
            />
          </button>

          {/* Tombol Keranjang */}
          <button
            type="button"
            onClick={toggleCart}
            aria-label={inCart ? "Hapus dari Keranjang" : "Tambah ke Keranjang"}
            aria-pressed={inCart}
            className={`group/cart flex h-7 w-7 sm:h-10 sm:w-10 items-center justify-center rounded-full border shadow-md backdrop-blur-md transition-all duration-300 hover:scale-115 active:scale-90 ${
              inCart
                ? "border-primary/40 bg-primary text-white shadow-primary/30 ring-2 ring-primary/20 scale-105"
                : "border-white/80 bg-white/85 text-foreground/60 hover:text-primary hover:border-primary/30 hover:bg-white shadow-black/15"
            }`}
          >
            <ShoppingBag
              className={`h-3.5 w-3.5 sm:h-5 sm:w-5 transition-all duration-300 ${
                inCart
                  ? "fill-white/30 text-white scale-110"
                  : "stroke-[2.2] group-hover/cart:text-primary group-hover/cart:scale-110"
              }`}
            />
          </button>
        </div>
      </div>

      <GuestGuardLink href={`/outfit/${outfit.id}`} isLoggedIn={isAuth === true} className="block">
        <div className="p-2.5 sm:p-5 space-y-1.5 sm:space-y-2.5">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 sm:gap-2">
            <h3 className="line-clamp-1 font-bold text-xs sm:text-base md:text-lg text-foreground font-nunito tracking-tight group-hover:text-primary transition-colors duration-300">
              {outfit.title}
            </h3>
            {priceDisplay && (
              <span className="shrink-0 self-start xs:self-auto rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-black text-primary font-nunito shadow-xs">
                {priceDisplay}
              </span>
            )}
          </div>
          {outfit.description && (
            <p className="line-clamp-1 sm:line-clamp-2 text-[10px] sm:text-xs font-medium text-foreground/60 leading-tight sm:leading-relaxed">
              {outfit.description}
            </p>
          )}
          {outfit.tags && outfit.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-0.5 sm:pt-1">
              {outfit.tags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    if (onSelectTag) {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectTag(tag);
                    }
                  }}
                  className={`rounded-full border border-border/80 bg-white/90 px-1.5 sm:px-2.5 py-0.5 text-[8px] sm:text-[9px] font-black text-foreground/70 shadow-cartoon-sm uppercase tracking-wider transition-all truncate max-w-[90px] sm:max-w-none ${
                    onSelectTag
                      ? "hover:border-primary/50 hover:bg-primary/10 hover:text-primary cursor-pointer active:scale-95"
                      : ""
                  }`}
                >
                  #{tag}
                </button>
              ))}
              {outfit.tags.length > 3 && (
                <span className="text-[8px] sm:text-[9px] font-bold text-foreground/40 self-center">
                  +{outfit.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </GuestGuardLink>
    </div>
  );
}
