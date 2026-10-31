import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";

/**
 * Reset kata sandi berbasis OTP.
 *
 * PENTING: OTP disimpan di `app_metadata` user Supabase (bukan di memori proses).
 * Di lingkungan serverless (Netlify/Cloudflare) tiap request bisa dijalankan di
 * instance berbeda, jadi Map in-memory akan selalu kosong saat verifikasi OTP.
 * Yang disimpan hanyalah hash SHA-256, bukan kode aslinya.
 */
export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const GMAIL_USER = (process.env.GMAIL_USER || "ootdcurated2@gmail.com").trim();
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || "").trim();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 menit
const OTP_LENGTH = 6;
const MAX_OTP_ATTEMPTS = 5;
const OTP_META_KEY = "reset_otp";

const MISSING_ENV_MSG =
  "Konfigurasi server belum lengkap (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).";

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function toMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

function generateOtp(): string {
  let otp = "";
  while (otp.length < OTP_LENGTH) {
    otp += String(randomInt(0, 10)).padStart(1, "0");
  }
  return otp;
}

function hashOtp(email: string, otp: string): string {
  return createHash("sha256").update(`${email}|${otp}`).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

interface StoredOtp {
  code_hash?: unknown;
  expires_at?: unknown;
  attempts?: unknown;
}

function readStoredOtp(metadata: unknown): StoredOtp | null {
  if (!metadata || typeof metadata !== "object") return null;
  const raw = (metadata as Record<string, unknown>)[OTP_META_KEY];
  if (!raw || typeof raw !== "object") return null;
  return raw as StoredOtp;
}

/** Ambil satu user berdasarkan email (listUsers tidak mendukung filter email). */
async function findUserByEmail(admin: AdminClient, email: string) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 500 });
    if (error) {
      return { user: null, message: toMessage(error, "Gagal memverifikasi akun.") };
    }
    const users = data?.users ?? [];
    const found = users.find((u) => u.email?.toLowerCase() === email);
    if (found) return { user: found, message: null };
    if (users.length < 500) break;
  }
  return { user: null, message: null };
}

