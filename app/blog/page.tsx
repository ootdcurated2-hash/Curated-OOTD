import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Metadata } from "next";
import { formatDate, estimateReadingTime, normalizeBlogImageUrl } from "@/lib/blog";
import { BookOpen, Clock, CalendarDays, Tag, ArrowRight, Rss } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog & Artikel Fashion | My Curated OOTD",
  description:
    "Tips fashion, inspirasi OOTD, panduan gaya berpakaian, dan tren terkini dari tim kurator My Curated OOTD.",
  openGraph: {
    title: "Blog & Artikel Fashion | My Curated OOTD",
    description:
      "Tips fashion, inspirasi OOTD, panduan gaya berpakaian, dan tren terkini dari tim kurator My Curated OOTD.",
    type: "website",
  },
};

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, cover_image, author_name, tags, published_at, created_at, content")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const allPosts = posts ?? [];
  const featured = allPosts[0];
  const rest = allPosts.slice(1);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b border-border/60">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-10 left-1/4 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
        </div>
        <div className="container max-w-6xl px-4 sm:px-6 py-16 sm:py-20 relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-black text-primary mb-5">
            <Rss className="h-3.5 w-3.5" />
            Blog & Artikel Fashion
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-nunito tracking-tighter text-foreground mb-4 max-w-2xl">
            Inspirasi & Tips{" "}
            <span className="text-primary">Fashion</span> Terkini
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
            Temukan panduan gaya, tren OOTD musiman, dan tips mix &amp; match outfit
            pilihan kurator kami.
          </p>
        </div>
      </section>

      <div className="container max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
        {allPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xl font-black text-foreground">Belum Ada Artikel</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Artikel pertama kami sedang disiapkan. Nantikan konten fashion terbaik dari tim kurator kami!
            </p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featured && (
              <section className="mb-12">
                <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2">
                  <span className="h-px flex-1 bg-border" />
                  Artikel Unggulan
                  <span className="h-px flex-1 bg-border" />
                </h2>
                <Link
                  href={`/blog/${featured.slug}`}
                  className="group grid md:grid-cols-2 gap-0 rounded-[2rem] overflow-hidden cartoon-card hover:-translate-y-1 hover:shadow-cartoon transition-all duration-300 bg-white"
                >
                  {featured.cover_image ? (
                    <div className="relative h-56 md:h-auto overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={normalizeBlogImageUrl(featured.cover_image)}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="h-56 md:h-auto bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-primary/40" />
                    </div>
                  )}
                  <div className="p-8 flex flex-col justify-center gap-4">
                    <div className="flex flex-wrap gap-1.5">
                      {(featured.tags ?? []).slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary text-secondary-foreground"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black font-nunito tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-3">
                      {featured.title}
                    </h3>
                    {featured.excerpt && (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {featured.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(featured.published_at || featured.created_at)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {estimateReadingTime(featured.content)} menit baca
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-black text-primary group-hover:gap-3 transition-all">
                      Baca Artikel <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </section>
            )}

            {/* Article Grid */}
            {rest.length > 0 && (
              <section>
                <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2">
                  <span className="h-px flex-1 bg-border" />
                  Artikel Lainnya
                  <span className="h-px flex-1 bg-border" />
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map((post: { id: string; slug: string; title: string; excerpt: string | null; cover_image: string | null; tags: string[] | null; published_at: string | null; created_at: string; content: string }) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group flex flex-col rounded-[1.5rem] overflow-hidden cartoon-card bg-white hover:-translate-y-1 hover:shadow-cartoon transition-all duration-300"
                    >
                      {post.cover_image ? (
                        <div className="relative h-44 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={normalizeBlogImageUrl(post.cover_image)}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="h-44 bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
                          <BookOpen className="h-10 w-10 text-primary/30" />
                        </div>
                      )}
                      <div className="p-5 flex flex-col flex-1 gap-3">
                        <div className="flex flex-wrap gap-1">
                          {(post.tags ?? []).slice(0, 2).map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-secondary-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <h3 className="text-sm font-black font-nunito tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {formatDate(post.published_at || post.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {estimateReadingTime(post.content)} mnt
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
