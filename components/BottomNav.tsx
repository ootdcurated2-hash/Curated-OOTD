"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  Bot,
  ShoppingBag,
  Heart,
  User,
  Sparkles,
} from "lucide-react";
import { getWishlist, WISHLIST_UPDATED_EVENT } from "@/lib/wishlist";
import { getCartCount, CART_UPDATED_EVENT } from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";
import GuestGuardLink from "@/components/GuestGuardLink";

interface BottomNavProps {
  initialIsLoggedIn?: boolean;
}

export default function BottomNav({ initialIsLoggedIn }: BottomNavProps) {
  const pathname = usePathname();
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const [cartCount, setCartCount] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!initialIsLoggedIn);

  // Sync wishlist & cart badges
  useEffect(() => {
    const syncCounts = () => {
      setWishlistCount(getWishlist().length);
      setCartCount(getCartCount());
    };

    syncCounts();

    window.addEventListener(WISHLIST_UPDATED_EVENT, syncCounts);
    window.addEventListener(CART_UPDATED_EVENT, syncCounts);

    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncCounts);
      window.removeEventListener(CART_UPDATED_EVENT, syncCounts);
    };
  }, []);

  // Check auth status
  useEffect(() => {
    if (typeof initialIsLoggedIn === "boolean") {
      setIsLoggedIn(initialIsLoggedIn);
      return;
    }

    const checkAuth = async () => {
      const hasAdmin =
        typeof document !== "undefined" &&
        document.cookie.includes("admin_session=adminootd_authenticated");
      if (hasAdmin) {
        setIsLoggedIn(true);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setIsLoggedIn(!!data?.user);
    };

    checkAuth();
  }, [initialIsLoggedIn, pathname]);

  // Sembunyikan bottom nav di halaman auth atau admin jika diinginkan
  if (pathname?.startsWith("/auth") || pathname?.startsWith("/admin")) {
    return null;
  }

  const isHomeActive = pathname === "/";
  const isAIActive = pathname?.startsWith("/creator");
  const isKeranjangActive = pathname === "/cart";
  const isFavoritActive = pathname === "/wishlist";
  const isAkunActive = pathname === "/protected" || pathname === "/auth/login";

  const accountHref = isLoggedIn ? "/protected" : "/auth/login";

  const navItems = [
    {
      id: "beranda",
      label: "Beranda",
      href: "/",
      icon: Home,
      isActive: isHomeActive,
      requiresAuth: false,
    },
    {
      id: "tanya-ai",
      label: "Tanya AI",
      href: "/creator",
      icon: Bot,
      isActive: isAIActive,
      requiresAuth: true,
    },
    {
      id: "keranjang",
      label: "Keranjang",
      href: "/cart",
      icon: ShoppingBag,
      isActive: isKeranjangActive,
      badge: cartCount > 0 ? (cartCount > 99 ? "99+" : cartCount) : null,
      requiresAuth: true,
    },
    {
      id: "favorit",
      label: "Favorit",
      href: "/wishlist",
      icon: Heart,
      isActive: isFavoritActive,
      badge: wishlistCount > 0 ? (wishlistCount > 99 ? "99+" : wishlistCount) : null,
      requiresAuth: true,
    },
    {
      id: "akun",
      label: isLoggedIn ? "Akun" : "Masuk",
      href: accountHref,
      icon: User,
      isActive: isAkunActive,
      requiresAuth: false,
    },
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-border/80 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] pb-[max(env(safe-area-inset-bottom,0px),8px)] pt-2 transition-all"
    >
      <div className="grid grid-cols-5 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          const linkClass = `flex flex-col items-center justify-center py-1 px-1 relative transition-all group ${
            active ? "text-primary scale-105" : "text-foreground/60 hover:text-foreground"
          }`;

          const innerContent = (
            <>
              {/* Highlight background pill for active state */}
              <div
                className={`relative flex items-center justify-center p-1.5 rounded-full transition-all duration-200 ${
                  active
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "group-hover:bg-foreground/5"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 ${
                    active ? "stroke-[2.5] scale-110" : "stroke-[1.8]"
                  } ${item.id === "favorit" && active ? "fill-primary" : ""}`}
                />

                {/* Badge Counter */}
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in-50">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[11px] font-bold tracking-tight mt-0.5 leading-none transition-colors ${
                  active ? "text-primary font-black" : "text-foreground/70"
                }`}
              >
                {item.label}
              </span>

              {/* Dot indicator */}
              {active && (
                <span className="w-1 h-1 rounded-full bg-primary mt-1 shadow-sm" />
              )}
            </>
          );

          if (item.requiresAuth) {
            return (
              <GuestGuardLink
                key={item.id}
                href={item.href}
                isLoggedIn={isLoggedIn}
                className={linkClass}
              >
                {innerContent}
              </GuestGuardLink>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={linkClass}
            >
              {innerContent}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
