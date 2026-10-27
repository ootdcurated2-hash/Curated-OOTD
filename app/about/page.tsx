import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Sparkles, Users, ShoppingBag, Star, ArrowRight, Shirt, Palette, Code2, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Tentang Kami – My Curated OOTD",
  description: "Kenali lebih dekat tim di balik My Curated OOTD, platform kurasi outfit harian dengan hotspot interaktif untuk belanja langsung dari marketplace.",
};

const values = [
  {
    icon: Heart,
    title: "Penuh Passion",
    desc: "Kami mencintai dunia fashion dan ingin berbagi inspirasi terbaik setiap harinya kepada semua orang.",
  },
  {
    icon: Sparkles,
    title: "Kurasi Berkualitas",
    desc: "Setiap outfit dipilih dengan cermat — mempertimbangkan gaya, kenyamanan, dan keterjangkauan harga.",
  },
  {
    icon: Users,
    title: "Komunitas Pertama",
    desc: "Kami membangun komunitas fashion yang inklusif, di mana semua orang bisa menemukan gaya mereka sendiri.",
  },
  {
    icon: ShoppingBag,
    title: "Belanja Mudah",
    desc: "Dengan hotspot interaktif, kamu bisa langsung belanja produk dari outfit pilihanmu tanpa ribet.",
  },
];

const team = [
  {
    name: "Tim Kurasi",
    role: "Fashion Curator",
    desc: "Memilih dan menyusun koleksi outfit terbaik setiap hari dari berbagai sumber marketplace terpercaya.",
    icon: Shirt,
    color: "bg-pink-50 border-pink-200 text-pink-600",
  },
  {
    name: "Tim Kreatif",
    role: "Content & Design",
    desc: "Memastikan setiap tampilan outfit terlihat indah, informatif, dan menginspirasi para pengguna kami.",
    icon: Palette,
    color: "bg-purple-50 border-purple-200 text-purple-600",
  },
  {
    name: "Tim Teknologi",
    role: "Developer",
    desc: "Membangun pengalaman belanja yang mulus, cepat, dan menyenangkan di platform My Curated OOTD.",
    icon: Code2,
    color: "bg-blue-50 border-blue-200 text-blue-600",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-pink-50/50 py-20 sm:py-28 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="container max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-black text-primary uppercase tracking-widest">
            <Heart className="h-3.5 w-3.5" /> Tentang Kami
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter font-nunito text-foreground">
            Inspirasi Fashion <span className="text-primary">Setiap Hari</span>
          </h1>
          <p className="text-base sm:text-lg font-semibold text-foreground/60 max-w-2xl mx-auto leading-relaxed">
            My Curated OOTD lahir dari kecintaan kami pada dunia fashion. Kami hadir untuk memudahkan kamu menemukan inspirasi outfit dan berbelanja produk pilihan langsung dari marketplace terpercaya.
          </p>
        </div>
      </section>

      {/* Misi & Visi */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="container max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 to-pink-50 p-8 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-black font-nunito text-foreground tracking-tight">Visi Kami</h2>
              <p className="text-sm font-semibold text-foreground/70 leading-relaxed">
                Menjadi platform kurasi fashion terdepan di Indonesia yang menghubungkan inspirasi gaya dengan kemudahan berbelanja — membuat setiap orang merasa percaya diri dan stylish setiap hari.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-gradient-to-br from-purple-50 to-blue-50 p-8 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-purple-500 flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-black font-nunito text-foreground tracking-tight">Misi Kami</h2>
              <p className="text-sm font-semibold text-foreground/70 leading-relaxed">
                Menghadirkan koleksi outfit berkualitas yang dikurasi setiap hari, dilengkapi hotspot interaktif agar kamu bisa langsung menemukan dan membeli produk dari marketplace pilihan dengan mudah.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nilai-nilai */}
      <section className="py-16 sm:py-20 px-4 bg-secondary/30">
        <div className="container max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black font-nunito tracking-tight text-foreground">
              Nilai-Nilai <span className="text-primary">Kami</span>
            </h2>
            <p className="text-sm font-semibold text-foreground/60 max-w-xl mx-auto">
              Prinsip yang menjadi fondasi setiap keputusan dan karya yang kami hadirkan.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="rounded-2xl border border-border bg-white p-6 space-y-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-black font-nunito text-foreground">{v.title}</h3>
                  <p className="text-sm font-medium text-foreground/60 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tim */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="container max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black font-nunito tracking-tight text-foreground">
              Tim <span className="text-primary">Kami</span>
            </h2>
            <p className="text-sm font-semibold text-foreground/60 max-w-xl mx-auto">
              Orang-orang berdedikasi di balik setiap outfit kurasi yang kamu lihat.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {team.map((member) => {
              const IconComp = member.icon;
              return (
                <div key={member.name} className={`rounded-3xl border p-6 text-center space-y-3 ${member.color}`}>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-cartoon-sm">
                    <IconComp className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-black font-nunito text-foreground">{member.name}</h3>
                    <p className="text-xs font-black text-primary uppercase tracking-widest">{member.role}</p>
                  </div>
                  <p className="text-xs font-medium text-foreground/60 leading-relaxed">{member.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Blog & Inspirasi Section */}
      <section className="py-14 sm:py-16 px-4 bg-white border-t border-border/60">
        <div className="container max-w-4xl mx-auto">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-secondary/40 to-pink-50/60 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider">
                <BookOpen className="h-3.5 w-3.5" /> Blog & Artikel
              </div>
              <h3 className="text-2xl sm:text-3xl font-black font-nunito text-foreground tracking-tight">
                Baca Inspirasi & Tips Fashion
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-foreground/70 max-w-lg leading-relaxed">
                Temukan panduan gaya, tren OOTD terbaru, dan tips padu padan outfit yang ditulis langsung oleh tim kurator kami.
              </p>
            </div>
            <Link
              href="/blog"
              className="shrink-0 inline-flex items-center gap-2 rounded-full bg-primary text-white px-6 py-3 text-xs sm:text-sm font-black shadow-cartoon-sm hover:scale-105 active:scale-95 transition-all"
            >
              Kunjungi Blog <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-br from-primary/5 to-pink-50">
        <div className="container max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black font-nunito tracking-tight text-foreground">
            Siap Temukan <span className="text-primary">Outfit Impianmu?</span>
          </h2>
          <p className="text-sm font-semibold text-foreground/60">
            Jelajahi ratusan koleksi outfit kurasi kami dan mulai tampil percaya diri hari ini.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-primary text-white px-8 py-3 text-sm font-black shadow-lg hover:scale-105 transition-all"
          >
            Mulai Jelajahi <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
