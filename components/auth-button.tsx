import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { cookies } from "next/headers";
import { ShieldCheck } from "lucide-react";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getUserProfile } from "@/lib/userServer";

export async function AuthButton() {
  const cookieStore = await cookies();
  const hasAdminCookie = cookieStore.get("admin_session")?.value === "adminootd_authenticated";

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // ── Profil Admin ─────────────────────────────────────────────────────────
  let adminAvatar = "";
  let adminUsername = "adminootd";

  if (hasAdminCookie) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (url && key) {
      try {
        const db = createServiceClient(url, key);
        const { data: adminData } = await db
          .from("admin_settings")
          .select("avatar_url, username")
          .eq("id", 1)
          .single();
        if (adminData) {
          adminAvatar = adminData.avatar_url || "";
          adminUsername = adminData.username || "adminootd";
        }
      } catch (err) {
        console.error("AuthButton: Gagal mengambil profil admin dari DB", err);
      }
    }

    // Fallback ke cookie jika DB gagal
    if (!adminAvatar) {
      const adminProf = cookieStore.get("admin_profile")?.value;
      if (adminProf) {
        try {
          const prof = JSON.parse(adminProf);
          adminAvatar = prof.avatar_url || "";
          if (prof.username) adminUsername = prof.username;
        } catch {}
      }
    }
  }

  if (hasAdminCookie && !user) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-3 text-sm">
        <Link
          href="/admin/settings"
          className="touch-target flex items-center gap-2 text-primary font-medium hover:opacity-80 transition-opacity"
          aria-label={`Profil ${adminUsername}`}
        >
          <div className="h-8 w-8 sm:h-7 sm:w-7 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30 shrink-0">
            <span className="text-xs font-black text-primary leading-none">
              {(adminUsername || "A").charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="hidden md:inline max-w-[88px] truncate">{adminUsername}</span>
        </Link>
        <LogoutButton compact />
      </div>
    );
  }

  // ── Profil User Biasa — tanpa foto profil ────────────────────────────────
  if (user) {
    const profile = await getUserProfile();
    const displayName =
      profile?.username ||
      (user as any)?.email?.split("@")[0] ||
      "Pengguna";

    const initial = displayName.charAt(0).toUpperCase();

    return (
      <div className="flex items-center gap-1.5 sm:gap-3 text-sm">
        <Link
          href="/protected"
          className="touch-target flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={`Akun ${displayName}`}
        >
          <div className="h-8 w-8 sm:h-7 sm:w-7 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30 shrink-0">
            <span className="text-xs font-black text-primary leading-none">{initial}</span>
          </div>
          <span className="hidden md:inline font-medium text-foreground max-w-[88px] truncate">
            {displayName}
          </span>
        </Link>
        <LogoutButton compact />
      </div>
    );
  }

  // ── Belum login ───────────────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button
        asChild
        size="sm"
        variant="ghost"
        className="touch-target h-9 px-2.5 sm:px-3 text-xs sm:text-sm font-medium"
      >
        <Link href="/auth/login">Masuk</Link>
      </Button>
      <Button
        asChild
        size="sm"
        variant="default"
        className="touch-target h-9 px-2.5 sm:px-3 text-xs sm:text-sm font-medium"
      >
        <Link href="/auth/sign-up">Daftar</Link>
      </Button>
    </div>
  );
}
