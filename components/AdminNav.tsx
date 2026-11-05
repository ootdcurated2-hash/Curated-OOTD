"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  BarChart3,
  Star,
  PlusCircle,
  Settings,
  FolderTree,
  BookOpen,
  MessageSquareQuote,
  Users,
} from "lucide-react";

export default function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/admin",
      label: "Kelola Outfit",
      icon: LayoutGrid,
      exact: true,
    },
    {
      href: "/admin/analytics",
      label: "Statistik",
      icon: BarChart3,
    },
    {
      href: "/admin/categories",
      label: "Kategori",
      icon: FolderTree,
    },
    {
      href: "/admin/reviews",
      label: "Ulasan",
      icon: Star,
    },
    {
      href: "/admin/blog",
      label: "Blog",
      icon: BookOpen,
    },
    {
      href: "/admin/catatan",
      label: "Catatan",
      icon: MessageSquareQuote,
    },
    {
      href: "/admin/users",
      label: "Kelola User",
      icon: Users,
    },
    {
      href: "/admin/settings",
      label: "Pengaturan",
      icon: Settings,
    },
  ];

  return (
    <nav
      className="-mx-3 px-3 sm:mx-0 sm:px-0 overflow-x-auto overscroll-x-contain [scrollbar-width:thin]"
      aria-label="Navigasi panel admin"
    >
      <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2 pb-0.5 w-max sm:w-full sm:flex-wrap">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-link ${isActive ? "active" : ""}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <Link
          href="/admin/outfit/new"
          className="cartoon-btn shimmer inline-flex shrink-0 items-center gap-1.5 px-3.5 py-1.5 text-xs font-black bg-primary text-white whitespace-nowrap shadow-cartoon-sm hover:scale-105 active:scale-95 transition-all rounded-full"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Tambah Gaya</span>
        </Link>
      </div>
    </nav>
  );
}
