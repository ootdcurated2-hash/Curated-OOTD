import { createClient } from "@/lib/supabase/server";
import { normalizeOutfitItems } from "@/lib/outfitItems";
import type { Outfit } from "@/components/OutfitCard";
import HomeClient from "@/components/HomeClient";
import Link from "next/link";
import { ArrowLeft, Grid } from "lucide-react";
import { cookies } from "next/headers";
import { isUserAdmin } from "@/lib/admin";

export const metadata = {
  title: "Katalog Outfit Lengkap - My Curated OOTD",
  description: "Jelajahi seluruh katalog dan koleksi pakaian, padu padan OOTD, dan rekomendasi fashion terbaik.",
};

export default async function KatalogPage() {
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

  return (
    <main className="container mx-auto max-w-7xl py-6 sm:py-10 px-3 sm:px-6 space-y-6 sm:space-y-8 w-full min-w-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Beranda
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl border border-border bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-cartoon-sm">
              <Grid className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black font-nunito tracking-tight text-foreground">
                Katalog Outfit
              </h1>
              <p className="text-xs sm:text-sm text-foreground/70">
                Temukan seluruh inspirasi gaya, paduan fashion harian, dan rekomendasi kurasi kami.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-secondary border border-border text-foreground">
            Total {displayOutfits.length} Outfit
          </span>
        </div>
      </div>

      {/* Outfit Explorer with Filter & Search */}
      <HomeClient outfits={displayOutfits} isLoggedIn={isLoggedIn} />
    </main>
  );
}
