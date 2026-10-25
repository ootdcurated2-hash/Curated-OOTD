import { createClient } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  BarChart3,
  PlusCircle,
  LayoutGrid,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  Star,
  ShieldCheck,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import AdminAuthGuard from "@/components/AdminAuthGuard";
import AdminNotificationBell from "@/components/AdminNotificationBell";
import { getAdminProfile } from "@/lib/adminServer";


export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const hasAdminCookie = cookieStore.get("admin_session")?.value === "adminootd_authenticated";

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Allow if: admin cookie set OR Supabase user is admin
  const isAdminUser = isUserAdmin(user);

  if (!hasAdminCookie && !isAdminUser) {
    if (!user) {
      redirect("/auth/login?next=/admin");
    }
    // User is logged in but not admin
    return (
      <div className="container max-w-lg py-16 px-4">
        <div className="rounded-[2rem] border border-destructive/30 bg-destructive/5 p-8 text-center space-y-4 shadow-cartoon-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter font-nunito text-foreground">Akses Ditolak (403)</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Akun Anda (<span className="font-semibold text-foreground">{user?.email || "Pengguna"}</span>) tidak memiliki izin Administrator.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white/80 backdrop-blur-md px-4 py-2.5 text-sm font-black text-foreground shadow-cartoon-sm hover:scale-105 hover:shadow-cartoon transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const adminProfile = await getAdminProfile();
  const adminEmail =
    user?.email || adminProfile.email || (hasAdminCookie ? "adminootd@gmail.com" : "Admin");
  const adminDisplayName =
    adminProfile.username ||
    (user as { user_metadata?: { username?: string; name?: string } })?.user_metadata?.username ||
    (user as { user_metadata?: { name?: string } })?.user_metadata?.name ||
    adminEmail.split("@")[0];
  let adminAvatar =
    adminProfile.avatar_url ||
    (user as { user_metadata?: { avatar_url?: string } })?.user_metadata?.avatar_url ||
    "";

  if (!adminAvatar && user?.sub) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.sub)
      .maybeSingle();
    if (profileRow?.avatar_url) adminAvatar = profileRow.avatar_url;
  }

  const navLinkClass =
    "inline-flex shrink-0 items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-black bg-white/80 backdrop-blur-md border border-border hover:bg-secondary text-foreground shadow-cartoon-sm hover:-translate-y-0.5 transition-all whitespace-nowrap";

  return (
    <div className="min-h-screen bg-background">
      {/* Client-side fallback auth guard */}
      <AdminAuthGuard />

      {/* Admin bar — fixed (navbar utama disembunyikan di /admin) */}
      <header className="panel-3d fixed top-0 left-0 right-0 z-50 border-b border-border bg-white/85 backdrop-blur-xl shadow-cartoon-sm pt-[env(safe-area-inset-top,0px)]">
        <div className="container max-w-7xl px-3 sm:px-6 py-2.5 space-y-2.5">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="hidden sm:flex shrink-0 items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-secondary text-foreground px-3 py-1 rounded-full border border-border shadow-cartoon-sm">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Panel Admin
              </span>
              <Link
                href="/admin/settings"
                className="flex items-center gap-2 min-w-0 rounded-full pr-2 hover:bg-secondary/60 transition-colors"
                title="Pengaturan profil admin"
              >
                <div className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30 shadow-cartoon-sm">
                  <span className="text-xs sm:text-sm font-black text-primary leading-none">
                    {(adminDisplayName || adminEmail || "A").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="text-xs sm:text-sm font-black text-foreground truncate max-w-[120px] sm:max-w-[200px]">
                    {adminDisplayName}
                  </p>
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground truncate max-w-[120px] sm:max-w-[220px]">
                    {adminEmail}
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <AdminNotificationBell />
              <LogoutButton />
            </div>
          </div>

          <nav
            className="-mx-3 px-3 sm:mx-0 sm:px-0 overflow-x-auto overscroll-x-contain [scrollbar-width:thin]"
            aria-label="Navigasi panel admin"
          >
            <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2 pb-0.5 w-max sm:w-full sm:flex-wrap">
              <Link href="/admin" className={navLinkClass}>
                <LayoutGrid className="h-3.5 w-3.5 text-primary/70" />
                Kelola Outfit
              </Link>
              <Link href="/admin/analytics" className={navLinkClass}>
                <BarChart3 className="h-3.5 w-3.5 text-cartoon-purple" />
                Statistik
              </Link>
              <Link href="/admin/categories" className={navLinkClass}>
                Kategori
              </Link>
              <Link href="/admin/reviews" className={navLinkClass}>
                <Star className="h-3.5 w-3.5 text-primary" />
                Ulasan
              </Link>
              <Link href="/admin/settings" className={navLinkClass}>
                Pengaturan
              </Link>
              <Link
                href="/admin/outfit/new"
                className="cartoon-btn inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-primary text-white whitespace-nowrap"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Tambah Gaya
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <div className="pb-16 pt-[6.75rem] sm:pt-[8.5rem] px-3 sm:px-0">{children}</div>
    </div>
  );
}
