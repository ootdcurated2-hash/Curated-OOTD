"use client";

import { useState, useEffect, useRef } from "react";
import OutfitGrid from "@/components/OutfitGrid";
import CategoryFilter from "@/components/CategoryFilter";
import { Outfit } from "@/components/OutfitCard";
import { Category, DEFAULT_CATEGORIES } from "@/lib/categories";
import { Sparkles, Tag, X } from "lucide-react";
import GenderFilter from "@/components/GenderFilter";
import Pagination from "@/components/Pagination";

interface HomeClientProps {
  outfits: Outfit[];
  isLoggedIn?: boolean;
}

export default function HomeClient({ outfits, isLoggedIn = false }: HomeClientProps) {
  const [activeGender, setActiveGender] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoriesList, setCategoriesList] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const collectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const itemsPerPage = isMobile ? 6 : 5;

  // Scroll langsung ke koleksi outfit (bukan ke studio kreasi atau paling atas)
  const scrollToCollection = () => {
    if (collectionRef.current) {
      // Prioritaskan scrollIntoView dengan block start + offset
      collectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      
      // Cadangan penghitungan posisi presisi untuk mobile browser (Safari/Chrome Mobile)
      setTimeout(() => {
        if (!collectionRef.current) return;
        const navHeight = 70; // tinggi navbar sticky di mobile
        const elementPosition = collectionRef.current.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navHeight;
        
        // Hanya scroll jika belum pas di area atas viewport
        if (Math.abs(elementPosition - navHeight) > 20) {
          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: "smooth",
          });
        }
      }, 50);
    }
  };

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeGender, activeCategory, searchQuery]);

  // Cari objek kategori aktif jika ada
  const currentCategory = categoriesList.find((c) => c.slug === activeCategory);

  const filteredOutfits = outfits.filter((outfit) => {
    // 1. Filter Gender
    const matchGender = (() => {
      if (activeGender === "all") return true;

      const outfitTags = (outfit.tags || []).map((t) => t.toLowerCase().trim());
      const outfitText = `${outfit.title} ${outfit.description || ""}`.toLowerCase();

      if (activeGender === "pria") {
        return (
          outfitTags.some((t) => (t.includes("pria") || t.includes("cowok") || t.includes("men")) && !t.includes("anak")) ||
          (outfitText.includes("pria") && !outfitText.includes("anak"))
        );
      }

      if (activeGender === "wanita") {
        return (
          outfitTags.some((t) => (t.includes("wanita") || t.includes("cewek") || t.includes("women")) && !t.includes("anak")) ||
          (outfitText.includes("wanita") && !outfitText.includes("anak"))
        );
      }

      if (activeGender === "anak-anak") {
        return (
          outfitTags.some((t) => t.includes("anak") || t.includes("kids") || t.includes("child")) ||
          outfitText.includes("anak") ||
          outfitText.includes("kids")
        );
      }

      if (activeGender === "anak-pria") {
        return (
          (outfitTags.some((t) => t.includes("anak") || t.includes("kids")) &&
            outfitTags.some((t) => t.includes("pria") || t.includes("laki") || t.includes("boy"))) ||
          (outfitText.includes("anak") && (outfitText.includes("pria") || outfitText.includes("laki") || outfitText.includes("boy")))
        );
      }

      if (activeGender === "anak-wanita") {
        return (
          (outfitTags.some((t) => t.includes("anak") || t.includes("kids")) &&
            outfitTags.some((t) => t.includes("wanita") || t.includes("perempuan") || t.includes("girl"))) ||
          (outfitText.includes("anak") && (outfitText.includes("wanita") || outfitText.includes("perempuan") || outfitText.includes("girl")))
        );
      }

      return (
        outfitTags.some((t) => t.includes(activeGender.toLowerCase())) ||
        outfitText.includes(activeGender.toLowerCase())
      );
    })();

    // 2. Filter Kategori Gaya
    const matchCategory = (() => {
      if (activeCategory === "all") return true;

      const actSlug = activeCategory.toLowerCase().trim();
      const actName = (currentCategory?.name || "").toLowerCase().trim();

      return (outfit.tags || []).some((tag: string) => {
        const t = tag.toLowerCase().trim();
        const tSlug = t.replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-");

        return (
          t === actSlug ||
          tSlug === actSlug ||
          (actName && t.includes(actName)) ||
          (actName && actName.includes(t)) ||
          t.includes(actSlug) ||
          actSlug.includes(t)
        );
      });
    })();

    // 3. Filter Pencarian Teks
    const matchSearch =
      searchQuery.trim() === "" ||
      outfit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (outfit.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (outfit.tags || []).some((t: string) =>
        t.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return matchGender && matchCategory && matchSearch;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredOutfits.length / itemsPerPage);
  const paginatedOutfits = filteredOutfits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollToCollection();
  };

  const handleSelectTag = (tag: string) => {
    const cleanTag = tag.trim().toLowerCase();
    
    // Cek apakah tag merupakan gender
    if (cleanTag === "pria" || cleanTag === "wanita" || cleanTag.includes("anak")) {
      setActiveGender(cleanTag);
      scrollToCollection();
      return;
    }

    // Cek apakah tag ini cocok dengan salah satu kategori gaya
    const matchedCategory = categoriesList.find(
      (c) =>
        c.slug.toLowerCase() === cleanTag ||
        c.name.toLowerCase() === cleanTag
    );

    if (matchedCategory) {
      setActiveCategory(matchedCategory.slug);
    } else {
      setActiveCategory(cleanTag);
    }
    scrollToCollection();
  };

  const getActiveGenderLabel = () => {
    if (activeGender === "pria") return "Pria";
    if (activeGender === "wanita") return "Wanita";
    if (activeGender === "anak-anak") return "Anak-Anak";
    if (activeGender === "anak-pria") return "Anak Pria";
    if (activeGender === "anak-wanita") return "Anak Wanita";
    return "";
  };

  const activeCategoryTitle = (() => {
    const genderLabel = getActiveGenderLabel();
    const catLabel =
      activeCategory === "all" ? "" : currentCategory?.name || activeCategory;

    if (genderLabel && catLabel) {
      return `${catLabel} • ${genderLabel}`;
    }
    if (genderLabel) {
      return `Koleksi ${genderLabel}`;
    }
    return catLabel || "Koleksi Terbaru";
  })();

  return (
    <div className="space-y-5 sm:space-y-8 min-w-0">
      {/* Search + Gender & Category Controls */}
      <div className="relative overflow-visible space-y-3 sm:space-y-5 cartoon-card bg-white/40 p-3 sm:p-6 backdrop-blur-2xl border-white/40 shadow-cartoon">
        {/* Gender Filter di Atas */}
        <GenderFilter
          activeGender={activeGender}
          onSelectGender={setActiveGender}
        />

        <div className="border-t border-border/40 pt-2 sm:pt-4" />

        {/* Search bar */}
        <div className="relative">
          <svg
            className="absolute left-3.5 sm:left-5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-foreground/40 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari gaya, tren, atau outfit..."
            className="input-3d w-full min-w-0 rounded-xl sm:rounded-[1.5rem] border border-border bg-white/60 pl-9 sm:pl-14 pr-3 sm:pr-6 py-2.5 sm:py-4 text-xs sm:text-sm font-bold text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-cartoon-sm transition-all backdrop-blur-md"
          />
        </div>

        {/* Kategori Gaya */}
        <CategoryFilter
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          onCategoriesLoaded={setCategoriesList}
        />
      </div>

      {/* Header Kategori Aktif + Deskripsi */}
      <div ref={collectionRef} className="flex flex-col gap-2 px-1 sm:px-2 scroll-mt-20 sm:scroll-mt-24">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-2xl font-black tracking-tighter text-foreground font-nunito uppercase break-words">
              {activeCategoryTitle}
            </h2>
            {(activeCategory !== "all" || activeGender !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("all");
                  setActiveGender("all");
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline bg-primary/10 rounded-full px-2.5 py-0.5 transition-all"
                title="Reset semua filter"
              >
                <X className="h-3 w-3" />
                Reset Filter
              </button>
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40 shrink-0">
            {filteredOutfits.length} Outfit Ditemukan
          </span>
        </div>

        {/* Deskripsi kategori jika ada */}
        {currentCategory?.description && activeCategory !== "all" && (
          <p className="text-xs sm:text-sm font-medium text-foreground/60 max-w-2xl leading-relaxed">
            {currentCategory.description}
          </p>
        )}
      </div>

      {filteredOutfits.length === 0 ? (
        <div className="rounded-2xl sm:rounded-[2.5rem] border-2 border-dashed border-border bg-white/20 p-10 sm:p-20 text-center backdrop-blur-sm">
          <p className="text-foreground/50 text-sm font-bold">
            Tidak ada outfit untuk kategori &ldquo;{activeCategoryTitle}&rdquo;.
          </p>
          <button
            onClick={() => {
              setActiveCategory("all");
              setSearchQuery("");
            }}
            className="mt-4 text-xs font-black text-primary uppercase tracking-widest hover:underline underline-offset-4"
          >
            Lihat Semua Gaya &rarr;
          </button>
        </div>
      ) : (
        <>
          <OutfitGrid
            outfits={paginatedOutfits}
            isLoggedIn={isLoggedIn}
            onSelectTag={handleSelectTag}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
