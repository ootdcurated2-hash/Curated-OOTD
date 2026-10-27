import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate } from "@/lib/blog";
import {
  PlusCircle,
  FileText,
  Globe,
  Pencil,
  Trash2,
  Eye,
  BookOpen,
  Download,
} from "lucide-react";
import AdminBlogActions from "@/components/AdminBlogActions";

export default async function AdminBlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, slug, title, status, author_name, tags, published_at, created_at, updated_at")
    .order("created_at", { ascending: false });

  const allPosts = posts ?? [];
  const published = allPosts.filter((p: { status: string }) => p.status === "published");
  const drafts = allPosts.filter((p: { status: string }) => p.status === "draft");

  return (
    <main className="container max-w-7xl py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden cartoon-card bg-white/60 backdrop-blur-2xl p-6 sm:p-8 border-white/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3.5 py-1 text-xs font-black text-foreground shadow-cartoon-sm">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              Manajemen Blog & Artikel
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-nunito tracking-tighter text-foreground">
              Artikel Blog
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Buat, kelola, dan publikasikan artikel fashion. Import dari Word atau export artikel ke Word.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/blog"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/80 px-4 py-2 text-xs font-black text-foreground shadow-cartoon-sm hover:-translate-y-0.5 transition-all"
            >
              <Eye className="h-3.5 w-3.5" /> Lihat Blog
            </Link>
            <Link
              href="/admin/blog/new"
              className="cartoon-btn inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 text-xs font-black"
            >
              <PlusCircle className="h-4 w-4" />
              Tulis Artikel Baru
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Artikel", value: allPosts.length, icon: FileText, color: "text-foreground" },
          { label: "Dipublikasikan", value: published.length, icon: Globe, color: "text-green-600" },
          { label: "Draf", value: drafts.length, icon: Pencil, color: "text-amber-600" },
        ].map((stat) => (
          <div key={stat.label} className="cartoon-card bg-white p-5 flex items-center gap-4">
            <div className={`h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-bold">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Article List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h2 className="text-lg font-black font-nunito tracking-tighter text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Semua Artikel
          </h2>
        </div>

        {allPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <p className="text-base font-black text-foreground">Belum Ada Artikel</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Mulai menulis artikel pertama Anda!
            </p>
            <Link
              href="/admin/blog/new"
              className="cartoon-btn inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 text-xs font-black"
            >
              <PlusCircle className="h-4 w-4" /> Tulis Artikel Baru
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {allPosts.map((post: { id: string; slug: string; title: string; status: string; author_name: string; tags: string[] | null; published_at: string | null; created_at: string; updated_at: string }) => (
              <div
                key={post.id}
                className="group cartoon-card bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        post.status === "published"
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-amber-100 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {post.status === "published" ? (
                        <><Globe className="h-2.5 w-2.5" /> Dipublikasikan</>
                      ) : (
                        <><Pencil className="h-2.5 w-2.5" /> Draf</>
                      )}
                    </span>
                      {(post.tags ?? []).slice(0, 2).map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-sm font-black text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Oleh <span className="font-bold">{post.author_name}</span>
                    {" · "}Dibuat {formatDate(post.created_at)}
                    {post.status === "published" && post.published_at && (
                      <> · Dipublikasikan {formatDate(post.published_at)}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {post.status === "published" && (
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition-all"
                    >
                      <Eye className="h-3.5 w-3.5" /> Lihat
                    </Link>
                  )}
                  <Link
                    href={`/admin/blog/${post.id}/edit`}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition-all"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Link>
                  <AdminBlogActions postId={post.id} postSlug={post.slug} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
