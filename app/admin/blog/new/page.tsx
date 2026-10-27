import BlogEditor from "@/components/BlogEditor";
import { BookOpen } from "lucide-react";

export default function NewBlogPostPage() {
  return (
    <main className="container max-w-7xl py-6 px-4 sm:px-6">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-black font-nunito tracking-tight text-foreground">
          Tulis Artikel Baru
        </h1>
      </div>
      <BlogEditor />
    </main>
  );
}
