import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquareQuote } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/admin";
import { listAllFeedback } from "@/lib/blogFeedback";
import AdminBlogFeedbackManager from "@/components/AdminBlogFeedbackManager";

export const dynamic = "force-dynamic";

export default async function AdminCatatanPage() {
  const cookieStore = await cookies();
  const hasAdminCookie =
    cookieStore.get("admin_session")?.value === "adminootd_authenticated";

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!(hasAdminCookie || isUserAdmin(data?.claims))) {
    redirect("/admin");
  }

  const result = await listAllFeedback();
  const feedback = result.data ?? [];
  const pendingCount = feedback.filter((f) => f.status === "pending").length;

  return (
    <main className="container max-w-5xl py-8 px-4 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-black text-foreground shadow-cartoon-sm">
            <MessageSquareQuote className="h-3.5 w-3.5 text-primary" />
            Fitur Catatan
            {pendingCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[10px] font-black text-white">
                {pendingCount} menunggu
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black font-nunito tracking-tighter text-foreground">
            Catatan Pembaca
          </h1>
          <p className="text-xs sm:text-sm font-bold text-foreground/70 mt-1">
            Kelola catatan yang ditinggalkan pembaca saat menekan like / dislike pada artikel.
            Catatan baru berstatus &quot;Menunggu&quot; dan hanya tampil di artikel setelah disetujui.
          </p>
        </div>
        <Link
          href="/admin"
          className="cartoon-btn inline-flex items-center gap-1.5 self-start sm:self-auto bg-white/60 backdrop-blur-md px-4 py-2 text-xs font-black text-foreground border border-border"
        >
          &larr; Kembali ke Dasbor
        </Link>
      </div>

      {!result.success && (
        <p className="rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-xs font-bold text-amber-800">
          {result.message ??
            "Daftar catatan gagal dimuat. Pastikan migration blog_feedback sudah dijalankan."}
        </p>
      )}

      <AdminBlogFeedbackManager initialFeedback={feedback} />
    </main>
  );
}
