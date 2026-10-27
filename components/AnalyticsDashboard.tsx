"use client";

import {
  MousePointerClick,
  TrendingUp,
  Shirt,
  ShoppingBag,
  Calendar,
  Activity,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import ExcelJS from "exceljs";

interface ClickEvent {
  id: string;
  outfit_id: string | null;
  item_id: string | null;
  target_url: string | null;
  clicked_at: string;
}

interface OutfitStat {
  id: string;
  title: string;
  count: number;
}

interface ItemStat {
  id: string;
  name: string;
  brand: string;
  count: number;
}

interface Props {
  clicks: ClickEvent[];
  totalOutfits: number;
  topOutfits: OutfitStat[];
  topItems: ItemStat[];
  outfitsList?: { id: string; title: string }[];
  itemsList?: { id: string; name: string; brand: string | null }[];
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accentBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  accentBg?: string;
}) {
  return (
    <div className={`cartoon-card ${accentBg ?? "bg-white/60 backdrop-blur-xl"} p-5 sm:p-6 space-y-2`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-foreground">
          {label}
        </span>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-white shadow-cartoon-sm">
          {icon}
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-black font-nunito text-foreground tracking-tighter">
        {value}
      </div>
      {sub && <p className="text-xs font-bold text-foreground/70">{sub}</p>}
    </div>
  );
}

function BarChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex h-44 items-end gap-2 pt-6">
      {data.map((d, i) => {
        const pct = Math.round((d.count / max) * 100);
        return (
          <div key={i} className="group flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[10px] font-black text-foreground opacity-0 transition-opacity group-hover:opacity-100">
              {d.count}
            </span>
            <div className="relative w-full overflow-hidden rounded-t-2xl bg-primary/5 border border-border border-b-0 h-32 flex items-end">
              <div
                className="w-full bg-primary transition-all duration-700"
                style={{ height: `${Math.max(pct, pct > 0 ? 8 : 0)}%` }}
              />
            </div>
            <span className="text-[10px] font-black text-foreground leading-tight text-center">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsDashboard({
  clicks,
  totalOutfits,
  topOutfits,
  topItems,
  outfitsList = [],
  itemsList = [],
}: Props) {
  const [isExporting, setIsExporting] = useState(false);

  // All new Date() calls happen here on the client — safe from prerender
  const now = new Date();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalClicks = clicks.length;
  const todayClicks = clicks.filter((c) => new Date(c.clicked_at) >= todayStart).length;
  const monthClicks = clicks.filter((c) => new Date(c.clicked_at) >= monthStart).length;
  const estimatedRevenue = Math.round(totalClicks * 0.02 * 150_000);

  // Build 7-day chart data
  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - i));
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    const count = clicks.filter((c) => {
      const t = new Date(c.clicked_at);
      return t >= dayStart && t < dayEnd;
    }).length;
    return {
      label: date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" }),
      count,
    };
  });

  const maxDaily = Math.max(...dailyData.map((d) => d.count), 0);

  const todayLabel = now.toLocaleDateString("id-ID", { day: "numeric", month: "long" });
  const monthLabel = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const handleExportToExcel = async () => {
    try {
      setIsExporting(true);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "My Curated OOTD";
      workbook.created = new Date();

      // Theme Colors (ARGB format for ExcelJS)
      const COLOR_PRIMARY = "FFFF4FA8";       // Hot pink #ff4fa8
      const COLOR_HEADER_BG = "FFFFE5EE";      // Light pink tint
      const COLOR_DARK_BG = "FF2D1A25";        // Dark slate pink
      const COLOR_ZEBRA = "FFFFF7FA";          // Very light pink
      const COLOR_BORDER = "FFE0D0D8";         // Soft gray-pink border

      const thinBorder: Partial<ExcelJS.Borders> = {
        top: { style: "thin", color: { argb: COLOR_BORDER } },
        left: { style: "thin", color: { argb: COLOR_BORDER } },
        bottom: { style: "thin", color: { argb: COLOR_BORDER } },
        right: { style: "thin", color: { argb: COLOR_BORDER } },
      };

      // Helper function to style a title banner
      const applyTitleBanner = (sheet: ExcelJS.Worksheet, title: string, subtitle?: string) => {
        sheet.mergeCells("A1:E1");
        const titleCell = sheet.getCell("A1");
        titleCell.value = `👗  ${title}`;
        titleCell.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
        titleCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: COLOR_DARK_BG },
        };
        titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
        sheet.getRow(1).height = 36;

        if (subtitle) {
          sheet.mergeCells("A2:E2");
          const subCell = sheet.getCell("A2");
          subCell.value = subtitle;
          subCell.font = { name: "Segoe UI", size: 10, italic: true, color: { argb: "FF666666" } };
          subCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFBF6F8" },
          };
          subCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
          sheet.getRow(2).height = 24;
        }
      };

      // Helper function to style table headers
      const styleHeaderRow = (row: ExcelJS.Row) => {
        row.height = 26;
        row.eachCell((cell) => {
          cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: COLOR_PRIMARY },
          };
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.border = thinBorder;
        });
      };

      // ==========================================
      // SHEET 1: RINGKASAN EKSEKUTIF
      // ==========================================
      const wsSummary = workbook.addWorksheet("Ringkasan Eksekutif", {
        views: [{ showGridLines: true }],
      });
      applyTitleBanner(
        wsSummary,
        "LAPORAN ANALITIK & PERFORMA - MY CURATED OOTD",
        `Diekspor pada: ${now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} pukul ${now.toLocaleTimeString("id-ID")}`
      );

      // Section 1 Header
      wsSummary.getCell("A4").value = "1. RINGKASAN METRIK UTAMA";
      wsSummary.getCell("A4").font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF2D1A25" } };
      wsSummary.getRow(4).height = 24;

      const summaryTableHeaders = ["No", "Indikator / Metrik", "Nilai Performa", "Satuan", "Keterangan & Estimasi"];
      const hRow1 = wsSummary.addRow(summaryTableHeaders);
      styleHeaderRow(hRow1);

      const summaryMetrics = [
        [1, "Total Klik Keseluruhan", totalClicks, "Klik", "Akumulasi klik afiliasi sepanjang waktu"],
        [2, "Klik Hari Ini", todayClicks, "Klik", `Periode: ${todayLabel}`],
        [3, "Klik Bulan Ini", monthClicks, "Klik", `Periode: ${monthLabel}`],
        [4, "Estimasi Pendapatan Afiliasi", `Rp ${estimatedRevenue.toLocaleString("id-ID")}`, "IDR", "Asumsi estimasi konversi 2% × Rp 150.000"],
        [5, "Total Koleksi Outfit Aktif", totalOutfits, "Outfit", "Jumlah item busana aktif di katalog"],
      ];

      summaryMetrics.forEach((item, idx) => {
        const row = wsSummary.addRow(item);
        row.height = 22;
        row.eachCell((cell, colNum) => {
          cell.font = { name: "Segoe UI", size: 10 };
          cell.border = thinBorder;
          if (idx % 2 === 1) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ZEBRA } };
          }
          if (colNum === 1 || colNum === 4) cell.alignment = { horizontal: "center", vertical: "middle" };
          else if (colNum === 3) {
            cell.alignment = { horizontal: "right", vertical: "middle" };
            cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF0E6251" } };
          } else {
            cell.alignment = { horizontal: "left", vertical: "middle" };
          }
        });
      });

      // Section 2: Top 3 Outfits
      wsSummary.addRow([]);
      const s2Row = wsSummary.addRow(["2. TOP 3 OUTFIT DENGAN TRAFIK TERTINGGI"]);
      s2Row.getCell(1).font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF2D1A25" } };
      s2Row.height = 24;

      const hRow2 = wsSummary.addRow(["Peringkat", "Nama / Judul Outfit", "Total Klik", "Status"]);
      styleHeaderRow(hRow2);

      const topOutfitsSlice = topOutfits.slice(0, 3);
      if (topOutfitsSlice.length === 0) {
        const r = wsSummary.addRow(["-", "Belum ada klik outfit tercatat", 0, "Menunggu Pengunjung"]);
        r.eachCell((c) => { c.border = thinBorder; c.font = { name: "Segoe UI", size: 10 }; });
      } else {
        topOutfitsSlice.forEach((o, idx) => {
          const r = wsSummary.addRow([`Juara ${idx + 1}`, o.title, `${o.count} Klik`, idx === 0 ? "🔥 Paling Populer" : "Populer"]);
          r.height = 22;
          r.eachCell((c, colNum) => {
            c.border = thinBorder;
            c.font = { name: "Segoe UI", size: 10 };
            if (colNum === 1 || colNum === 4) c.alignment = { horizontal: "center", vertical: "middle" };
            else if (colNum === 3) {
              c.alignment = { horizontal: "right", vertical: "middle" };
              c.font = { name: "Segoe UI", size: 10, bold: true };
            }
          });
        });
      }

      // Section 3: Top 3 Products
      wsSummary.addRow([]);
      const s3Row = wsSummary.addRow(["3. TOP 3 PRODUK SHOP THE LOOK TERPOPULER"]);
      s3Row.getCell(1).font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF2D1A25" } };
      s3Row.height = 24;

      const hRow3 = wsSummary.addRow(["Peringkat", "Nama Produk", "Brand", "Total Klik"]);
      styleHeaderRow(hRow3);

      const topItemsSlice = topItems.slice(0, 3);
      if (topItemsSlice.length === 0) {
        const r = wsSummary.addRow(["-", "Belum ada klik produk tercatat", "-", 0]);
        r.eachCell((c) => { c.border = thinBorder; c.font = { name: "Segoe UI", size: 10 }; });
      } else {
        topItemsSlice.forEach((item, idx) => {
          const r = wsSummary.addRow([`Juara ${idx + 1}`, item.name, item.brand || "-", `${item.count} Klik`]);
          r.height = 22;
          r.eachCell((c, colNum) => {
            c.border = thinBorder;
            c.font = { name: "Segoe UI", size: 10 };
            if (colNum === 1) c.alignment = { horizontal: "center", vertical: "middle" };
            else if (colNum === 4) {
              c.alignment = { horizontal: "right", vertical: "middle" };
              c.font = { name: "Segoe UI", size: 10, bold: true };
            }
          });
        });
      }

      wsSummary.columns = [
        { width: 14 },
        { width: 38 },
        { width: 24 },
        { width: 16 },
        { width: 45 },
      ];

      // ==========================================
      // SHEET 2: TREN KLIK 7 HARI TERAKHIR
      // ==========================================
      const wsTrend = workbook.addWorksheet("Tren 7 Hari", { views: [{ showGridLines: true }] });
      applyTitleBanner(wsTrend, "TREN PERFORMA KLIK HARIAN (7 HARI TERAKHIR)", `Puncak Trafik: ${maxDaily} klik`);

      wsTrend.addRow([]);
      const hTrend = wsTrend.addRow(["No", "Hari & Tanggal", "Jumlah Klik", "Status Performa"]);
      styleHeaderRow(hTrend);

      dailyData.forEach((d, idx) => {
        let status = "Stabil";
        if (d.count === maxDaily && maxDaily > 0) status = "🔥 Puncak Tertinggi";
        else if (d.count === 0) status = "Belum Ada Klik";

        const r = wsTrend.addRow([idx + 1, d.label, d.count, status]);
        r.height = 22;
        r.eachCell((c, colNum) => {
          c.border = thinBorder;
          c.font = { name: "Segoe UI", size: 10 };
          if (idx % 2 === 1) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ZEBRA } };
          if (colNum === 1) c.alignment = { horizontal: "center", vertical: "middle" };
          else if (colNum === 3) {
            c.alignment = { horizontal: "right", vertical: "middle" };
            c.font = { name: "Segoe UI", size: 10, bold: true };
          } else {
            c.alignment = { horizontal: "left", vertical: "middle" };
          }
        });
      });

      wsTrend.columns = [
        { width: 8 },
        { width: 28 },
        { width: 18 },
        { width: 26 },
      ];

      // ==========================================
      // SHEET 3: SEMUA OUTFIT TERPOPULER
      // ==========================================
      const wsOutfit = workbook.addWorksheet("Outfit Terpopuler", { views: [{ showGridLines: true }] });
      applyTitleBanner(wsOutfit, "PERINGKAT OUTFIT TERPOPULER", "Koleksi busana dengan interaksi tertinggi");

      wsOutfit.addRow([]);
      const hOutfit = wsOutfit.addRow(["Peringkat", "ID Outfit", "Nama / Judul Outfit", "Jumlah Klik", "Kontribusi (%)"]);
      styleHeaderRow(hOutfit);

      if (topOutfits.length === 0) {
        const r = wsOutfit.addRow(["-", "-", "Belum ada klik outfit", 0, "0%"]);
        r.eachCell((c) => { c.border = thinBorder; c.font = { name: "Segoe UI", size: 10 }; });
      } else {
        topOutfits.forEach((o, idx) => {
          const pct = totalClicks > 0 ? ((o.count / totalClicks) * 100).toFixed(1) + "%" : "0%";
          const r = wsOutfit.addRow([idx + 1, o.id, o.title, o.count, pct]);
          r.height = 22;
          r.eachCell((c, colNum) => {
            c.border = thinBorder;
            c.font = { name: "Segoe UI", size: 10 };
            if (idx % 2 === 1) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ZEBRA } };
            if (colNum === 1 || colNum === 5) c.alignment = { horizontal: "center", vertical: "middle" };
            else if (colNum === 4) {
              c.alignment = { horizontal: "right", vertical: "middle" };
              c.font = { name: "Segoe UI", size: 10, bold: true };
            }
          });
        });
      }

      wsOutfit.columns = [
        { width: 12 },
        { width: 38 },
        { width: 44 },
        { width: 18 },
        { width: 18 },
      ];

      // ==========================================
      // SHEET 4: SEMUA PRODUK TERPOPULER
      // ==========================================
      const wsItem = workbook.addWorksheet("Produk Terpopuler", { views: [{ showGridLines: true }] });
      applyTitleBanner(wsItem, "PERINGKAT PRODUK FASHION TERPOPULER", "Item spesifik yang paling diminati pengunjung");

      wsItem.addRow([]);
      const hItem = wsItem.addRow(["Peringkat", "ID Produk", "Nama Produk", "Brand", "Jumlah Klik", "Kontribusi (%)"]);
      styleHeaderRow(hItem);

      if (topItems.length === 0) {
        const r = wsItem.addRow(["-", "-", "Belum ada klik produk", "-", 0, "0%"]);
        r.eachCell((c) => { c.border = thinBorder; c.font = { name: "Segoe UI", size: 10 }; });
      } else {
        topItems.forEach((item, idx) => {
          const pct = totalClicks > 0 ? ((item.count / totalClicks) * 100).toFixed(1) + "%" : "0%";
          const r = wsItem.addRow([idx + 1, item.id, item.name, item.brand || "-", item.count, pct]);
          r.height = 22;
          r.eachCell((c, colNum) => {
            c.border = thinBorder;
            c.font = { name: "Segoe UI", size: 10 };
            if (idx % 2 === 1) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ZEBRA } };
            if (colNum === 1 || colNum === 6) c.alignment = { horizontal: "center", vertical: "middle" };
            else if (colNum === 5) {
              c.alignment = { horizontal: "right", vertical: "middle" };
              c.font = { name: "Segoe UI", size: 10, bold: true };
            }
          });
        });
      }

      wsItem.columns = [
        { width: 12 },
        { width: 38 },
        { width: 40 },
        { width: 22 },
        { width: 18 },
        { width: 18 },
      ];

      // ==========================================
      // SHEET 5: DETAIL LOG RIWAYAT KLIK
      // ==========================================
      const wsLogs = workbook.addWorksheet("Log Klik Detail", { views: [{ showGridLines: true }] });
      applyTitleBanner(wsLogs, "LOG AUDIT RIWAYAT KLIK DETAIL", `Total Rekaman: ${clicks.length} Klik`);

      wsLogs.addRow([]);
      const hLogs = wsLogs.addRow(["No", "ID Event Klik", "Nama Outfit", "Nama Produk & Brand", "URL Tujuan", "Waktu Klik (WIB)"]);
      styleHeaderRow(hLogs);

      const outfitLookup = new Map(outfitsList.map((o) => [o.id, o.title]));
      const itemLookup = new Map(itemsList.map((i) => [i.id, `${i.name}${i.brand ? ` (${i.brand})` : ""}`]));

      if (clicks.length === 0) {
        const r = wsLogs.addRow(["-", "-", "Belum ada rekaman klik", "-", "-", "-"]);
        r.eachCell((c) => { c.border = thinBorder; c.font = { name: "Segoe UI", size: 10 }; });
      } else {
        clicks.forEach((c, idx) => {
          const r = wsLogs.addRow([
            idx + 1,
            c.id,
            c.outfit_id ? (outfitLookup.get(c.outfit_id) || c.outfit_id) : "-",
            c.item_id ? (itemLookup.get(c.item_id) || c.item_id) : "-",
            c.target_url || "-",
            new Date(c.clicked_at).toLocaleString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          ]);
          r.height = 20;
          r.eachCell((cell, colNum) => {
            cell.border = thinBorder;
            cell.font = { name: "Segoe UI", size: 9.5 };
            if (idx % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ZEBRA } };
            if (colNum === 1) cell.alignment = { horizontal: "center", vertical: "middle" };
            else if (colNum === 6) cell.alignment = { horizontal: "center", vertical: "middle" };
          });
        });
      }

      wsLogs.columns = [
        { width: 8 },
        { width: 38 },
        { width: 35 },
        { width: 35 },
        { width: 45 },
        { width: 24 },
      ];

      // Download file ke browser via Blob
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const dateStr = now.toISOString().split("T")[0];
      anchor.download = `Laporan-Analitik-CuratedOOTD-${dateStr}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      anchor.remove();
    } catch (err) {
      console.error("Gagal mengekspor data ke Excel:", err);
      alert("Terjadi kesalahan saat memproses laporan Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar (Download Excel) - Compact & Elegant */}
      <div className="inline-flex flex-wrap items-center justify-between gap-3 cartoon-card bg-white/90 backdrop-blur-md px-4 py-2.5 border border-pink-200/80 shadow-cartoon-sm max-w-full">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 shadow-xs shrink-0">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black font-nunito tracking-tight text-foreground">
              Ekspor Laporan
            </span>
            <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 border border-emerald-200/80">
              Excel .xlsx
            </span>
          </div>
        </div>

        <button
          onClick={handleExportToExcel}
          disabled={isExporting}
          className="cartoon-btn inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs px-3.5 py-1.5 rounded-full shadow-cartoon-sm transition-all disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" />
              <span>Download Excel</span>
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<MousePointerClick className="h-5 w-5 text-primary" />}
          label="Total Klik"
          value={totalClicks.toLocaleString("id-ID")}
          sub="Sepanjang waktu"
          accentBg="bg-white/60 backdrop-blur-xl"
        />
        <StatCard
          icon={<Activity className="h-5 w-5 text-primary/70" />}
          label="Klik Hari Ini"
          value={todayClicks.toLocaleString("id-ID")}
          sub={todayLabel}
          accentBg="bg-secondary/50 backdrop-blur-xl"
        />
        <StatCard
          icon={<Calendar className="h-5 w-5 text-cartoon-purple" />}
          label="Klik Bulan Ini"
          value={monthClicks.toLocaleString("id-ID")}
          sub={monthLabel}
          accentBg="bg-primary/5 backdrop-blur-xl"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          label="Estimasi Komisi"
          value={`Rp ${estimatedRevenue.toLocaleString("id-ID")}`}
          sub="Asumsi 2% × Rp 150rb rata-rata"
          accentBg="bg-primary/10 backdrop-blur-xl"
        />
      </div>

      {/* 7-Day Chart */}
      <div className="cartoon-card bg-white/60 backdrop-blur-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black font-nunito text-foreground">
              Klik 7 Hari Terakhir
            </h2>
            <p className="text-xs font-bold text-foreground/70">Puncak: {maxDaily} klik</p>
          </div>
          <span className="rounded-full border border-border bg-primary/5 px-3 py-1 text-xs font-black text-foreground shadow-cartoon-sm">
            7 Hari Terakhir
          </span>
        </div>
        {totalClicks === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-foreground/60">
            Belum ada data klik. Klik produk di koleksi untuk melihat grafik performa.
          </div>
        ) : (
          <BarChart data={dailyData} />
        )}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Outfits */}
        <div className="cartoon-card bg-white/60 backdrop-blur-xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-secondary">
              <Shirt className="h-4 w-4 text-foreground" />
            </div>
            <h2 className="font-black font-nunito text-base text-foreground">Outfit Terpopuler</h2>
          </div>
          {topOutfits.length === 0 ? (
            <p className="py-8 text-center text-xs font-bold text-foreground/60">Belum ada data klik outfit.</p>
          ) : (
            <div className="space-y-2.5">
              {topOutfits.map((o, i) => (
                <div key={o.id} className="flex items-center gap-3 rounded-2xl border border-border bg-primary/5 px-4 py-3 shadow-cartoon-sm">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-primary text-xs font-black text-white">
                    {i + 1}
                  </span>
                  <p className="flex-1 truncate text-xs sm:text-sm font-black text-foreground">{o.title}</p>
                  <div className="flex items-center gap-1.5 flex-shrink-0 bg-white px-2.5 py-1 rounded-lg border border-border">
                    <MousePointerClick className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-black text-foreground">{o.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="cartoon-card bg-white/60 backdrop-blur-xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-primary/20">
              <ShoppingBag className="h-4 w-4 text-foreground" />
            </div>
            <h2 className="font-black font-nunito text-base text-foreground">Produk Terpopuler</h2>
          </div>
          {topItems.length === 0 ? (
            <p className="py-8 text-center text-xs font-bold text-foreground/60">Belum ada data klik produk.</p>
          ) : (
            <div className="space-y-2.5">
              {topItems.map((it, i) => (
                <div key={it.id} className="flex items-center gap-3 rounded-2xl border border-border bg-primary/5 px-4 py-3 shadow-cartoon-sm">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-primary/20 text-xs font-black text-foreground">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs sm:text-sm font-black text-foreground">{it.name}</p>
                    {it.brand && <p className="text-[11px] font-bold text-foreground/70">{it.brand}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 bg-white px-2.5 py-1 rounded-lg border border-border">
                    <MousePointerClick className="h-3.5 w-3.5 text-primary/70" />
                    <span className="text-xs font-black text-foreground">{it.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Outfits summary */}
      <div className="cartoon-card bg-white/60 backdrop-blur-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-secondary">
              <Shirt className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <span className="font-black font-nunito text-base text-foreground block">Total Outfit Aktif</span>
              <span className="text-xs font-bold text-foreground/70">Outfit yang siap dikurasi dan dilihat pengunjung</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-black font-nunito text-foreground">{totalOutfits}</span>
            <Link
              href="/admin/outfit/new"
              className="cartoon-btn inline-flex items-center gap-1.5 bg-primary px-5 py-2 text-xs font-black text-white"
            >
              + Tambah Outfit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}