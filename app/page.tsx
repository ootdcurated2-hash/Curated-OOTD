import HomeClient from "@/components/HomeClient";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Outfit } from "@/components/OutfitCard";
import { cookies } from "next/headers";
import { isUserAdmin } from "@/lib/admin";
import GuestGuardLink from "@/components/GuestGuardLink";
import Testimonials from "@/components/Testimonials";
import { Review, REVIEW_COLUMNS } from "@/lib/reviews";
import { Brush } from "lucide-react";
import { normalizeOutfitItems } from "@/lib/outfitItems";

import TiltCard from "@/components/TiltCard";
import ScrollReveal from "@/components/ScrollReveal";
import { Sparkles } from "lucide-react";

export default async function Home() {
  const cookieStore = await cookies();
  const hasAdminCookie = cookieStore.get("admin_session")?.value === "adminootd_authenticated";

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  const isAdmin = hasAdminCookie || isUserAdmin(user);
  const isLoggedIn = !!user || hasAdminCookie;

  const { data: outfits } = await supabase
    .from("outfits")
    .select("*, outfit_items(*)")
    .order("created_at", { ascending: false });

  const displayOutfits: Outfit[] = (outfits ?? []).map((o: any) => ({
    ...o,
    items: normalizeOutfitItems(o.outfit_items || o.items),
  }));

  // Ulasan/testimoni — RLS menyaring: pengunjung hanya melihat ulasan yang
  // sudah disetujui admin, sedangkan pemilik ulasan melihat miliknya sendiri.
  const { data: reviewsData } = await supabase
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .order("created_at", { ascending: false });

  const reviews: Review[] = reviewsData ?? [];
  const currentUserId = (user as any)?.sub ?? null;

  return (
    <main className="container mx-auto max-w-7xl py-5 sm:py-12 px-3 sm:px-6 space-y-8 sm:space-y-12 w-full min-w-0">
      {/* ====  Hero Section — Chic Feminine Editorial Style ==== */}
      <section className="relative mx-auto w-full max-w-3xl pt-4 sm:pt-8 pb-3 text-center flex flex-col items-center justify-start gap-4 sm:gap-6 px-3">
        {/* Subtle Brand Tagline */}
        <div className="animate-hero-entry">
          <p className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-pink-100 shadow-cartoon-sm text-[11px] sm:text-xs font-semibold tracking-wide text-foreground/75">
            <img
              src="/logo-icon.png"
              alt=""
              className="h-3.5 w-3.5 object-contain"
              aria-hidden
            />
            <span className="font-bold text-primary">Inspirasi Outfit Pilihan</span>
            <span className="text-foreground/30" aria-hidden>•</span>
            <span>Gaya Sehari-hari</span>
            <span className="text-foreground/30 hidden xs:inline" aria-hidden>•</span>
            <span className="hidden xs:inline">Padu Padan Mudah</span>
          </p>
        </div>

        {/* Headline — Natural, Elegant, Human-Curated */}
        <div className="space-y-3 sm:space-y-4 w-full">
          <h1 className="animate-hero-entry delay-1 text-3xl sm:text-5xl md:text-[3.5rem] font-bold tracking-tight font-jakarta leading-[1.15] text-foreground text-balance">
            Temukan Sentuhan{" "}
            <span className="text-primary italic font-serif font-normal">Gaya Terbaikmu</span>{" "}
            Setiap Hari
          </h1>
          <p className="animate-hero-entry delay-2 text-sm sm:text-base font-normal text-foreground/70 max-w-xl mx-auto leading-relaxed text-balance">
            Kurasi busana kasual, kantor, hingga hangout untuk wanita. Coba paduan outfit di Studio Kreasi dan temukan warna yang paling pas untukmu.
          </p>
        </div>
      </section>

      {/* ====  Feature Cards with 3D Physics Tilt & Scroll Reveal  ==== */}
      <ScrollReveal className={`grid grid-cols-1 ${isAdmin ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-5 sm:gap-6`}>
        <TiltCard className="reveal stagger-1 h-full">
          <GuestGuardLink
            href="/creator"
            isLoggedIn={isLoggedIn}
            className="group cartoon-card bg-white/90 p-6 sm:p-7 flex flex-col justify-between h-full hover:bg-white transition-all border-pink-100 shadow-cartoon relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
            <div className="space-y-4">
              <div className="icon-3d h-13 w-13 rounded-2xl border border-pink-200/80 bg-rose-50 flex items-center justify-center text-primary group-hover:rotate-6 group-hover:scale-105 transition-all shadow-cartoon-sm">
                <Brush className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl sm:text-2xl text-foreground font-jakarta tracking-tight group-hover:text-primary transition-colors">
                  Studio Padu Padan
                </h3>
                <p className="mt-2 text-sm font-normal text-foreground/70 leading-relaxed">
                  Eksplorasi kombinasi atasan, bawahan, dress, dan aksesori dengan visualisasi warna di ruang 3D interaktif.
                </p>
              </div>
            </div>
            <span className="text-sm font-bold text-primary mt-6 inline-flex items-center gap-2 group-hover:translate-x-1.5 transition-transform">
              Buka Studio Kreasi &rarr;
            </span>
          </GuestGuardLink>
        </TiltCard>

        <TiltCard className="reveal stagger-2 h-full">
          <GuestGuardLink
            href="/creator#advisor"
            isLoggedIn={isLoggedIn}
            className="group cartoon-card bg-white/90 p-6 sm:p-7 flex flex-col justify-between h-full hover:bg-white transition-all border-pink-100 shadow-cartoon relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
            <div className="space-y-4">
              <div className="icon-3d h-13 w-13 rounded-2xl border border-pink-200/80 bg-rose-50 flex items-center justify-center text-primary group-hover:-rotate-6 group-hover:scale-105 transition-all shadow-cartoon-sm">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl sm:text-2xl text-foreground font-jakarta tracking-tight group-hover:text-primary transition-colors">
                  Panduan Warna Kulit
                </h3>
                <p className="mt-2 text-sm font-normal text-foreground/70 leading-relaxed">
                  Temukan palet warna pakaian yang paling serasi dan memancarkan pesona alami dari tone kulitmu.
                </p>
              </div>
            </div>
            <span className="text-sm font-bold text-primary mt-6 inline-flex items-center gap-2 group-hover:translate-x-1.5 transition-transform">
              Lihat Rekomendasi Warna &rarr;
            </span>
          </GuestGuardLink>
        </TiltCard>

        {isAdmin && (
          <TiltCard className="reveal stagger-3 h-full">
            <Link
              href="/admin/categories"
              className="group cartoon-card bg-white/90 p-6 sm:p-7 flex flex-col justify-between h-full hover:bg-white transition-all border-pink-100 shadow-cartoon relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
              <div className="space-y-4">
                <div className="icon-3d h-13 w-13 rounded-2xl border border-border bg-purple-50 flex items-center justify-center text-purple-700 group-hover:rotate-6 group-hover:scale-105 transition-all shadow-cartoon-sm">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-xl sm:text-2xl text-foreground font-jakarta tracking-tight group-hover:text-purple-700 transition-colors">
                    Dasbor Kurator
                  </h3>
                  <p className="mt-2 text-sm font-normal text-foreground/70 leading-relaxed">
                    Kelola kategori busana, kurasi koleksi outfit, moderasi ulasan, dan pantau statistik platform.
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold text-purple-700 mt-6 inline-flex items-center gap-2 group-hover:translate-x-1.5 transition-transform">
                Kelola Platform &rarr;
              </span>
            </Link>
          </TiltCard>
        )}
      </ScrollReveal>

      {/* ====  Outfit Grid Feed with Category Filter  ==== */}
      <HomeClient outfits={displayOutfits} isLoggedIn={isLoggedIn} />

      {/* ====  Testimoni & Ulasan Pengguna (bintang 1-5)  ==== */}
      <Testimonials
        initialReviews={reviews}
        currentUserId={currentUserId}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
      />
    </main>
  );
}
