"use client";

import { cn } from "@/lib/utils";
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
import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, Check, X, Mail, KeyRound, Lock } from "lucide-react";

type Step = "email" | "otp" | "success";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [otpLength, setOtpLength] = useState(6);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // Password criteria
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[@$!%*?&]/.test(newPassword);
  const isPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;

  // ── Step 1: Kirim OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      if (typeof data.otpLength === "number") {
        setOtpLength(data.otpLength);
        setOtp(Array(data.otpLength).fill(""));
      }
      setStep("otp");
      setResendCooldown(60);
      // Dev fallback: tampilkan OTP di konsol saja
      if (data.devOtp) console.info("[DEV] Reset OTP:", data.devOtp);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengirim kode verifikasi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 1 (resend) ────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setResendCooldown(60);
      if (data.devOtp) console.info("[DEV] Resend OTP:", data.devOtp);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengirim ulang kode.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── OTP input handlers ─────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = cleaned;
    setOtp(next);
    if (cleaned && index < otpLength - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, otpLength)
      .split("");
    const next = [...otp];
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    otpRefs.current[Math.min(digits.length, otpLength - 1)]?.focus();
  };

  // ── Step 2: Verifikasi OTP + Reset Password ────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== otpLength) {
      setError(`Masukkan ${otpLength} digit kode verifikasi.`);
      return;
    }
    if (!isPasswordValid) {
      setError("Kata sandi belum memenuhi semua kriteria.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: otpString,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setStep("success");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memperbarui kata sandi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Shared Logo ────────────────────────────────────────────────────────────
  const LogoLink = () => (
    <Link
      href="/"
      className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-secondary shadow-cartoon-sm hover:scale-110 hover:rotate-6 transition-all duration-300 group"
      title="Kembali ke Beranda"
    >
      <img
        src="/logo-icon.png"
        alt="Logo"
        className="h-8 w-8 object-contain group-hover:scale-110 transition-transform"
      />
    </Link>
  );

  // ── Step: Success ──────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="cartoon-card bg-white/60 backdrop-blur-xl">
          <CardHeader className="text-center pb-2">
            <LogoLink />
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 border-2 border-emerald-400">
              <Check className="h-6 w-6 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl font-black font-nunito tracking-tighter text-foreground">
              Kata Sandi Diperbarui!
            </CardTitle>
            <CardDescription className="text-xs font-bold text-foreground/70">
              Kata sandi akun Anda berhasil diatur ulang.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-xs font-bold text-foreground/80 leading-relaxed">
              Sekarang Anda dapat masuk menggunakan kata sandi baru yang telah dibuat.
            </p>
            <Link
              href="/auth/login"
              className="cartoon-btn inline-block w-full bg-primary text-white py-3 text-xs sm:text-sm font-black text-center"
            >
              Masuk Sekarang
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Step: OTP + New Password ───────────────────────────────────────────────
  if (step === "otp") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="cartoon-card bg-white/60 backdrop-blur-xl">
          <CardHeader className="text-center pb-2">
            <LogoLink />
            <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/30">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-black font-nunito tracking-tighter text-foreground">
              Masukkan Kode OTP
            </CardTitle>
            <CardDescription className="text-xs font-bold text-foreground/70 leading-relaxed">
              Kode {otpLength} digit telah dikirimkan ke{" "}
              <span className="text-primary">{email}</span>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* OTP Input */}
              <div className="space-y-2">
                <Label className="text-xs font-black text-foreground">
                  Kode Verifikasi
                </Label>
                <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="h-11 w-9 rounded-xl border-2 border-border bg-white/80 text-center text-base font-black text-foreground shadow-cartoon-sm transition-all focus:border-primary focus:outline-none focus:ring-0 focus:shadow-[0_0_0_3px_rgba(255,43,133,0.15)]"
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isLoading}
                    className="text-xs font-bold text-primary hover:underline disabled:text-foreground/40 disabled:no-underline transition-colors"
                  >
                    {resendCooldown > 0
                      ? `Kirim ulang dalam ${resendCooldown}d`
                      : "Kirim ulang kode"}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-xs font-black text-foreground">
                  Kata Sandi Baru
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Buat kata sandi baru"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-2xl border border-border bg-white/60 px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-bold text-foreground shadow-cartoon-sm focus-visible:ring-0 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Criteria */}
                <div className="rounded-2xl bg-muted/40 p-3 border border-border/60 text-xs space-y-1.5">
                  <span className="font-bold text-foreground/60 block mb-1">Kriteria Kata Sandi:</span>
                  {[
                    [hasMinLength, "Minimal 8 karakter"],
                    [hasUppercase, "Huruf besar (A-Z)"],
                    [hasLowercase, "Huruf kecil (a-z)"],
                    [hasNumber, "Angka (0-9)"],
                    [hasSymbol, "Simbol (@$!%*?&)"],
                  ].map(([ok, label]) => (
                    <div
                      key={String(label)}
                      className={cn(
                        "flex items-center gap-1.5 font-semibold",
                        ok ? "text-emerald-500" : "text-foreground/40"
                      )}
                    >
                      {ok ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      <span>{String(label)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-border bg-primary/10 p-3 text-xs font-black text-foreground shadow-cartoon-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="cartoon-btn w-full bg-primary text-white py-3 text-sm font-black disabled:opacity-50"
                disabled={isLoading || otp.join("").length !== otpLength || !isPasswordValid}
              >
                {isLoading ? "Menyimpan..." : "Atur Ulang Kata Sandi"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("email"); setError(null); setOtp(Array(otpLength).fill("")); }}
                className="w-full text-center text-xs font-bold text-foreground/60 hover:text-primary transition-colors"
              >
                ← Ganti Email
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Step: Email ────────────────────────────────────────────────────────────
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="cartoon-card bg-white/60 backdrop-blur-xl">
        <CardHeader className="text-center pb-2">
          <LogoLink />
          <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/30">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black font-nunito tracking-tighter text-foreground">
            Lupa Kata Sandi?
          </CardTitle>
          <CardDescription className="text-xs font-bold text-foreground/70 leading-relaxed">
            Masukkan email terdaftar. Kami akan mengirimkan kode OTP untuk mengatur ulang kata sandi.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="reset-email" className="text-xs font-black text-foreground">
                Alamat Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="nama@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-2xl border border-border bg-white/60 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground shadow-cartoon-sm focus-visible:ring-0 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-border bg-primary/10 p-3 text-xs font-black text-foreground shadow-cartoon-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="cartoon-btn w-full bg-primary text-white py-3 text-sm font-black disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Mengirim Kode..." : "Kirim Kode Verifikasi"}
            </button>

            <div className="mt-2 text-center text-xs font-bold text-foreground/70">
              Ingat kata sandi Anda?{" "}
              <Link
                href="/auth/login"
                className="font-black text-primary underline underline-offset-4 hover:opacity-80"
              >
                Masuk kembali
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
