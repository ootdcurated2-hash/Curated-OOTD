import SkinToneAdvisor from "@/components/SkinToneAdvisor";
import Link from "next/link";
import { Bot } from "lucide-react";

export default function CreatorPage() {
  return (
    <main className="container max-w-5xl py-8 px-4 sm:px-6 space-y-10">
      <div className="space-y-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-black text-foreground shadow-cartoon-sm mb-3 hover:-translate-y-1 hover:shadow-cartoon active:scale-95 transition-all"
        >
          &larr; Kembali ke Galeri
        </Link>
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-secondary text-foreground px-3 py-0.5 rounded-full border border-border shadow-cartoon-sm">
            <Bot className="h-3 w-3 text-primary" />
            Konsultasi Gaya dengan AI
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black font-nunito tracking-tighter text-foreground pt-1">
          Tanya AI Outfit ✨
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-foreground/75 max-w-2xl leading-relaxed">
          Tanyakan apa saja tentang outfit, warna busana, paduan gaya, atau rekomendasi berdasarkan warna kulit — AI siap membantu!
        </p>
      </div>

      {/* AI Fashion Advisor */}
      <SkinToneAdvisor />
    </main>
  );
}
