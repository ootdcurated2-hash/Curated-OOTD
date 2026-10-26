import type { Metadata } from "next";
import Link from "next/link";
import { Scale, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan – My Curated OOTD",
  description: "Syarat dan ketentuan penggunaan layanan My Curated OOTD.",
};

const sections = [
  {
    title: "1. Penerimaan Syarat",
    content: `Dengan mengakses dan menggunakan platform My Curated OOTD ("Platform"), kamu menyetujui untuk terikat dengan syarat dan ketentuan ini. Jika kamu tidak menyetujui, mohon untuk tidak menggunakan layanan kami.

Platform ini dioperasikan oleh tim My Curated OOTD dan menyediakan layanan kurasi outfit fashion beserta tautan afiliasi ke marketplace pihak ketiga.`,
  },
  {
    title: "2. Penggunaan Platform",
    content: `Kamu diizinkan untuk menggunakan Platform hanya untuk keperluan pribadi dan non-komersial. Kamu dilarang:

• Menggunakan Platform untuk tujuan ilegal atau melanggar hukum yang berlaku.
• Menyebarkan konten yang bersifat melecehkan, berbahaya, atau menipu.
• Mencoba mengakses sistem atau data yang tidak diizinkan.
• Menggunakan bot, scraper, atau alat otomatis tanpa izin tertulis.
• Mereproduksi, mendistribusikan, atau menjual konten Platform untuk tujuan komersial.`,
  },
  {
    title: "3. Akun Pengguna",
    content: `Untuk mengakses fitur tertentu (Favorit, Keranjang, Tanya AI), kamu perlu membuat akun. Kamu bertanggung jawab untuk:

• Menjaga kerahasiaan informasi login akun kamu.
• Semua aktivitas yang dilakukan menggunakan akun kamu.
• Segera memberitahukan kami jika terjadi penggunaan akun yang tidak sah.

Kami berhak menonaktifkan akun yang melanggar syarat ini.`,
  },
  {
    title: "4. Tautan Afiliasi & Marketplace",
    content: `My Curated OOTD menyediakan tautan yang mengarahkan ke marketplace pihak ketiga (Shopee, Tokopedia, dll). Perlu dipahami bahwa:

• Kami bukan penjual produk yang ditampilkan — semua transaksi terjadi di marketplace terkait.
• Harga, ketersediaan stok, dan kualitas produk sepenuhnya tanggung jawab penjual di marketplace.
• Kami dapat menerima komisi afiliasi dari pembelian melalui tautan yang kami sediakan.
• Kami tidak bertanggung jawab atas sengketa pembelian, pengiriman, atau kualitas produk dari marketplace.`,
  },
  {
    title: "5. Kekayaan Intelektual",
    content: `Semua konten di Platform — termasuk teks, gambar, logo, desain, dan kode — adalah milik My Curated OOTD atau pemilik hak cipta terkait, dan dilindungi oleh hukum kekayaan intelektual yang berlaku.

Kamu tidak diizinkan untuk menyalin, memodifikasi, mendistribusikan, atau menggunakan konten kami untuk tujuan komersial tanpa izin tertulis dari kami.`,
  },
  {
    title: "6. Batasan Tanggung Jawab",
    content: `Platform disediakan "sebagaimana adanya" tanpa jaminan apapun. Kami tidak bertanggung jawab atas:

• Kerugian langsung atau tidak langsung akibat penggunaan Platform.
• Kesalahan, penghapusan, atau ketidakakuratan konten.
• Gangguan atau ketidaktersediaan layanan.
• Tindakan atau konten dari pihak ketiga yang terhubung melalui Platform kami.`,
  },
  {
    title: "7. Perubahan Syarat",
    content: `Kami berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diinformasikan melalui Platform. Penggunaan Platform yang berkelanjutan setelah perubahan dianggap sebagai penerimaan syarat baru.`,
  },
  {
    title: "8. Hukum yang Berlaku",
    content: `Syarat dan Ketentuan ini diatur oleh hukum Republik Indonesia. Setiap sengketa yang timbul akan diselesaikan melalui musyawarah mufakat, atau jika tidak tercapai, melalui jalur hukum yang berlaku di Indonesia.`,
  },
  {
    title: "9. Hubungi Kami",
    content: `Jika kamu memiliki pertanyaan mengenai Syarat & Ketentuan ini, silakan hubungi kami:

Email: ootdcurated@gmail.com
WhatsApp: 0895326595608`,
  },
];

export default function TermsPage() {
  const lastUpdated = "1 Oktober 2026";

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-white to-pink-50/50 py-16 sm:py-24 px-4">
        <div className="container max-w-3xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-black text-primary uppercase tracking-widest">
            <Scale className="h-3.5 w-3.5" /> Legal
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter font-nunito text-foreground">
            Syarat & <span className="text-primary">Ketentuan</span>
          </h1>
          <p className="text-sm font-semibold text-foreground/50">
            Terakhir diperbarui: {lastUpdated}
          </p>
          <p className="text-base font-semibold text-foreground/60 max-w-xl mx-auto">
            Harap baca syarat dan ketentuan ini dengan seksama sebelum menggunakan layanan My Curated OOTD.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16 px-4">
        <div className="container max-w-3xl mx-auto space-y-6">
          {sections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-border bg-white p-6 sm:p-8 space-y-3">
              <h2 className="text-base font-black font-nunito text-foreground">{section.title}</h2>
              <div className="text-sm font-semibold text-foreground/70 leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </div>
          ))}

          <div className="text-center space-y-3 pt-4">
            <p className="text-xs font-semibold text-foreground/50">
              Dengan menggunakan My Curated OOTD, kamu menyetujui syarat dan ketentuan di atas.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/privacy"
                className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline"
              >
                Baca Kebijakan Privasi <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/help"
                className="inline-flex items-center gap-1.5 text-xs font-black text-foreground/60 hover:text-primary transition-colors"
              >
                Pusat Bantuan <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
