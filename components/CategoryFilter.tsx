"use client";

import { useEffect, useState } from "react";
import { Category, getStoredCategories, syncCategoriesToLocal } from "@/lib/categories";
import { Tag } from "lucide-react";

interface CategoryFilterProps {
  activeCategory: string;
  onSelectCategory: (slug: string) => void;
  onCategoriesLoaded?: (categories: Category[]) => void;
}

export default function CategoryFilter({
  activeCategory,
  onSelectCategory,
  onCategoriesLoaded,
}: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  const loadCategories = async () => {
    let cats: Category[] = [];
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.success && Array.isArray(json.categories) && json.categories.length > 0) {
        cats = json.categories;
        syncCategoriesToLocal(cats);
      }
    } catch {
      // fallback ke localStorage
    }
    if (cats.length === 0) {
      cats = getStoredCategories();
    }

    // Filter keluar slug gender agar Kategori Gaya murni untuk gaya busana
    const genderSlugs = new Set(["pria", "wanita", "anak-anak", "anak-pria", "anak-wanita"]);
    cats = cats.filter((c) => !genderSlugs.has(c.slug.toLowerCase()));

    // Jangan tambahkan "Semua" otomatis — biarkan admin yang kelola
    setCategories(cats);
    onCategoriesLoaded?.(cats);
  };

  useEffect(() => {
    loadCategories();

    const handleUpdate = () => loadCategories();
    window.addEventListener("categories_updated", handleUpdate);
    return () => window.removeEventListener("categories_updated", handleUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Jika belum ada kategori yang dibuat admin, sembunyikan section ini
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-2">
      {/* Label */}
      <div className="flex items-center gap-1.5">
        <Tag className="h-3 w-3 text-foreground/40" />
        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
          Kategori Gaya
        </span>
      </div>

      {/* Pills horizontal scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none no-scrollbar">
        {/* Tombol Semua Koleksi */}
        <button
          onClick={() => onSelectCategory("all")}
          className={`pill-3d shrink-0 rounded-full border px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-black tracking-tight transition-all ${
            activeCategory === "all"
              ? "pill-3d-active border-primary bg-primary text-white"
              : "border-border bg-white/60 text-foreground backdrop-blur-md hover:bg-secondary"
          }`}
        >
          Semua Koleksi
        </button>

        {categories.map((cat) => {
          if (cat.slug === "all") return null;
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`pill-3d shrink-0 rounded-full border px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-black tracking-tight transition-all ${
                isActive
                  ? "pill-3d-active border-primary bg-primary text-white"
                  : "border-border bg-white/60 text-foreground backdrop-blur-md hover:bg-secondary"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
