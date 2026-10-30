import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, ShoppingBag, Heart, User, Bot, Mail, MessageCircle, ArrowRight, Smartphone, Monitor } from "lucide-react";

export const metadata: Metadata = {
  title: "Pusat Bantuan – My Curated OOTD",
  description: "Panduan lengkap menggunakan My Curated OOTD — dari menelusuri outfit hingga cara belanja di marketplace.",
};

const guides = [
  {
    icon: Monitor,
    title: "Menelusuri Koleksi Outfit",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    iconBg: "bg-blue-500",
    steps: [
      "Buka halaman utama My Curated OOTD.",
      "Gulir ke bawah untuk melihat koleksi outfit terbaru.",
      "Gunakan filter tag untuk menyaring outfit berdasarkan kategori (Pria, Wanita, Kasual, dll).",
      "Klik kartu outfit untuk melihat detail dan hotspot interaktif produk.",
    ],
  },
  {
    icon: ShoppingBag,
    title: "Cara Belanja Produk",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    iconBg: "bg-emerald-500",
    steps: [
      "Buka halaman detail outfit yang kamu suka.",
      "Ketuk titik hotspot (●) pada gambar outfit untuk melihat produk terkait.",
      "Klik tombol 'Beli di [Marketplace]' untuk diarahkan ke toko.",
      "Lakukan pembelian langsung di marketplace (Shopee, Tokopedia, dll).",
    ],
  },
  {
    icon: Heart,
    title: "Menggunakan Fitur Favorit",
    color: "bg-pink-50 border-pink-200 text-pink-700",
    iconBg: "bg-primary",
    steps: [
      "Login atau daftar akun terlebih dahulu.",
      "Dari halaman utama, klik ikon hati di pojok kanan atas kartu outfit.",
      "Outfit tersimpan di halaman Favorit kamu.",
      "Akses Favorit melalui menu navigasi atau ikon hati di bottom bar (mobile).",
    ],
  },
  {
    icon: ShoppingBag,
    title: "Menggunakan Keranjang Belanja",
    color: "bg-orange-50 border-orange-200 text-orange-700",
    iconBg: "bg-orange-500",
    steps: [
      "Login atau daftar akun terlebih dahulu.",
      "Klik ikon keranjang belanja di kartu outfit untuk menambahkan ke keranjang.",
      "Buka halaman Keranjang melalui navigasi.",
      "Klik tombol 'Beli' di samping setiap item untuk langsung ke marketplace.",
    ],
  },
  {
    icon: Bot,
    title: "Menggunakan Tanya AI",
    color: "bg-purple-50 border-purple-200 text-purple-700",
    iconBg: "bg-purple-500",
    steps: [
      "Login ke akun kamu terlebih dahulu.",
      "Klik menu 'Tanya AI' di navigasi atas atau bottom bar (mobile).",
      "Ketik pertanyaan seputar fashion, gaya, atau rekomendasi outfit.",
      "AI akan memberikan saran yang dipersonalisasi untuk kamu.",
    ],
  },
  {
    icon: User,
    title: "Mengelola Akun",
    color: "bg-gray-50 border-gray-200 text-gray-700",
    iconBg: "bg-gray-600",
    steps: [
      "Klik menu 'Masuk' untuk login atau daftar akun baru.",
      "Gunakan email atau akun Google untuk autentikasi.",
      "Setelah login, klik menu 'Akun' untuk melihat profil dan pengaturan.",
      "Kamu bisa logout melalui halaman Akun.",
    ],
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-white to-pink-50/50 py-16 sm:py-24 px-4">
        <div className="container max-w-3xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-black text-primary uppercase tracking-widest">
            <LifeBuoy className="h-3.5 w-3.5" /> Pusat Bantuan
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter font-nunito text-foreground">
            Bagaimana Kami <span className="text-primary">Bisa Membantu?</span>
          </h1>
          <p className="text-base font-semibold text-foreground/60 max-w-xl mx-auto">
            Panduan lengkap untuk menggunakan semua fitur My Curated OOTD dengan mudah.
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 px-4 bg-white border-b border-border/60">
        <div className="container max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            {guides.map((g) => (
              <a
                key={g.title}
                href={`#${g.title.toLowerCase().replace(/\s+/g, "-")}`}
                className="rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-xs font-bold text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
              >
                {g.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Guides */}
      <section className="py-12 sm:py-16 px-4">
        <div className="container max-w-4xl mx-auto space-y-6">
          {guides.map((guide) => {
            const Icon = guide.icon;
            return (
              <div
                key={guide.title}
                id={guide.title.toLowerCase().replace(/\s+/g, "-")}
                className={`rounded-2xl border p-6 sm:p-8 space-y-5 ${guide.color}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${guide.iconBg}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-lg font-black font-nunito text-foreground">{guide.title}</h2>
                </div>
                <ol className="space-y-3">
                  {guide.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-white border border-current/20 flex items-center justify-center text-[11px] font-black text-current">
                        {i + 1}
                      </span>
                      <p className="text-sm font-semibold text-foreground/80 leading-relaxed pt-0.5">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hubungi Kami */}
      <section className="py-12 px-4 bg-secondary/30">
        <div className="container max-w-3xl mx-auto">
          <div className="rounded-3xl border border-border bg-white p-8 sm:p-10 text-center space-y-5">
            <LifeBuoy className="h-12 w-12 text-primary mx-auto" />
            <div>
              <h2 className="text-2xl font-black font-nunito text-foreground">Masih Butuh Bantuan?</h2>
              <p className="text-sm font-semibold text-foreground/60 mt-2">
                Tim kami siap menjawab pertanyaanmu setiap hari.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:ootdcurated@gmail.com"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-xs font-black text-foreground hover:border-primary hover:text-primary transition-all shadow-sm"
              >
                <Mail className="h-4 w-4" /> ootdcurated@gmail.com
              </a>
              <a
                href="https://wa.me/62895326595608"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 text-white px-5 py-2.5 text-xs font-black hover:bg-emerald-600 transition-all shadow-sm"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
            <div className="pt-2">
              <Link
                href="/faq"
                className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline"
              >
                Lihat FAQ Lengkap <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
