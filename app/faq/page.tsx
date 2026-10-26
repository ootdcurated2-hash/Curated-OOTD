import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, ChevronDown, MessageCircle, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ – My Curated OOTD",
  description: "Pertanyaan yang sering ditanyakan seputar My Curated OOTD — cara kerja platform, keranjang, favorit, dan cara berbelanja.",
};

const faqs = [
  {
    category: "Umum",
    color: "text-primary bg-primary/10",
    items: [
      {
        q: "Apa itu My Curated OOTD?",
        a: "My Curated OOTD adalah platform inspirasi fashion yang menyajikan koleksi outfit kurasi harian. Setiap outfit dilengkapi hotspot interaktif yang mengarahkan kamu langsung ke produk di marketplace seperti Shopee, Tokopedia, dan lainnya.",
      },
      {
        q: "Apakah My Curated OOTD gratis?",
        a: "Ya, sepenuhnya gratis! Kamu bisa menelusuri semua koleksi outfit, menyimpan favorit, dan menggunakan fitur keranjang tanpa biaya apapun. Pembelian produk dilakukan langsung di marketplace terkait.",
      },
      {
        q: "Apakah saya perlu daftar untuk menggunakan layanan ini?",
        a: "Kamu bisa menelusuri koleksi outfit tanpa daftar. Namun, untuk menyimpan favorit, menggunakan keranjang belanja, dan mengakses fitur Tanya AI, kamu perlu membuat akun terlebih dahulu.",
      },
    ],
  },
  {
    category: "Berbelanja",
    color: "text-emerald-700 bg-emerald-100",
    items: [
      {
        q: "Bagaimana cara membeli produk dari outfit?",
        a: "Klik outfit yang kamu suka, lalu ketuk hotspot (titik interaktif) pada gambar. Kamu akan diarahkan ke halaman produk di marketplace terkait (Shopee, Tokopedia, dll) untuk melakukan pembelian langsung di sana.",
      },
      {
        q: "Apakah My Curated OOTD menjual produk sendiri?",
        a: "Tidak. Kami adalah platform kurasi — semua produk dijual oleh toko/seller di marketplace terpercaya. Transaksi sepenuhnya dilakukan di marketplace tersebut, bukan di platform kami.",
      },
      {
        q: "Apa fungsi Keranjang Belanja di My Curated OOTD?",
        a: "Keranjang berfungsi sebagai \"daftar simpan sementara\" outfit yang ingin kamu beli. Dari keranjang, kamu bisa langsung klik tombol Beli untuk diarahkan ke marketplace. Harga yang tampil adalah estimasi dari produk dalam outfit tersebut.",
      },
      {
        q: "Mengapa harga di keranjang menampilkan 'Harga di Toko'?",
        a: "Harga beberapa produk tidak selalu tersedia di sistem kami. Jika tertulis 'Harga di Toko', kunjungi link marketplace untuk melihat harga terkini. Harga bisa berubah sewaktu-waktu sesuai kebijakan toko.",
      },
    ],
  },
  {
    category: "Akun & Favorit",
    color: "text-pink-700 bg-pink-100",
    items: [
      {
        q: "Bagaimana cara menyimpan outfit ke Favorit?",
        a: "Klik ikon hati di pojok kanan atas kartu outfit. Outfit akan tersimpan di halaman Favorit kamu. Fitur ini membutuhkan akun yang sudah login.",
      },
      {
        q: "Apakah data favorit dan keranjang saya tersimpan permanen?",
        a: "Data favorit tersimpan di akun Supabase kamu (persisten di semua perangkat). Data keranjang tersimpan secara lokal di browser (localStorage) — jika kamu ganti browser atau hapus data browser, keranjang akan kosong.",
      },
      {
        q: "Bagaimana cara login/daftar akun?",
        a: "Klik tombol 'Masuk' di navigasi atas atau bawah (mobile). Kamu bisa daftar dengan email atau login menggunakan akun Google.",
      },
    ],
  },
  {
    category: "Tanya AI",
    color: "text-purple-700 bg-purple-100",
    items: [
      {
        q: "Apa itu fitur Tanya AI?",
        a: "Tanya AI adalah fitur asisten fashion berbasis kecerdasan buatan yang bisa kamu ajak bicara soal gaya, rekomendasi outfit, tips mix & match, dan berbagai pertanyaan seputar fashion.",
      },
      {
        q: "Apakah Tanya AI gratis?",
        a: "Tanya AI tersedia untuk pengguna yang sudah login. Akses fitur ini melalui menu Tanya AI di navigasi.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-white to-pink-50/50 py-16 sm:py-24 px-4">
        <div className="container max-w-3xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-black text-primary uppercase tracking-widest">
            <HelpCircle className="h-3.5 w-3.5" /> FAQ
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter font-nunito text-foreground">
            Pertanyaan yang <span className="text-primary">Sering Ditanya</span>
          </h1>
          <p className="text-base font-semibold text-foreground/60 max-w-xl mx-auto">
            Temukan jawaban atas pertanyaan umum seputar My Curated OOTD di sini.
          </p>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-12 sm:py-16 px-4">
        <div className="container max-w-3xl mx-auto space-y-10">
          {faqs.map((section) => (
            <div key={section.category} className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest ${section.color}`}>
                  {section.category}
                </span>
              </div>
              <div className="space-y-3">
                {section.items.map((item, i) => (
                  <details
                    key={i}
                    className="group rounded-2xl border border-border bg-white overflow-hidden hover:border-primary/40 transition-colors"
                  >
                    <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none font-black text-sm text-foreground hover:text-primary transition-colors">
                      <span>{item.q}</span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-foreground/40 group-open:rotate-180 transition-transform duration-200" />
                    </summary>
                    <div className="px-5 pb-5 text-sm font-semibold text-foreground/70 leading-relaxed border-t border-border/40 pt-4">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}

          {/* Masih ada pertanyaan? */}
          <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 to-pink-50 p-8 text-center space-y-4">
            <MessageCircle className="h-10 w-10 text-primary mx-auto" />
            <h2 className="text-xl font-black font-nunito text-foreground">Masih Ada Pertanyaan?</h2>
            <p className="text-sm font-semibold text-foreground/60">
              Tim kami siap membantu kamu. Hubungi kami melalui email atau WhatsApp.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:ootdcurated@gmail.com"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-xs font-black text-foreground hover:border-primary hover:text-primary transition-all shadow-sm"
              >
                <Mail className="h-4 w-4" /> Email Kami
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
          </div>
        </div>
      </section>
    </main>
  );
}
