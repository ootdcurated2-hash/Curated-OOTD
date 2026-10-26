"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Camera, Eye, EyeOff, Check, X, ShieldCheck, User, Trash2, AlertTriangle } from "lucide-react";

interface ProfileEditorProps {
  initialUsername: string;
  initialEmail: string;
  initialAvatarUrl?: string;
  isAdmin?: boolean;
}

export default function ProfileEditor({
  initialUsername,
  initialEmail,
  initialAvatarUrl = "",
  isAdmin = false,
}: ProfileEditorProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);      // untuk preview
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState(initialAvatarUrl); // URL final (bukan base64)
  const [isUploading, setIsUploading] = useState(false);
  const [displayName, setDisplayName] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[@$!%*?&]/.test(newPassword);
  const isPasswordValid =
    newPassword.length === 0 ||
    (hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Ukuran foto maksimal 2MB. Silakan kompres gambar terlebih dahulu." });
      e.target.value = "";
      return;
    }

    // Preview lokal instan (base64 hanya untuk tampilan)
    const reader = new FileReader();
    reader.onloadend = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);

    // Upload ke server dan simpan URL final
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-avatar", { method: "POST", body: formData });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        setMessage({ type: "error", text: "Gagal mengunggah foto. Coba lagi." });
        setAvatarUrl(uploadedAvatarUrl); // rollback preview
        return;
      }
      const json = await res.json();
      if (json.success && json.url) {
        setAvatarUrl(json.url);           // update preview ke URL asli
        setUploadedAvatarUrl(json.url);   // simpan URL final
      } else {
        setMessage({ type: "error", text: json.error || "Gagal mengunggah foto." });
        setAvatarUrl(uploadedAvatarUrl); // rollback preview
      }
    } catch {
      setMessage({ type: "error", text: "Gagal mengunggah foto. Periksa koneksi internet." });
      setAvatarUrl(uploadedAvatarUrl); // rollback preview
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl("");
    setUploadedAvatarUrl("");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (newPassword && !isPasswordValid) {
      setMessage({ type: "error", text: "Kata sandi baru belum memenuhi kriteria keamanan." });
      setIsLoading(false);
      return;
    }
    if (newPassword && newPassword !== repeatPassword) {
      setMessage({ type: "error", text: "Konfirmasi kata sandi baru tidak cocok." });
      setIsLoading(false);
      return;
    }

    try {
      if (isAdmin) {
        const res = await fetch("/api/admin-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_profile",
            avatar_url: uploadedAvatarUrl,  // gunakan URL final, bukan base64
            new_username: displayName || undefined,
            new_email: email || undefined,
            new_password: newPassword || undefined,
          }),
        });

        // Guard: parse JSON safely, handle HTML error responses
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error(`Server error (${res.status}). Coba muat ulang halaman.`);
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Gagal memperbarui profil admin");
      } else {
        const supabase = createClient();
        const updateData: {
          email?: string;
          data: Record<string, string>;
          password?: string;
        } = {
          data: { avatar_url: uploadedAvatarUrl, username: displayName },
        };
        if (newPassword) updateData.password = newPassword;
        // Hanya kirim field email jika berubah dari email awal
        const emailChanged = email.trim() !== initialEmail.trim();
        if (emailChanged && email.trim()) updateData.email = email.trim();

        const { error } = await supabase.auth.updateUser(updateData);
        if (error) throw error;

        const syncRes = await fetch("/api/profile/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            avatar_url: uploadedAvatarUrl,
            username: displayName,
          }),
        });
        const syncData = await syncRes.json();
        if (!syncRes.ok || !syncData.success) {
          throw new Error(syncData.message || "Gagal menyimpan foto profil ke database.");
        }

        if (emailChanged && email.trim()) {
          setMessage({
            type: "success",
            text: `Profil berhasil diperbarui! Email konfirmasi telah dikirim ke ${email.trim()}. Cek inbox Anda untuk mengaktifkan email baru.`,
          });
          setNewPassword("");
          setRepeatPassword("");
          setTimeout(() => window.location.reload(), 2500);
          setIsLoading(false);
          return;
        }
      }

      setMessage({ type: "success", text: "Profil berhasil diperbarui!" });
      setNewPassword("");
      setRepeatPassword("");
      setTimeout(() => window.location.reload(), 800);
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan perubahan",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin) return;

    setDeleteMessage(null);
    if (!deletePassword) {
      setDeleteMessage({ type: "error", text: "Masukkan kata sandi akun Anda untuk melanjutkan penghapusan." });
      return;
    }

    const confirmed = window.confirm(
      "Akun Anda akan dihapus permanen dan tidak dapat dipulihkan. Lanjutkan?"
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal menghapus akun.");
      }

      const supabase = createClient();
      await supabase.auth.signOut();
      setDeleteMessage({ type: "success", text: data.message });
      setTimeout(() => router.push("/auth/login"), 1200);
    } catch (err: unknown) {
      setDeleteMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus akun.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="cartoon-card bg-white p-6 sm:p-8 space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-xl sm:text-2xl font-black font-nunito flex items-center gap-2.5 text-foreground">
          {isAdmin ? <ShieldCheck className="h-6 w-6 text-primary" /> : <User className="h-6 w-6 text-primary" />}
          Pengaturan Akun &amp; Keamanan
        </h2>
        <p className="text-xs sm:text-sm font-bold text-foreground/70 mt-1">
          Perbarui nama tampilan, email, dan kata sandi akun Anda.
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* ── Avatar Inisial (sama untuk semua akun / admin) ── */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 border border-border">
          <div className="h-14 w-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center shrink-0 shadow-cartoon-sm">
            <span className="text-xl font-black text-primary leading-none">
              {(displayName || email || "A").charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-black font-nunito text-sm sm:text-base text-foreground">
              Avatar Profil
            </h3>
            <p className="text-xs font-bold text-foreground/70">
              Avatar dibuat otomatis menggunakan huruf awal dari username atau email Anda.
            </p>
          </div>
        </div>

        {/* ── Username & Email ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="display-name" className="text-xs font-black text-foreground">
              Nama / Username
            </label>
            <input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Username baru"
              className="w-full rounded-xl border border-border bg-primary/5 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="user-email" className="text-xs font-black text-foreground">
              Email
              {!isAdmin && (
                <span className="ml-1.5 text-[10px] font-bold text-foreground/50">
                  (konfirmasi akan dikirim ke email baru)
                </span>
              )}
            </label>
            <input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@gmail.com"
              className="w-full rounded-xl border border-border bg-primary/5 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* ── Ganti Password ── */}
        <div className="border-t border-border pt-5 space-y-4">
          <div>
            <h3 className="font-black font-nunito text-base text-foreground">Ganti Kata Sandi (Opsional)</h3>
            <p className="text-xs font-bold text-foreground/70 mt-0.5">
              Kosongkan jika tidak ingin mengubah kata sandi.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="new-password" className="text-xs font-black text-foreground">Kata Sandi Baru</label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan sandi baru"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-primary/5 px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-bold text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/70 hover:text-foreground p-1">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="repeat-new-password" className="text-xs font-black text-foreground">Ulangi Kata Sandi Baru</label>
              <div className="relative">
                <input
                  id="repeat-new-password"
                  type={showRepeatPassword ? "text" : "password"}
                  placeholder="Konfirmasi sandi baru"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-primary/5 px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-bold text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button type="button" onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/70 hover:text-foreground p-1">
                  {showRepeatPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {newPassword.length > 0 && (
            <div className="rounded-xl bg-primary/5 p-3.5 border border-border text-xs space-y-1.5 shadow-cartoon-sm">
              <span className="font-black text-foreground block mb-1">Kriteria Kata Sandi Baru:</span>
              {[
                [hasMinLength, "Minimal 8 karakter"],
                [hasUppercase, "Huruf besar (A-Z)"],
                [hasLowercase, "Huruf kecil (a-z)"],
                [hasNumber, "Angka (0-9)"],
                [hasSymbol, "Simbol (@$!%*?&)"],
              ].map(([ok, label], i) => (
                <div key={i} className={cn("flex items-center gap-1.5 font-bold", ok ? "text-emerald-700" : "text-foreground/60")}>
                  {ok ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-primary" />}
                  <span>{label as string}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {message && (
          <div className={cn(
            "rounded-xl p-3.5 text-xs sm:text-sm font-black border border-border",
            message.type === "success" ? "bg-secondary text-foreground" : "bg-primary text-white"
          )}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="cartoon-btn w-full bg-primary text-white py-3 text-sm font-black hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? "Menyimpan Perubahan..." : "Simpan Perubahan Profil"}
        </button>
      </form>

      {!isAdmin && (
        <div className="border-t border-border pt-6 space-y-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-black font-nunito text-base text-foreground">Hapus Akun</h3>
              <p className="text-xs font-bold text-foreground/70 mt-0.5">
                Akun akan dihapus permanen dan tidak dapat dipulihkan. Masukkan kata sandi untuk mengonfirmasi.
              </p>
            </div>
          </div>

          <form onSubmit={handleDeleteAccount} className="space-y-3">
            <div className="space-y-1.5 max-w-md">
              <label htmlFor="delete-account-password" className="text-xs font-black text-foreground">
                Kata Sandi Akun (wajib)
              </label>
              <div className="relative">
                <input
                  id="delete-account-password"
                  type={showDeletePassword ? "text" : "password"}
                  placeholder="Masukkan kata sandi saat ini"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-border bg-primary/5 px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-bold text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/70 hover:text-foreground p-1"
                >
                  {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {deleteMessage && (
              <div
                className={cn(
                  "rounded-xl p-3.5 text-xs sm:text-sm font-black border border-border max-w-md",
                  deleteMessage.type === "success" ? "bg-secondary text-foreground" : "bg-primary text-white"
                )}
              >
                {deleteMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isDeleting}
              className="cartoon-btn bg-white text-primary border border-primary px-5 py-2.5 text-xs sm:text-sm font-black hover:bg-primary/5 disabled:opacity-50"
            >
              {isDeleting ? "Memproses..." : "Hapus Akun Saya"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
