"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, ShoppingBag, Grid, Home, Bot } from "lucide-react";
import { getWishlist, WISHLIST_UPDATED_EVENT } from "@/lib/wishlist";
import { getCartCount, CART_UPDATED_EVENT } from "@/lib/cart";

interface NavbarNavLinksProps {
  isLoggedIn: boolean;
}

export default function NavbarNavLinks({ isLoggedIn }: NavbarNavLinksProps) {
  const pathname = usePathname();
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const [cartCount, setCartCount] = useState<number>(0);

  useEffect(() => {
    const sync = () => {
      setWishlistCount(getWishlist().length);
      setCartCount(getCartCount());
    };
    sync();

    window.addEventListener(WISHLIST_UPDATED_EVENT, sync);
    window.addEventListener(CART_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, sync);
      window.removeEventListener(CART_UPDATED_EVENT, sync);
    };
  }, []);

  const links = [
    {
      href: "/",
      label: "Beranda",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      href: "/creator",
      label: "Tanya AI",
      icon: Bot,
      isActive: pathname?.startsWith("/creator"),
    },
    {
      href: "/cart",
      label: "Keranjang",
      icon: ShoppingBag,
      isActive: pathname === "/cart",
      badge: cartCount > 0 ? (cartCount > 99 ? "99+" : cartCount) : null,
    },
    {
      href: "/wishlist",
      label: "Favorit",
      icon: Heart,
      isActive: pathname === "/wishlist",
      badge: wishlistCount > 0 ? (wishlistCount > 99 ? "99+" : wishlistCount) : null,
    },
  ];

  return (
    <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
      {links.map((item) => {
        const Icon = item.icon;
        const active = item.isActive;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
              active
                ? "bg-primary text-white shadow-cartoon-sm scale-105"
                : "text-foreground/80 hover:text-foreground hover:bg-black/5"
            }`}
          >
            <Icon
              className={`h-4 w-4 ${
                active ? "stroke-[2.5]" : "stroke-[2]"
              } ${item.href === "/wishlist" && active ? "fill-white" : ""}`}
            />
            <span>{item.label}</span>

            {item.badge !== null && item.badge !== undefined && (
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black leading-none ${
                  active
                    ? "bg-white text-primary"
                    : "bg-primary text-white"
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
