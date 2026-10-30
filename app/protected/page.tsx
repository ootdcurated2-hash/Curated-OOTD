import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/userServer";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ProfileEditor from "@/components/ProfileEditor";
import { cookies } from "next/headers";

export default async function ProtectedPage() {
  // Admin yang login via cookie diarahkan ke halaman pengaturan admin
  const cookieStore = await cookies();
  const hasAdminCookie = cookieStore.get("admin_session")?.value === "adminootd_authenticated";
  if (hasAdminCookie) {
    redirect("/admin/settings");
  }

  const profile = await getUserProfile();

  if (!profile) {
    redirect("/auth/login");
  }

  return (
    <div className="container max-w-4xl py-10 px-4 sm:px-6 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
      </Link>

      <div className="flex items-center gap-3 rounded-2xl bg-primary/10 border border-primary/20 p-4 text-primary">
        <ShieldCheck className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">
          Halaman Akun Pengguna — Anda dapat mengedit foto profil dan memperbarui kata sandi di bawah ini.
        </p>
      </div>

      <ProfileEditor
        initialUsername={profile.username}
        initialEmail={profile.email}
        initialAvatarUrl={profile.avatar_url}
        isAdmin={false}
      />
    </div>
  );
}
