import Link from "next/link";
import { Heart, PlusCircle, Bot } from "lucide-react";
import { AuthButton } from "./auth-button";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/admin";
import GuestGuardLink from "./GuestGuardLink";

export default async function Navbar() {
  const cookieStore = await cookies();
  const hasAdminCookie = cookieStore.get("admin_session")?.value === "adminootd_authenticated";

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const isAdmin = hasAdminCookie || isUserAdmin(user);
  const isLoggedIn = !!user || hasAdminCookie;

  return (
    <header className="panel-3d sticky top-0 z-50 w-full border-b border-border bg-white/70 backdrop-blur-xl pt-[env(safe-area-inset-top,0px)]">
      <div className="container flex h-14 sm:h-20 max-w-7xl items-center justify-between gap-2 px-3 sm:px-8 min-w-0">
        <Link href="/" className="flex shrink-0 items-center gap-1.5 sm:gap-2.5 group">
          <div className="icon-3d h-8 w-8 sm:h-12 sm:w-12 shrink-0 rounded-xl sm:rounded-[1.25rem] border border-border bg-white p-1 sm:p-2 shadow-cartoon-sm transition-all duration-300 group-hover:rotate-6 group-hover:scale-110">
            <img src="/logo-icon.png" alt="My Curated OOTD Logo" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center text-[15px] xs:text-base sm:text-2xl font-black tracking-tight sm:tracking-tighter font-nunito leading-none text-foreground whitespace-nowrap">
              <span>My Curated</span>
              <span className="text-primary ml-1">OOTD</span>
            </div>
            <span className="text-[9px] sm:text-[10px] tracking-widest text-foreground/60 hidden sm:block font-black uppercase mt-0.5 sm:mt-1">
              Pakaian Pilihan • Gaya Lebih Baik
            </span>
          </div>
        </Link>

        <nav className="flex shrink-0 items-center gap-1 sm:gap-4">
          <GuestGuardLink
            href="/creator"
            isLoggedIn={isLoggedIn}
            aria-label="Tanya AI"
            className="touch-target flex items-center justify-center gap-2 p-2.5 sm:px-4 sm:py-2 rounded-full border border-border bg-white text-xs font-black text-foreground shadow-cartoon-sm hover:scale-105 hover:shadow-cartoon transition-all"
          >
            <Bot className="h-4 w-4 text-primary shrink-0" />
            <span className="hidden md:inline">Tanya AI</span>
          </GuestGuardLink>

          <GuestGuardLink
            href="/wishlist"
            isLoggedIn={isLoggedIn}
            aria-label="Favorit"
            className="touch-target flex items-center justify-center gap-2 p-2.5 sm:px-4 sm:py-2 rounded-full border border-border bg-white text-xs font-black text-foreground shadow-cartoon-sm hover:scale-105 hover:shadow-cartoon transition-all"
          >
            <Heart className="h-4 w-4 text-primary shrink-0" />
            <span className="hidden md:inline">Favorit</span>
          </GuestGuardLink>

          {isAdmin && (
            <Link
              href="/admin"
              aria-label="Admin"
              className="touch-target flex items-center justify-center gap-2 p-2.5 sm:px-4 sm:py-2 rounded-full border border-border bg-white text-xs font-black text-foreground shadow-cartoon-sm hover:scale-105 hover:shadow-cartoon transition-all"
            >
              <PlusCircle className="h-4 w-4 text-cartoon-purple shrink-0" />
              <span className="hidden md:inline">Admin</span>
            </Link>
          )}

          <div className="h-6 w-[1.5px] bg-foreground/10 mx-0.5 hidden sm:block" />
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
