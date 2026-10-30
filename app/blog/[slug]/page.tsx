import { createClient } from "@/lib/supabase/server";
import { engage } from "@/lib/blogEngagement";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { formatDate, estimateReadingTime, normalizeBlogImageUrl } from "@/lib/blog";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Tag,
  User,
  BookOpen,
} from "lucide-react";
import BlogEngagement from "@/components/BlogEngagement";
import BlogFeedbackList from "@/components/BlogFeedbackList";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("title, excerpt, cover_image")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) return { title: "Artikel Tidak Ditemukan | My Curated OOTD" };

  return {
    title: `${data.title} | Blog My Curated OOTD`,
    description: data.excerpt ?? `Baca artikel "${data.title}" di blog My Curated OOTD.`,
    openGraph: {
      title: data.title,
      description: data.excerpt ?? "",
      images: data.cover_image ? [{ url: normalizeBlogImageUrl(data.cover_image) }] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: data.excerpt ?? "",
    },
  };
}

// Dynamic rendering — blog posts are fetched on-demand
export const dynamic = "force-dynamic";

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!post) notFound();

  // Identitas pembaca untuk dialog catatan (tamu wajib verifikasi, anggota tidak)
  const { data: userData } = await supabase.auth.getUser();
  const reader = userData?.user ?? null;
  const readerName = reader
    ? String(
        reader.user_metadata?.username ||
          reader.user_metadata?.name ||
          reader.email?.split("@")[0] ||
          ""
      )
    : "";

  // Increment view setiap artikel dibuka (user maupun admin).
  // Request prefetch dari Next.js diabaikan agar hitungan tidak membengkak.
  const hdrs = await headers();
  const isPrefetch = hdrs.get("next-router-prefetch") === "1" || hdrs.get("purpose") === "prefetch";

  let views = 0;
  if (!isPrefetch) {
    const stats = await engage(post.slug, "view");
    views = stats.views;
    if (!stats.ok && process.env.NODE_ENV !== "production") {
      console.error("[blog/[slug]] gagal menyimpan view:", stats.error);
    }
  }

  const readTime = estimateReadingTime(post.content);

  // Process content — support basic HTML or plain text with line breaks
  const htmlContent = post.content.includes("<")
    ? post.content
    : post.content
        .split("\n\n")
        .map((p: string) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
        .join("");

  return (
    <main className="min-h-screen">
      {/* Back button on top */}
      <div className="container max-w-4xl px-4 sm:px-6 pt-6 pb-2">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-black text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Kembali ke Blog
        </Link>
      </div>

      {/* Cover Image - Compact & Framed */}
      {post.cover_image && (
        <div className="container max-w-4xl px-4 sm:px-6 pt-2 pb-6">
          <div className="relative w-full max-h-[380px] sm:max-h-[420px] rounded-3xl overflow-hidden cartoon-card bg-secondary/30 shadow-cartoon-sm flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={normalizeBlogImageUrl(post.cover_image)}
              alt={post.title}
              className="w-full h-auto max-h-[380px] sm:max-h-[420px] object-cover object-center"
            />
          </div>
        </div>
      )}

      <div className="container max-w-3xl px-4 sm:px-6 py-4">

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {(post.tags ?? []).map((tag: string) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-secondary text-secondary-foreground"
            >
              <Tag className="h-3 w-3" />
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl font-black font-nunito tracking-tighter text-foreground mb-5 leading-tight">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pb-6 border-b border-border mb-8">
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            {post.author_name ?? "Admin"}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(post.published_at || post.created_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {readTime} menit baca
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            {post.content.replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length} kata
          </span>
        </div>

        {/* Excerpt / Lead */}
        {post.excerpt && (
          <p className="text-base sm:text-lg font-semibold text-foreground/80 leading-relaxed mb-8 border-l-4 border-primary pl-4 italic">
            {post.excerpt}
          </p>
        )}

        {/* Content */}
        <article
          className="prose prose-sm sm:prose-base max-w-none
            prose-headings:font-black prose-headings:font-nunito prose-headings:tracking-tight prose-headings:text-foreground
            prose-p:text-foreground/80 prose-p:leading-relaxed
            prose-a:text-primary prose-a:font-bold prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground prose-strong:font-black
            prose-img:rounded-2xl prose-img:shadow-cartoon
            prose-blockquote:border-primary prose-blockquote:bg-secondary/50 prose-blockquote:rounded-xl prose-blockquote:not-italic
            prose-code:text-primary prose-code:bg-secondary prose-code:rounded prose-code:px-1
            prose-li:text-foreground/80"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col gap-5">
          <BlogEngagement
            slug={post.slug}
            initialViews={views}
            isGuest={!reader}
            displayName={readerName}
          />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Ditulis oleh <span className="font-black text-foreground">{post.author_name ?? "Admin"}</span>
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:gap-2.5 transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Lihat Semua Artikel
            </Link>
          </div>
        </div>

        {/* Catatan pembaca yang sudah disetujui admin */}
        <BlogFeedbackList slug={post.slug} />
      </div>
    </main>
  );
}
