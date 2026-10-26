import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { AuthButton } from "./auth-button";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/admin";
import NavbarClientWrapper from "./NavbarClientWrapper";
import NavbarNavLinks from "./NavbarNavLinks";

export default async function Navbar() {
  const cookieStore = await cookies();
  const hasAdminCookie = cookieStore.get("admin_session")?.value === "adminootd_authenticated";

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const isAdmin = hasAdminCookie || isUserAdmin(user);
  const isLoggedIn = !!user || hasAdminCookie;

  return (
    <NavbarClientWrapper>
      <div className="container flex h-14 sm:h-20 max-w-7xl items-center justify-between gap-2 px-3 sm:px-8 min-w-0 transition-all">
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

        {/* Desktop Navigation Links */}
        <NavbarNavLinks isLoggedIn={isLoggedIn} />

        <nav className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              aria-label="Admin"
              className="touch-target flex items-center justify-center gap-2 p-2 sm:px-3.5 sm:py-1.5 rounded-full border border-border bg-white text-xs font-black text-foreground shadow-cartoon-sm hover:scale-105 hover:shadow-cartoon transition-all"
            >
              <PlusCircle className="h-4 w-4 text-cartoon-purple shrink-0" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          <div className="h-6 w-[1.5px] bg-foreground/10 mx-0.5 hidden sm:block" />
          <AuthButton />
        </nav>
      </div>
    </NavbarClientWrapper>
  );
}
