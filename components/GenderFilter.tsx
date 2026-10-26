"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GenderCategory, DEFAULT_GENDERS, getStoredGenders, saveGenders } from "@/lib/categories";
import { ChevronDown, Users } from "lucide-react";

interface GenderFilterProps {
  activeGender: string;
  onSelectGender: (slug: string) => void;
}

export default function GenderFilter({ activeGender, onSelectGender }: GenderFilterProps) {
  const [genders, setGenders] = useState<GenderCategory[]>(DEFAULT_GENDERS);
  const [isKidsDropdownOpen, setIsKidsDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const kidsButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadGenders() {
      try {
        const res = await fetch("/api/genders");
        const json = await res.json();
        if (json.success && Array.isArray(json.genders) && json.genders.length > 0) {
          setGenders(json.genders);
          saveGenders(json.genders);
          return;
        }
      } catch {
        // fallback
      }
      setGenders(getStoredGenders());
    }

    loadGenders();

    const handleUpdate = () => loadGenders();
    window.addEventListener("genders_updated", handleUpdate);
    return () => window.removeEventListener("genders_updated", handleUpdate);
  }, []);

  // Hitung posisi dropdown berdasarkan posisi tombol di layar
  const openDropdown = () => {
    if (kidsButtonRef.current) {
      const rect = kidsButtonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
    setIsKidsDropdownOpen(true);
  };

  const closeDropdown = () => setIsKidsDropdownOpen(false);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    if (!isKidsDropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        kidsButtonRef.current &&
        !kidsButtonRef.current.contains(e.target as Node)
      ) {
        closeDropdown();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isKidsDropdownOpen]);

  // Tutup dropdown saat scroll
  useEffect(() => {
    if (!isKidsDropdownOpen) return;
    const handleScroll = () => closeDropdown();
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [isKidsDropdownOpen]);

  const isKidsActive =
    activeGender === "anak-anak" ||
    activeGender === "anak-pria" ||
    activeGender === "anak-wanita";

  const getKidsLabel = () => {
    if (activeGender === "anak-pria") return "Anak Pria";
    if (activeGender === "anak-wanita") return "Anak Wanita";
    return "Anak-Anak";
  };

  // Portal dropdown — dirender langsung ke document.body untuk menghindari stacking context
  const kidsDropdown =
    isKidsDropdownOpen && dropdownPos
      ? createPortal(
          <div
            style={{
              position: "absolute",
              top: dropdownPos.top,
              left: dropdownPos.left,
              zIndex: 9999,
              minWidth: 200,
            }}
            className="rounded-2xl border border-border bg-white shadow-cartoon-lg backdrop-blur-xl overflow-hidden"
          >
            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-foreground/40 border-b border-border/50">
              Pilih Kategori Anak
            </div>

            {[
              { slug: "anak-anak", label: "Semua Anak-Anak" },
              { slug: "anak-pria", label: "Anak Pria (Laki-laki)" },
              { slug: "anak-wanita", label: "Anak Wanita (Perempuan)" },
            ].map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => {
                  onSelectGender(item.slug);
                  closeDropdown();
                }}
                className={`w-full text-left px-3 py-2.5 text-xs font-black transition-all flex items-center justify-between ${
                  activeGender === item.slug
                    ? "bg-primary text-white"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                <span>{item.label}</span>
                {activeGender === item.slug && (
                  <span className="text-[10px] font-bold opacity-80">✓</span>
                )}
              </button>
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <div className="w-full space-y-2.5">
      {/* Label baris */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Users className="h-3 w-3 text-foreground/40" />
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
            Target Gender
          </span>
        </div>
        {activeGender !== "all" && (
          <button
            type="button"
            onClick={() => {
              onSelectGender("all");
              closeDropdown();
            }}
            className="text-[10px] font-black text-primary hover:underline uppercase tracking-wider"
          >
            Tampilkan Semua
          </button>
        )}
      </div>

      {/* Tombol-tombol gender — flex-wrap, tidak overflow */}
      <div className="flex flex-wrap items-center gap-2">
        {genders.map((gen) => {
          /* ── Tombol khusus Anak-Anak dengan sub-dropdown ── */
          if (gen.slug === "anak-anak") {
            return (
              <div key={gen.id} ref={kidsButtonRef} className="inline-flex">
                {/* Pill gabungan: [label | chevron] */}
                <div
                  className={`inline-flex items-center rounded-full border transition-all shadow-cartoon-sm ${
                    isKidsActive
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-white/60 text-foreground hover:bg-secondary"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!isKidsActive) onSelectGender("anak-anak");
                      isKidsDropdownOpen ? closeDropdown() : openDropdown();
                    }}
                    className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-black tracking-tight"
                  >
                    {getKidsLabel()}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      isKidsDropdownOpen ? closeDropdown() : openDropdown()
                    }
                    aria-label="Pilih sub-gender anak"
                    className={`pr-2 sm:pr-3 pl-1 py-1.5 sm:py-2 border-l transition-colors ${
                      isKidsActive
                        ? "border-white/30 text-white"
                        : "border-border text-foreground/60"
                    }`}
                  >
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-200 ${
                        isKidsDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          }

          /* ── Tombol gender reguler ── */
          const isActive = activeGender === gen.slug;
          return (
            <button
              key={gen.id}
              type="button"
              onClick={() => {
                onSelectGender(gen.slug);
                closeDropdown();
              }}
              className={`pill-3d shrink-0 rounded-full border px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-black tracking-tight transition-all ${
                isActive
                  ? "pill-3d-active border-primary bg-primary text-white"
                  : "border-border bg-white/60 text-foreground backdrop-blur-md hover:bg-secondary"
              }`}
            >
              {gen.name}
            </button>
          );
        })}
      </div>

      {/* Portal dropdown — dirender ke document.body agar tidak terpotong oleh stacking context */}
      {kidsDropdown}
    </div>
  );
}
