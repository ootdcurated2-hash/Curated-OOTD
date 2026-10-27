import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";


export default async function AnalyticsPage() {
  const supabase = await createClient();

  const [{ data: clicks }, { data: outfits }, { data: outfitItems }] = await Promise.all([
    supabase
      .from("click_events")
      .select("id, outfit_id, item_id, target_url, clicked_at")
      .order("clicked_at", { ascending: false }),
    supabase.from("outfits").select("id, title"),
    supabase.from("outfit_items").select("id, name, brand"),
  ]);

  const safeClicks = clicks ?? [];

  type ClickRow = { id: string; outfit_id: string | null; item_id: string | null; target_url: string | null; clicked_at: string };
  type OutfitRow = { id: string; title: string };
  type ItemRow = { id: string; name: string; brand: string | null };

  // Aggregate top outfits
  const outfitMap: Record<string, number> = {};
  safeClicks.forEach((c: ClickRow) => {
    if (c.outfit_id) outfitMap[c.outfit_id] = (outfitMap[c.outfit_id] ?? 0) + 1;
  });
  const topOutfits = Object.entries(outfitMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, count]) => ({
      id,
      title: (outfits as OutfitRow[] | null)?.find((o) => o.id === id)?.title ?? "Unknown Outfit",
      count,
    }));

  // Aggregate top items
  const itemMap: Record<string, number> = {};
  safeClicks.forEach((c: ClickRow) => {
    if (c.item_id) itemMap[c.item_id] = (itemMap[c.item_id] ?? 0) + 1;
  });
  const topItems = Object.entries(itemMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, count]) => ({
      id,
      name: (outfitItems as ItemRow[] | null)?.find((i) => i.id === id)?.name ?? "Unknown Product",
      brand: (outfitItems as ItemRow[] | null)?.find((i) => i.id === id)?.brand ?? "",
      count,
    }));

  return (
    <main className="container max-w-7xl py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white/80 backdrop-blur-md px-3.5 py-1.5 text-xs font-black text-foreground shadow-cartoon-sm hover:-translate-y-0.5 hover:shadow-cartoon transition-all mb-5"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Admin
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-secondary shadow-cartoon-sm">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-nunito tracking-tighter sm:text-3xl text-foreground">
              Analitik &amp; Statistik
            </h1>
            <p className="text-xs sm:text-sm font-bold text-foreground/70">
              Performa klik &amp; estimasi pendapatan afiliasi
            </p>
          </div>
        </div>
      </div>

      {/* Client component handles all new Date() logic & Excel Export */}
      <AnalyticsDashboard
        clicks={safeClicks}
        totalOutfits={outfits?.length ?? 0}
        topOutfits={topOutfits}
        topItems={topItems}
        outfitsList={(outfits as OutfitRow[]) ?? []}
        itemsList={(outfitItems as ItemRow[]) ?? []}
      />
    </main>
  );
}
