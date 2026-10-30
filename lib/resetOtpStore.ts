import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Penyimpanan OTP reset password.
 *
 * Kenapa tidak boleh pakai `new Map()` saja?
 * Di Cloudflare Workers, setiap request bisa dijawab oleh isolate (proses) yang
 * berbeda dan memorinya tidak dibagi. OTP yang disimpan di variabel module akan
 * "hilang" saat user mengirim kode di request berikutnya → reset password gagal
 * secara acak. Karena itu state disimpan di tabel Supabase.
 *
 * OTP TIDAK pernah disimpan apa adanya — hanya hash SHA-256-nya.
 *
 * Tabel: public.password_reset_otps (lihat supabase/migrations/add_password_reset_otp_table.sql)
 */

const TABLE = "password_reset_otps";
const TTL_MS = 10 * 60 * 1000; // 10 menit

type MemoryEntry = {
  userId: string;
  otpHash: string;
  expiresAt: number; // timestamp ms
};

/** Cadangan terakhir saat tabel belum dibuat / DB sedang error. */
const memoryStore = new Map<string, MemoryEntry>();

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Simpan (atau timpa) OTP untuk satu email. Tidak pernah melempar exception. */
export async function storeResetOtp(
  admin: SupabaseClient,
  params: { email: string; userId: string; otp: string }
): Promise<void> {
  const { email, userId, otp } = params;
  const otpHash = await sha256(otp);
  const expiresAt = Date.now() + TTL_MS;

  memoryStore.set(email, { userId, otpHash, expiresAt });

  try {
    // Bersihkan permintaan lama yang sudah lewat masa berlaku.
    await admin.from(TABLE).delete().lt("expires_at", new Date().toISOString());

    const { error } = await admin.from(TABLE).upsert(
      {
        email,
        user_id: userId,
        otp_hash: otpHash,
        expires_at: new Date(expiresAt).toISOString(),
      },
      { onConflict: "email" }
    );

    if (error) throw error;
  } catch (err) {
    console.warn(
      "[resetOtpStore] gagal menyimpan OTP ke database, memakai memori lokal:",
      err instanceof Error ? err.message : err
    );
  }
}

export type VerifyResetOtpResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "not_found" | "expired" | "wrong_code" };

/** Cocokkan OTP bawaan user. Bila benar, OTP langsung dianggap sekali pakai. */
export async function verifyResetOtp(
  admin: SupabaseClient,
  email: string,
  otp: string
): Promise<VerifyResetOtpResult> {
  const otpHash = await sha256(otp);

  let row: { user_id: string; otp_hash: string; expires_at: string } | null = null;

  try {
    const { data, error } = await admin
      .from(TABLE)
      .select("user_id, otp_hash, expires_at")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;
    row = data;
  } catch (err) {
    console.warn(
      "[resetOtpStore] gagal membaca OTP dari database, memakai memori lokal:",
      err instanceof Error ? err.message : err
    );
  }

  if (!row) {
    const entry = memoryStore.get(email);
    if (!entry) return { ok: false, reason: "not_found" };
    if (Date.now() > entry.expiresAt) {
      memoryStore.delete(email);
      return { ok: false, reason: "expired" };
    }
    if (entry.otpHash !== otpHash) return { ok: false, reason: "wrong_code" };
    memoryStore.delete(email);
    return { ok: true, userId: entry.userId };
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await deleteResetOtp(admin, email);
    return { ok: false, reason: "expired" };
  }

  if (row.otp_hash !== otpHash) return { ok: false, reason: "wrong_code" };

  await deleteResetOtp(admin, email);
  return { ok: true, userId: row.user_id };
}

/** Hapus OTP setelah dipakai / dibatalkan. */
export async function deleteResetOtp(
  admin: SupabaseClient,
  email: string
): Promise<void> {
  memoryStore.delete(email);

  try {
    const { error } = await admin.from(TABLE).delete().eq("email", email);
    if (error) throw error;
  } catch (err) {
    console.warn(
      "[resetOtpStore] gagal menghapus OTP di database:",
      err instanceof Error ? err.message : err
    );
  }
}
