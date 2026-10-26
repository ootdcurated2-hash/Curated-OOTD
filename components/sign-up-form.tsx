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
import { Eye, EyeOff, Check, X, RefreshCw, ShieldCheck } from "lucide-react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // State untuk Captcha
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [isRefreshingCaptcha, setIsRefreshingCaptcha] = useState(false);

  const router = useRouter();

  // Load captcha saat komponen dimuat
  const fetchCaptcha = async () => {
    try {
      setIsRefreshingCaptcha(true);
      const res = await fetch("/api/auth/captcha");
      const data = await res.json();
      if (data.question && data.token) {
        setCaptchaQuestion(data.question);
        setCaptchaToken(data.token);
        setCaptchaAnswer("");
      }
    } catch (e) {
      console.error("Gagal mengambil captcha:", e);
    } finally {
      setIsRefreshingCaptcha(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  // Aturan kriteria kata sandi
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[@$!%*?&]/.test(password);
  const isPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;

  const handleSignUp = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    // Validasi nama pengguna / username
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError("Silakan isi nama pengguna / username");
      setIsLoading(false);
      return;
    }

    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      setError("Nama pengguna harus memiliki panjang 3 hingga 30 karakter");
      setIsLoading(false);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Silakan masukkan alamat email yang valid.");
      setIsLoading(false);
      return;
    }

    if (!isPasswordValid) {
      setError("Kata sandi belum memenuhi semua kriteria keamanan.");
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      setIsLoading(false);
      return;
    }

    if (!captchaAnswer.trim()) {
      setError("Silakan isi jawaban captcha keamanan.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          username: trimmedUsername,
          captchaAnswer: captchaAnswer.trim(),
          captchaToken,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        // Refresh captcha jika gagal
        fetchCaptcha();
        throw new Error(json.message || "Gagal membuat akun");
      }

      setSuccessMsg("Pendaftaran berhasil! Mengalihkan ke halaman masuk...");

      // Otomatis login user setelah pendaftaran berhasil
      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (!loginError) {
        router.push("/");
        router.refresh();
      } else {
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat pendaftaran";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mendaftar dengan Akun Google");
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
            Daftar Akun Baru
          </CardTitle>
          <CardDescription className="text-xs font-bold text-foreground/70">
            Bergabunglah bersama komunitas fashion My Curated OOTD
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Tombol Daftar dengan Google */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 font-black text-xs sm:text-sm rounded-full border border-border bg-white text-foreground shadow-cartoon-sm hover:-translate-y-1 hover:shadow-cartoon active:scale-95 transition-all disabled:opacity-50"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              {isGoogleLoading ? "Menghubungkan..." : "Daftar dengan Google"}
            </button>

            <div className="relative flex items-center justify-center my-1">
              <div className="w-full border-t border-border" />
              <span className="absolute bg-white px-3 text-[10px] font-black uppercase tracking-widest text-foreground/60">
                atau isi formulir
              </span>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="username" className="text-xs font-black text-foreground">
                  Username <span className="text-primary">*</span>
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Contoh: nama_kamu"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="rounded-2xl border border-border bg-white/60 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground shadow-cartoon-sm focus-visible:ring-0 focus:outline-none"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="email" className="text-xs font-black text-foreground">
                  Alamat Email <span className="text-primary">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-2xl border border-border bg-white/60 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground shadow-cartoon-sm focus-visible:ring-0 focus:outline-none"
                />
              </div>

              {/* Input Kata Sandi dengan Ikon Mata */}
              <div className="grid gap-1.5">
                <Label htmlFor="password" className="text-xs font-black text-foreground">
                  Kata Sandi <span className="text-primary">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan Kata Sandi"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-2xl border border-border bg-white/60 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground shadow-cartoon-sm focus-visible:ring-0 focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition-colors p-1"
                    aria-label={showPassword ? "Sembunyikan Kata Sandi" : "Lihat Kata Sandi"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Indikator Checklist Kriteria Sandi */}
                <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-border bg-white/60 p-3 text-[11px] font-bold shadow-cartoon-sm mt-1">
                  <div className={cn("flex items-center gap-1.5", hasMinLength ? "text-emerald-600" : "text-foreground/60")}>
                    {hasMinLength ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <X className="h-3.5 w-3.5" />}
                    <span>Min. 8 Karakter</span>
                  </div>
                  <div className={cn("flex items-center gap-1.5", hasUppercase ? "text-emerald-600" : "text-foreground/60")}>
                    {hasUppercase ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <X className="h-3.5 w-3.5" />}
                    <span>Huruf Besar (A-Z)</span>
                  </div>
                  <div className={cn("flex items-center gap-1.5", hasLowercase ? "text-emerald-600" : "text-foreground/60")}>
                    {hasLowercase ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <X className="h-3.5 w-3.5" />}
                    <span>Huruf Kecil (a-z)</span>
                  </div>
                  <div className={cn("flex items-center gap-1.5", hasNumber ? "text-emerald-600" : "text-foreground/60")}>
                    {hasNumber ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <X className="h-3.5 w-3.5" />}
                    <span>Angka (0-9)</span>
                  </div>
                  <div className={cn("flex items-center gap-1.5 col-span-2", hasSymbol ? "text-emerald-600" : "text-foreground/60")}>
                    {hasSymbol ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <X className="h-3.5 w-3.5" />}
                    <span>Simbol (@$!%*?&)</span>
                  </div>
                </div>
              </div>

              {/* Input Ulangi Kata Sandi */}
              <div className="grid gap-1.5">
                <Label htmlFor="repeat-password" className="text-xs font-black text-foreground">
                  Ulangi Kata Sandi <span className="text-primary">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="repeat-password"
                    type={showRepeatPassword ? "text" : "password"}
                    placeholder="Ulangi Kata Sandi"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="rounded-2xl border border-border bg-white/60 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground shadow-cartoon-sm focus-visible:ring-0 focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition-colors p-1"
                    aria-label={showRepeatPassword ? "Sembunyikan ulangi kata sandi" : "Lihat ulangi kata sandi"}
                  >
                    {showRepeatPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Box Captcha Keamanan — Redesigned */}
              <div className="overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50/80 via-white to-rose-50/60 shadow-sm">
                {/* Header strip */}
                <div className="flex items-center justify-between border-b border-pink-100/70 bg-white/60 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <Label htmlFor="captcha" className="text-[11px] font-black uppercase tracking-widest text-foreground/70">
                      Verifikasi Keamanan <span className="text-primary">*</span>
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    disabled={isRefreshingCaptcha}
                    className="flex items-center gap-1 rounded-full bg-primary/8 px-2.5 py-1 text-[10px] font-black text-primary hover:bg-primary/15 transition-colors disabled:opacity-50"
                    title="Ganti Soal Captcha"
                  >
                    <RefreshCw className={cn("h-2.5 w-2.5", isRefreshingCaptcha && "animate-spin")} />
                    Ganti Soal
                  </button>
                </div>

                {/* Captcha Body */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Soal */}
                  <div className="relative flex-shrink-0">
                    <div className="flex h-12 min-w-[104px] items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-white px-4 shadow-inner">
                      <span className="font-mono text-xl font-black tracking-wider text-primary select-none">
                        {captchaQuestion || "···"}
                      </span>
                    </div>
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-black text-white shadow">
                      ?
                    </span>
                  </div>

                  {/* Tanda sama dengan */}
                  <span className="text-lg font-black text-foreground/30">=</span>

                  {/* Input Jawaban */}
                  <Input
                    id="captcha"
                    type="number"
                    inputMode="numeric"
                    placeholder="Jawaban..."
                    required
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    className="h-12 flex-1 rounded-xl border-2 border-border bg-white px-4 text-base font-black text-foreground shadow-sm focus-visible:ring-0 focus:border-primary/40 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-border bg-primary/10 p-3 text-xs font-black text-foreground shadow-cartoon-sm">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-black text-emerald-800 shadow-cartoon-sm">
                  {successMsg}
                </div>
              )}

              <button
                type="submit"
                className="cartoon-btn w-full bg-primary text-white py-3 text-sm font-black disabled:opacity-50"
                disabled={isLoading || isGoogleLoading || !isPasswordValid || !captchaAnswer}
              >
                {isLoading ? "Membuat Akun..." : "Daftar Akun"}
              </button>
            </form>

            <div className="text-center text-xs font-bold text-foreground/70">
              Sudah memiliki akun?{" "}
              <Link
                href="/auth/login"
                className="font-black text-primary underline underline-offset-4 hover:opacity-80"
              >
                Masuk di sini
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
