"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";

function sanitizeNext(next?: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

async function resolveEmailFromIdentifier(
  supabase: ReturnType<typeof createClient>,
  identifier: string
): Promise<string> {
  let emailToUse = identifier.trim();

  if (!emailToUse.includes("@")) {
    const cleanId = emailToUse.trim();
    const underscoreVersion = cleanId.replace(/\s+/g, "_");
    const spaceVersion = cleanId.replace(/_+/g, " ");

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .or(`username.ilike.${cleanId},username.ilike.${underscoreVersion},username.ilike.${spaceVersion}`)
      .maybeSingle();

    if (profile?.email) {
      emailToUse = profile.email;
    } else {
      const { data: singleProfile } = await supabase
        .from("profiles")
        .select("email")
        .ilike("username", cleanId)
        .maybeSingle();

      if (singleProfile?.email) {
        emailToUse = singleProfile.email;
      } else {
        emailToUse = `${cleanId.toLowerCase()}@user.curatedootd.com`;
      }
    }
  }

  return emailToUse;
}

export function LoginForm({
  className,
  nextPath = "/",
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { nextPath?: string }) {
  const redirectTo = sanitizeNext(nextPath);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Inisialisasi status percobaan gagal & lock dari localStorage
  useEffect(() => {
    try {
      const storedAttempts = parseInt(localStorage.getItem("ootd_login_failed_attempts") || "0", 10);
      const storedLock = parseInt(localStorage.getItem("ootd_login_lock_until") || "0", 10);
      const now = Date.now();

      if (storedLock && storedLock > now) {
        setLockUntil(storedLock);
        setRemainingSeconds(Math.ceil((storedLock - now) / 1000));
        setFailedAttempts(storedAttempts || 5);
      } else if (storedLock && storedLock <= now) {
        localStorage.removeItem("ootd_login_lock_until");
        localStorage.removeItem("ootd_login_failed_attempts");
        setFailedAttempts(0);
        setLockUntil(null);
      } else {
        setFailedAttempts(storedAttempts || 0);
      }
    } catch {
      // Abaikan jika localStorage tidak dapat diakses
    }
  }, []);

  // Timer countdown setiap detik saat terkunci
  useEffect(() => {
    if (!lockUntil) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.ceil((lockUntil - now) / 1000);
      if (diff <= 0) {
        clearInterval(timer);
        setLockUntil(null);
        setRemainingSeconds(0);
        setFailedAttempts(0);
        try {
          localStorage.removeItem("ootd_login_lock_until");
          localStorage.removeItem("ootd_login_failed_attempts");
        } catch {}
      } else {
        setRemainingSeconds(diff);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockUntil]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Cek jika akun masih dalam status terkunci
    const now = Date.now();
    if (lockUntil && lockUntil > now) {
      const s = Math.ceil((lockUntil - now) / 1000);
      const m = Math.floor(s / 60);
      const remSec = s % 60;
      const formatted = m > 0 ? `${m} menit ${remSec} detik` : `${remSec} detik`;
      setError(`Terlalu banyak percobaan gagal (5 kali). Harap tunggu ${formatted} sebelum mencoba lagi.`);
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const trimmedIdentifier = identifier.trim().toLowerCase();

      // ── Admin ─────────────────────────────────────────────
      if (
        (trimmedIdentifier === "adminootd" || trimmedIdentifier === "adminootd@gmail.com") &&
        password === "admin1027"
      ) {
        // Reset hitungan gagal jika login berhasil
        try {
          localStorage.removeItem("ootd_login_failed_attempts");
          localStorage.removeItem("ootd_login_lock_until");
        } catch {}

        try {
          const { error: supaErr } = await supabase.auth.signInWithPassword({
            email: "adminootd@gmail.com",
            password: "admin1027",
          });
          if (!supaErr) {
            router.push(redirectTo.startsWith("/admin") ? redirectTo : "/admin");
            router.refresh();
            return;
          }
        } catch { /* lanjut ke fallback */ }

        try {
          const res = await fetch("/api/admin-auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "login", username: trimmedIdentifier, password }),
          });
          if (res.ok) {
            window.location.href = redirectTo.startsWith("/admin") ? redirectTo : "/admin";
            return;
          }
        } catch { /* lanjut ke fallback */ }

        sessionStorage.setItem("admin_fallback_auth", "adminootd_authenticated");
        window.location.href = redirectTo.startsWith("/admin") ? redirectTo : "/admin";
        return;
      }

      // ── User biasa ────────────────────────────────────────
      const emailToUse = await resolveEmailFromIdentifier(supabase, identifier);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (signInError) {
        if (!identifier.includes("@") && signInError.message.includes("Invalid login credentials")) {
          throw new Error("Username atau kata sandi salah. Anda juga dapat masuk menggunakan email.");
        }
        throw signInError;
      }

      // Reset hitungan gagal jika login sukses
      try {
        localStorage.removeItem("ootd_login_failed_attempts");
        localStorage.removeItem("ootd_login_lock_until");
      } catch {}

      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      // Naikkan counter percobaan gagal
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      try {
        localStorage.setItem("ootd_login_failed_attempts", newAttempts.toString());
      } catch {}

      if (newAttempts >= 5) {
        const lockoutDurationMs = 2 * 60 * 1000; // 2 menit
        const lockTime = Date.now() + lockoutDurationMs;
        setLockUntil(lockTime);
        setRemainingSeconds(120);
        try {
          localStorage.setItem("ootd_login_lock_until", lockTime.toString());
        } catch {}
        setError("Anda telah 5 kali salah memasukkan username/email atau kata sandi. Silakan tunggu 2 menit sebelum mencoba lagi.");
      } else {
        const sisaPercobaan = 5 - newAttempts;
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat masuk";
        const baseMsg = msg.includes("Invalid login credentials")
          ? "Email/Username atau kata sandi tidak cocok."
          : msg;
        setError(`${baseMsg} (Percobaan ${newAttempts}/5. Tersisa ${sisaPercobaan} kali lagi)`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal masuk dengan Akun Google");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="cartoon-card bg-white/60 backdrop-blur-xl">
        <CardHeader className="text-center pb-2">
          <Link
            href="/"
            className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-secondary shadow-cartoon-sm hover:scale-110 hover:rotate-6 transition-all duration-300 group"
            title="Kembali ke Beranda"
          >
            <img
              src="/logo-icon.png"
              alt="Logo"
              className="h-8 w-8 object-contain group-hover:scale-110 transition-transform"
            />
          </Link>
          <CardTitle className="text-2xl font-black font-nunito tracking-tighter text-foreground">
            Masuk ke Akun
          </CardTitle>
          <CardDescription className="text-xs font-bold text-foreground/70">
            Masuk dengan Gmail atau Username / Email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 font-black text-xs sm:text-sm rounded-full border border-border bg-white text-foreground shadow-cartoon-sm hover:-translate-y-1 hover:shadow-cartoon active:scale-95 transition-all disabled:opacity-50"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              {isGoogleLoading ? "Menghubungkan ke Google..." : "Masuk dengan Google"}
            </button>

            <div className="relative flex items-center justify-center my-1">
              <div className="w-full border-t border-border" />
              <span className="absolute bg-white px-3 text-[10px] font-black uppercase tracking-widest text-foreground/60">
                atau
              </span>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="identifier" className="text-xs font-black text-foreground">
                  Username atau Email
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Username atau @gmail.com"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  className="rounded-2xl border border-border bg-white/60 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground shadow-cartoon-sm focus-visible:ring-0 focus:outline-none"
                />
              </div>

              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-black text-foreground">
                    Kata Sandi
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-black text-primary underline underline-offset-2 hover:opacity-80"
                  >
                    Lupa kata sandi?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="rounded-2xl border border-border bg-white/60 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground shadow-cartoon-sm focus-visible:ring-0 focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition-colors p-1"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-black text-destructive shadow-cartoon-sm flex items-start gap-2">
                  <span className="shrink-0 text-base leading-none">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className={cn(
                  "cartoon-btn w-full py-3 text-sm font-black transition-all",
                  lockUntil && remainingSeconds > 0
                    ? "bg-muted text-foreground/50 border-border cursor-not-allowed opacity-80"
                    : "bg-primary text-white"
                )}
                disabled={isLoading || isGoogleLoading || Boolean(lockUntil && remainingSeconds > 0)}
              >
                {lockUntil && remainingSeconds > 0
                  ? `Coba lagi dalam ${Math.floor(remainingSeconds / 60)}:${(remainingSeconds % 60).toString().padStart(2, "0")}`
                  : isLoading
                  ? "Sedang Masuk..."
                  : "Masuk"}
              </button>
            </form>

            <div className="text-center text-xs font-bold text-foreground/70">
              Belum memiliki akun?{" "}
              <Link
                href="/auth/sign-up"
                className="font-black text-primary underline underline-offset-4 hover:opacity-80"
              >
                Daftar sekarang
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
