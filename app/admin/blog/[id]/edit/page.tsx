import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import BlogEditor from "@/components/BlogEditor";
import { BookOpen } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!post) notFound();

  return (
    <main className="container max-w-7xl py-6 px-4 sm:px-6">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-black font-nunito tracking-tight text-foreground">
          Edit Artikel
        </h1>
      </div>
      <BlogEditor
        initialPost={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt ?? "",
          content: post.content ?? "",
          cover_image: post.cover_image ?? "",
          author_name: post.author_name ?? "Admin",
          tags: post.tags ?? [],
          status: post.status as "draft" | "published",
        }}
      />
    </main>
  );
}
