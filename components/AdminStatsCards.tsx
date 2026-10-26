"use client";

import { MousePointerClick, TrendingUp, ShoppingBag, Sparkles } from "lucide-react";

interface Props {
  totalOutfits: number;
  totalClicks: number;
  clicks: { id: string; clicked_at: string }[];
}

export default function AdminStatsCards({ totalOutfits, totalClicks, clicks }: Props) {
  // All new Date() calls happen on the client — safe from prerender
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentClicks = clicks.filter(
    (c) => new Date(c.clicked_at) >= sevenDaysAgo
  ).length;

  const estimatedCommission = totalClicks * 1500;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Lookbook */}
      <div className="group cartoon-card bg-white/80 backdrop-blur-xl p-5 space-y-2 relative overflow-hidden border-border hover:shadow-cartoon transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-pink-400" />
        <div className="flex items-center justify-between text-foreground/70">
          <span className="text-xs font-black uppercase tracking-wider text-foreground">Total Outfit</span>
          <div className="icon-3d flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-pink-500 to-primary text-white shadow-cartoon-sm group-hover:scale-110 group-hover:rotate-6 transition-all">
            <ShoppingBag className="h-5 w-5" />
          </div>
        </div>
        <div className="stat-number text-3xl font-black font-nunito tracking-tighter">{totalOutfits}</div>
        <p className="text-xs font-bold text-foreground/70">Koleksi aktif di feed</p>
      </div>

      {/* Total Klik Afiliasi */}
      <div className="group cartoon-card bg-white/80 backdrop-blur-xl p-5 space-y-2 relative overflow-hidden border-border hover:shadow-cartoon transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-teal-400" />
        <div className="flex items-center justify-between text-foreground/70">
          <span className="text-xs font-black uppercase tracking-wider text-foreground">Total Klik Produk</span>
          <div className="icon-3d flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-teal-50 to-teal-100 text-accent shadow-cartoon-sm group-hover:scale-110 group-hover:-rotate-6 transition-all">
            <MousePointerClick className="h-5 w-5" />
          </div>
        </div>
        <div className="stat-number text-3xl font-black font-nunito tracking-tighter">{totalClicks}</div>
        <p className="text-xs font-bold text-foreground/70">Pengunjung ke marketplace</p>
      </div>

      {/* Klik 7 Hari Terakhir */}
      <div className="group cartoon-card bg-white/80 backdrop-blur-xl p-5 space-y-2 relative overflow-hidden border-border hover:shadow-cartoon transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-400" />
        <div className="flex items-center justify-between text-foreground/70">
          <span className="text-xs font-black uppercase tracking-wider text-foreground">Tren Minggu Ini</span>
          <div className="icon-3d flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 shadow-cartoon-sm group-hover:scale-110 group-hover:rotate-6 transition-all">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
        <div className="stat-number text-3xl font-black font-nunito tracking-tighter">{recentClicks}</div>
        <p className="text-xs font-bold text-foreground/70">Interaksi 7 hari terakhir</p>
      </div>

      {/* Est. Komisi Afiliasi */}
      <div className="group cartoon-card bg-white/80 backdrop-blur-xl p-5 space-y-2 relative overflow-hidden border-border hover:shadow-cartoon transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cartoon-purple to-indigo-400" />
        <div className="flex items-center justify-between text-foreground/70">
          <span className="text-xs font-black uppercase tracking-wider text-foreground">Est. Komisi</span>
          <div className="icon-3d flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-purple-50 to-purple-100 text-cartoon-purple shadow-cartoon-sm group-hover:scale-110 group-hover:-rotate-6 transition-all">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
        <div className="stat-number text-2xl sm:text-3xl font-black font-nunito tracking-tighter">
          Rp {estimatedCommission.toLocaleString("id-ID")}
        </div>
        <p className="text-xs font-bold text-foreground/70">Estimasi konversi komisi</p>
      </div>
    </div>
  );
}