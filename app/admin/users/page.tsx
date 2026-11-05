import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/admin";
import AdminUserManager from "@/components/AdminUserManager";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const cookieStore = await cookies();
  const hasAdminCookie =
    cookieStore.get("admin_session")?.value === "adminootd_authenticated";

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const isAdmin = hasAdminCookie || isUserAdmin(user);

  if (!isAdmin) {
    redirect("/admin");
  }

  return (
    <main className="container max-w-5xl py-8 px-4 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-nunito tracking-tighter text-foreground">
            Kelola User
          </h1>
          <p className="text-xs sm:text-sm font-bold text-foreground/70 mt-1">
            Buat, ubah, atau hapus akun pengguna. Perubahan kata sandi langsung berlaku.
          </p>
        </div>
        <Link
          href="/admin"
          className="cartoon-btn inline-flex items-center gap-1.5 self-start sm:self-auto bg-white/60 backdrop-blur-md px-4 py-2 text-xs font-black text-foreground border border-border"
        >
          &larr; Kembali ke Dasbor
        </Link>
      </div>

      <AdminUserManager />
    </main>
  );
}