async function sendResetEmail(
  to: string,
  otp: string
): Promise<{ sent: boolean; error?: string }> {
  if (!GMAIL_APP_PASSWORD) {
    return { sent: false, error: "GMAIL_APP_PASSWORD belum diisi di .env.local" };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });

    await transporter.sendMail({
      from: `"MY CURATED OOTD" <${GMAIL_USER}>`,
      to,
      subject: `${otp} adalah Kode Reset Kata Sandi Curated OOTD Anda`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #fed7e2; border-radius: 16px; background-color: #fff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #ff2b85; margin: 0; font-size: 24px; font-weight: 900;">MY CURATED OOTD</h1>
            <p style="color: #718096; font-size: 13px; margin-top: 4px;">Pusat Inspirasi Fashion &amp; Koleksi Gaya</p>
          </div>
          <p style="color: #2d3748; font-size: 14px; font-weight: 600;">Halo,</p>
          <p style="color: #4a5568; font-size: 13px; line-height: 1.6;">Kami menerima permintaan untuk mengatur ulang kata sandi akun Curated OOTD Anda. Gunakan kode verifikasi (OTP) berikut:</p>
          <div style="text-align: center; margin: 28px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #ff2b85; background: #fff1f5; border: 2px dashed #ff2b85; padding: 12px 28px; border-radius: 12px;">
              ${otp}
            </span>
          </div>
          <p style="color: #a0aec0; font-size: 11px; text-align: center; margin-top: 24px;">Kode ini hanya berlaku selama 10 menit. Jangan bagikan kode ini kepada siapa pun.<br/>Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini.</p>
        </div>
      `,
    });

    return { sent: true };
  } catch (err: unknown) {
    return { sent: false, error: toMessage(err, "pengiriman email gagal") };
  }
}

// ── 1. POST: minta kode OTP reset kata sandi ─────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonError(MISSING_ENV_MSG, 500);
    }

    const body = (await req.json().catch(() => ({}))) as { email?: unknown };
    const cleanEmail =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return jsonError("Silakan masukkan alamat email yang valid.", 400);
    }

    const admin = getSupabaseAdmin();
    const { user, message } = await findUserByEmail(admin, cleanEmail);

    if (message) return jsonError(message, 500);

    if (!user) {
      // Pesan generik agar tidak membocorkan email yang terdaftar/tidak.
      return NextResponse.json({
        success: true,
        message: `Jika email ${cleanEmail} terdaftar, kode OTP akan dikirimkan.`,
        otpLength: OTP_LENGTH,
      });
    }

    const otp = generateOtp();
    const payload: StoredOtp & { code_hash: string; expires_at: number; attempts: number } = {
      code_hash: hashOtp(cleanEmail, otp),
      expires_at: Date.now() + OTP_TTL_MS,
      attempts: 0,
    };

    const appMetadata = {
      ...((user.app_metadata as Record<string, unknown> | undefined) ?? {}),
      [OTP_META_KEY]: payload,
    };

    const { error: saveError } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: appMetadata,
    });

    if (saveError) {
      console.error("reset-password: gagal menyimpan OTP:", saveError);
      return jsonError(
        toMessage(saveError, "Gagal membuat kode OTP. Coba beberapa saat lagi."),
        500
      );
    }

    const mail = await sendResetEmail(cleanEmail, otp);

    if (!mail.sent) {
      console.warn(`reset-password: email ke ${cleanEmail} tidak terkirim:`, mail.error);
      // Fallback dev: kode dikembalikan di respons agar alur tetap bisa diuji.
      return NextResponse.json({
        success: true,
        devOtp: otp,
        otpLength: OTP_LENGTH,
        message: `Kode OTP Anda: ${otp} (email gagal dikirim: ${mail.error})`,
      });
    }

    return NextResponse.json({
      success: true,
      otpLength: OTP_LENGTH,
      message: `Kode OTP berhasil dikirim ke ${cleanEmail}`,
    });
  } catch (err: unknown) {
    console.error("POST /api/auth/reset-password error:", err);
    return jsonError(toMessage(err, "Terjadi kesalahan pada server."), 500);
  }
}

// ── 2. PUT: verifikasi OTP + pasang kata sandi baru ──────────────────────────
export async function PUT(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonError(MISSING_ENV_MSG, 500);
    }

    const body = (await req.json().catch(() => ({}))) as {
      email?: unknown;
      otp?: unknown;
      newPassword?: unknown;
    };

    const cleanEmail =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const cleanOtp = typeof body.otp === "string" ? body.otp.trim() : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!cleanEmail || !cleanOtp || !newPassword) {
      return jsonError("Email, kode OTP, dan kata sandi baru wajib diisi.", 400);
    }

    if (newPassword.length < 8) {
      return jsonError("Kata sandi minimal 8 karakter.", 400);
    }

    const admin = getSupabaseAdmin();
    const { user, message } = await findUserByEmail(admin, cleanEmail);

    if (message) return jsonError(message, 500);
    if (!user) {
      return jsonError(
        "Akun dengan email itu tidak ditemukan. Silakan periksa kembali.",
        400
      );
    }

    const stored = readStoredOtp(user.app_metadata);

    if (!stored || typeof stored.code_hash !== "string") {
      return jsonError(
        "Tidak ada permintaan reset yang aktif untuk email ini. Silakan minta kode baru.",
        400
      );
    }

    if (typeof stored.expires_at === "number" && Date.now() > stored.expires_at) {
      // Bersihkan OTP kadaluarsa agar tidak menumpuk di metadata.
      await admin.auth.admin
        .updateUserById(user.id, {
          app_metadata: clearOtpMetadata(user.app_metadata),
        })
        .catch(() => undefined);

      return jsonError("Kode OTP telah kadaluarsa. Silakan minta kode baru.", 400);
    }

    const attempts =
      typeof stored.attempts === "number" && Number.isFinite(stored.attempts)
        ? stored.attempts
        : 0;

    if (attempts >= MAX_OTP_ATTEMPTS) {
      await admin.auth.admin
        .updateUserById(user.id, { app_metadata: clearOtpMetadata(user.app_metadata) })
        .catch(() => undefined);

      return jsonError(
        "Terlalu banyak percobaan. Silakan minta kode OTP baru.",
        400
      );
    }

    if (!safeEqualHex(stored.code_hash, hashOtp(cleanEmail, cleanOtp))) {
      const nextAttempts = attempts + 1;
      await admin.auth.admin
        .updateUserById(user.id, {
          app_metadata: {
            ...clearOtpMetadata(user.app_metadata),
            [OTP_META_KEY]: {
              code_hash: stored.code_hash,
              expires_at: stored.expires_at,
              attempts: nextAttempts,
            },
          },
        })
        .catch(() => undefined);

      return jsonError(
        `Kode OTP yang Anda masukkan salah. Sisa percobaan: ${Math.max(
          MAX_OTP_ATTEMPTS - nextAttempts,
          0
        )}.`,
        400
      );
    }

    // OTP valid: pasang kata sandi baru sekaligus hapus OTP-nya.
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
      app_metadata: clearOtpMetadata(user.app_metadata),
    });

    if (updateError) {
      console.error("reset-password: gagal update kata sandi:", updateError);
      return jsonError(
        toMessage(updateError, "Gagal memperbarui kata sandi."),
        400
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru Anda.",
    });
  } catch (err: unknown) {
    console.error("PUT /api/auth/reset-password error:", err);
    return jsonError(
      toMessage(err, "Terjadi kesalahan saat memperbarui kata sandi."),
      500
    );
  }
}

function clearOtpMetadata(metadata: unknown): Record<string, unknown> {
  const next = { ...((metadata as Record<string, unknown> | undefined) ?? {}) };
  delete next[OTP_META_KEY];
  return next;
}
