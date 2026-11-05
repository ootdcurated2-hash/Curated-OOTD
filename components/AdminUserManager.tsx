"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Plus,
  Search,
  Trash2,
  Pencil,
  Users,
  X,
  KeyRound,
  AlertTriangle,
} from "lucide-react";

interface AdminUserRow {
  id: string;
  email: string;
  username: string;
  display_name: string;
  created_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

const inputCls =
  "rounded-2xl border border-border bg-white/80 px-3.5 py-2 text-xs sm:text-sm font-bold text-foreground shadow-cartoon-sm focus-visible:ring-0 focus:outline-none w-full";

export default function AdminUserManager() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Form tambah user
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Form edit user
  const [editing, setEditing] = useState<AdminUserRow | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal memuat user.");
      setUsers((json.users as AdminUserRow[]) ?? []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat user.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.display_name.toLowerCase().includes(q)
    );
  }, [users, search]);

  const flash = (msg: string, isError = false) => {
    if (isError) setError(msg);
    else {
      setNotice(msg);
      setError(null);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  // ── CREATE ────────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, email: newEmail, password: newPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal membuat user.");
      flash(json.message || "User berhasil dibuat.");
      setShowCreate(false);
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      await load();
    } catch (err: any) {
      flash(err?.message || "Gagal membuat user.", true);
    } finally {
      setIsSaving(false);
    }
  };

  // ── UPDATE ───────────────────────────────────────────────────────────────
  const openEdit = (user: AdminUserRow) => {
    setEditing(user);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditPassword("");
    setError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setIsSaving(true);
    try {
      const payload: Record<string, string> = { id: editing.id };
      if (editUsername !== editing.username) payload.username = editUsername;
      if (editEmail !== editing.email) payload.email = editEmail;
      if (editPassword) payload.password = editPassword;

      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal memperbarui user.");
      flash(json.message || "User diperbarui.");
      setEditing(null);
      await load();
    } catch (err: any) {
      flash(err?.message || "Gagal memperbarui user.", true);
    } finally {
      setIsSaving(false);
    }
  };

  // ── DELETE ────────────────────────────────────────────────────────────────
  const handleDelete = async (user: AdminUserRow) => {
    if (!window.confirm(`Hapus user "${user.username || user.email}"? Semua datanya (wishlist, ulasan, catatan) ikut terhapus dan tidak bisa dikembalikan.`)) {
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal menghapus user.");
      flash(json.message || "User dihapus.");
      await load();
    } catch (err: any) {
      flash(err?.message || "Gagal menghapus user.", true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari username / email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputCls + " pl-9"}
          />
        </div>
        <button
          type="button"
          onClick={() => { setShowCreate((v) => !v); setError(null); }}
          className="cartoon-btn inline-flex items-center justify-center gap-1.5 bg-primary px-4 py-2 text-xs font-black text-white"
        >
          {showCreate ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showCreate ? "Tutup Form" : "Tambah User"}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-black text-destructive shadow-cartoon-sm flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-black text-emerald-700 shadow-cartoon-sm">
          {notice}
        </div>
      )}

      {/* Form tambah */}
      {showCreate && (
        <form onSubmit={handleCreate} className="space-y-3 rounded-[1.5rem] cartoon-card bg-white/60 backdrop-blur-xl p-4">
          <p className="text-xs font-black text-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" /> Buat Akun User Baru
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            <input className={inputCls} placeholder="Username" required minLength={3} maxLength={30}
              value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
            <input className={inputCls} type="email" placeholder="email@gmail.com" required
              value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <input className={inputCls} type="text" placeholder="Kata sandi (min. 8 karakter)" required minLength={8}
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={isSaving}
            className="cartoon-btn inline-flex items-center gap-1.5 bg-primary px-4 py-2 text-xs font-black text-white disabled:opacity-60">
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Simpan User
          </button>
        </form>
      )}

      {/* Daftar user */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-xs font-bold text-foreground/60">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat daftar user...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[1.5rem] cartoon-card bg-white/60 p-8 text-center">
          <Users className="mx-auto h-8 w-8 text-foreground/30" />
          <p className="mt-2 text-xs font-black text-foreground">
            {users.length === 0 ? "Belum ada user terdaftar." : "Tidak ada user yang cocok dengan pencarian."}
          </p>
        </div>
      ) : (
        <div className="rounded-[1.5rem] cartoon-card bg-white/60 backdrop-blur-xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1.2fr_1.6fr_0.8fr_0.8fr_auto] gap-3 border-b border-border px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            <span>Username</span><span>Email</span><span>Terdaftar</span><span>Login Terakhir</span><span>Aksi</span>
          </div>
          <ul className="divide-y divide-border">
            {filtered.map((user) => (
              <li key={user.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3 sm:grid sm:grid-cols-[1.2fr_1.6fr_0.8fr_0.8fr_auto] sm:gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/30">
                      <span className="text-xs font-black text-primary">{(user.username || user.email || "?").charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="truncate text-xs font-black text-foreground">{user.username || "(tanpa username)"}</span>
                  </div>
                  <span className="hidden sm:block truncate text-xs font-bold text-foreground/70">{user.email}</span>
                  <span className="hidden sm:block text-[11px] font-bold text-foreground/60">{formatDate(user.created_at)}</span>
                  <span className="hidden sm:block text-[11px] font-bold text-foreground/60">{formatDate(user.last_sign_in_at)}</span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button type="button" onClick={() => openEdit(user)} aria-label={`Edit ${user.username || user.email}`}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-[10px] font-black text-foreground shadow-cartoon-sm transition-all hover:shadow-cartoon active:scale-95">
                      <Pencil className="h-2.5 w-2.5" /> Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(user)} disabled={isSaving} aria-label={`Hapus ${user.username || user.email}`}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-500 shadow-cartoon-sm transition-all hover:bg-red-100 active:scale-95 disabled:opacity-60">
                      <Trash2 className="h-2.5 w-2.5" /> Hapus
                    </button>
                  </div>
                </div>
                <p className="mt-1 truncate text-[10px] font-bold text-foreground/50 sm:hidden">{user.email}</p>
              </li>
            ))}
          </ul>
          <p className="border-t border-border px-4 py-2 text-[10px] font-bold text-foreground/50">
            Total {users.length} user{filtered.length !== users.length ? ` · ${filtered.length} ditampilkan` : ""}
          </p>
        </div>
      )}

      {/* Modal edit */}
      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setEditing(null)} role="dialog" aria-modal="true">
          <form onSubmit={handleUpdate} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[1.5rem] bg-white p-5 shadow-cartoon-lg space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black font-nunito text-foreground flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" /> Edit User
              </p>
              <button type="button" onClick={() => setEditing(null)} aria-label="Tutup"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-secondary">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid gap-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Username</label>
                <input className={inputCls} minLength={3} maxLength={30} value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Email</label>
                <input className={inputCls} type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Kata Sandi Baru <span className="normal-case font-bold">(kosongkan jika tidak diganti)</span>
                </label>
                <input className={inputCls} type="text" minLength={8} placeholder="Minimal 8 karakter"
                  value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(null)}
                className="flex-1 rounded-full border border-border bg-white px-3 py-2 text-[11px] font-black text-foreground shadow-cartoon-sm active:scale-95">
                Batal
              </button>
              <button type="submit" disabled={isSaving}
                className="flex-1 rounded-full bg-primary px-3 py-2 text-[11px] font-black text-white shadow-cartoon-sm transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60">
                {isSaving ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" /> : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
