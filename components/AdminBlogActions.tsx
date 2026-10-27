"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Loader2 } from "lucide-react";

interface Props {
  postId: string;
  postSlug: string;
}

export default function AdminBlogActions({ postId, postSlug }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("blog_posts").delete().eq("id", postId);
    router.refresh();
    setDeleting(false);
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-2xl px-3 py-1.5">
        <span className="text-xs text-red-700 font-bold">Hapus?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-black text-red-600 hover:text-red-800 disabled:opacity-60"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Ya"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="text-xs font-black text-muted-foreground hover:text-foreground"
        >
          Batal
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-all"
    >
      <Trash2 className="h-3.5 w-3.5" /> Hapus
    </button>
  );
}
