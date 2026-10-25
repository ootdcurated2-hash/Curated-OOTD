import ProfileEditor from "@/components/ProfileEditor";
import { Settings, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getAdminProfile } from "@/lib/adminServer";

export default async function AdminSettingsPage() {
  const profile = await getAdminProfile();

  return (
    <main className="container max-w-4xl py-8 px-4 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-secondary shadow-cartoon-sm">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-nunito tracking-tighter sm:text-3xl text-foreground">
              Pengaturan Profil Admin
            </h1>
            <p className="text-xs sm:text-sm font-bold text-foreground/70 mt-0.5">
              Ubah username, email, dan kata sandi akun administrator.
            </p>
          </div>
        </div>
        <Link
          href="/admin"
          className="cartoon-btn inline-flex items-center gap-1.5 self-start sm:self-auto bg-white/60 backdrop-blur-md px-4 py-2 text-xs font-black text-foreground border border-border"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Dasbor
        </Link>
      </div>

      <ProfileEditor
        initialUsername={profile.username}
        initialEmail={profile.email}
        initialAvatarUrl={profile.avatar_url}
        isAdmin={true}
      />
    </main>
  );
}
