import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Kebijakan Privasi – My Curated OOTD",
  description: "Kebijakan privasi dan perlindungan data pengguna My Curated OOTD.",
};

const sections = [
  {
    title: "1. Komitmen Privasi Kami",
    content: `My Curated OOTD ("kami") sangat menghargai privasi kamu dan berkomitmen penuh untuk melindungi informasi pribadi yang kamu percayakan kepada kami.

Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, serta menjaga informasi kamu saat mengakses atau menggunakan platform My Curated OOTD.`,
  },
  {
    title: "2. Informasi yang Kami Kumpulkan",
    content: `Kami hanya mengumpulkan informasi yang diperlukan untuk memberikan pengalaman kurasi outfit yang optimal:

• Informasi Akun: Alamat email dan data profil dasar saat kamu mendaftar atau masuk melalui otentikasi Supabase.
• Aktivitas Pengguna: Outfit favorit (Wishlist), item dalam keranjang belanja, serta preferensi style atau interaksi pencarian.
• Data Teknis: Alamat IP, jenis peramban (browser), sistem operasi, dan halaman yang dikunjungi untuk analisis performa website.
• Chatbot & Preferensi AI: Riwayat percakapan dengan fitur Tanya AI untuk memberikan saran outfit yang relevan.`,
  },
  {
    title: "3. Penggunaan Informasi",
    content: `Informasi yang kami kumpulkan digunakan secara bertanggung jawab untuk:

• Mengelola dan memelihara akun pengguna serta fitur personalisasi (Favorit & Keranjang).
• Menyediakan rekomendasi outfit kurasi yang sesuai dengan gaya dan kebutuhan kamu.
• Meningkatkan kualitas, kecepatan, dan kenyamanan antarmuka platform.
• Mengirimkan informasi penting terkait pembaruan layanan atau keamanan akun jika diperlukan.`,
  },
  {
    title: "4. Cookie & Penyimpanan Lokal (Local Storage)",
    content: `Platform kami menggunakan teknologi Cookie dan Local Storage peramban untuk:

• Menyimpan sesi login aktif agar kamu tidak perlu berulang kali masuk.
• Menyimpan daftar item keranjang belanja kamu secara instan di sisi peramban.
• Mengingat preferensi tampilan atau tema antarmuka.

Kamu dapat mengatur preferensi cookie melalui pengaturan browser kamu, namun beberapa fungsi situs mungkin tidak berjalan optimal jika dinonaktifkan.`,
  },
  {
    title: "5. Tautan Afiliasi & Pihak Ketiga",
    content: `My Curated OOTD menyajikan tautan ke platform marketplace pihak ketiga (seperti Shopee, Tokopedia, dan lainnya). 

Ketika kamu mengklik tautan hotspot produk dan dialihkan ke situs pihak ketiga, kebijakan privasi mereka yang akan berlaku. Kami menyarankan kamu untuk membaca kebijakan privasi dari masing-masing marketplace tersebut. Kami tidak bertanggung jawab atas pengumpulan data yang dilakukan oleh situs pihak ketiga.`,
  },
  {
    title: "6. Keamanan & Penyimpanan Data",
    content: `Data kamu disimpan secara aman menggunakan infrastruktur cloud terenkripsi (Supabase) dengan protokol keamanan standar industri. 

Kami tidak akan pernah menjual, menyewakan, atau memperjualbelikan data pribadi kamu kepada pihak mana pun untuk keperluan iklan spam atau pihak ketiga yang tidak berwenang.`,
  },
  {
    title: "7. Hak-Hak Pengguna",
    content: `Sebagai pengguna, kamu memiliki hak penuh untuk:

• Mengakses dan melihat data profil yang tersimpan di akun kamu.
• Memperbarui atau mengubah informasi akun kapan saja.
• Menghapus item dari daftar Favorit atau mengosongkan Keranjang belanja kamu.
• Meminta penutupan akun dan penghapusan data pribadi kamu secara permanen dengan menghubungi kami.`,
  },
  {
    title: "8. Perubahan Kebijakan Privasi",
    content: `Kami dapat memperbarui Kebijakan Privasi ini secara berkala untuk menyesuaikan dengan perkembangan fitur platform atau perubahan regulasi hukum. 

Pembaruan akan dicantumkan di halaman ini bersama dengan tanggal pembaruan terbaru.`,
  },
  {
    title: "9. Kontak Kami",
    content: `Jika kamu memiliki pertanyaan, saran, atau permintaan terkait privasi dan perlindungan data kamu, jangan ragu untuk menghubungi kami:

Email: ootdcurated@gmail.com
WhatsApp: 0895326595608`,
  },
];

export default function PrivacyPage() {
  const lastUpdated = "1 Oktober 2026";

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-white to-pink-50/50 py-16 sm:py-24 px-4">
        <div className="container max-w-3xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-black text-primary uppercase tracking-widest">
            <ShieldCheck className="h-3.5 w-3.5" /> Privasi & Keamanan
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter font-nunito text-foreground">
            Kebijakan <span className="text-primary">Privasi</span>
          </h1>
          <p className="text-sm font-semibold text-foreground/50">
            Terakhir diperbarui: {lastUpdated}
          </p>
          <p className="text-base font-semibold text-foreground/60 max-w-xl mx-auto">
            Pelajari bagaimana My Curated OOTD mengumpulkan, menggunakan, dan melindungi data pribadi kamu.
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
              Kenyamanan dan keamanan privasi kamu adalah prioritas kami di My Curated OOTD.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/terms"
                className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline"
              >
                Baca Syarat & Ketentuan <ArrowRight className="h-3.5 w-3.5" />
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
