import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const GMAIL_USER = process.env.GMAIL_USER || "ootdcurated@gmail.com";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── In-memory OTP store (berlaku 10 menit) ─────────────────────────────────
interface OtpEntry {
  otp: string;
  userId: string;
  expiresAt: number; // timestamp ms
}
const otpStore = new Map<string, OtpEntry>(); // key: email

// ── 1. POST: Kirim OTP Reset Password via Gmail ────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    const cleanEmail = email?.trim()?.toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Silakan masukkan alamat email yang valid." },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdmin();

    // Cek apakah user dengan email ini ada
    const { data: listData, error: listError } =
      await adminClient.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json(
        { success: false, message: "Gagal memverifikasi akun." },
        { status: 500 }
      );
    }

    const existingUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (!existingUser) {
      // Pesan generik agar tidak membocorkan info akun
      return NextResponse.json({
        success: true,
        message: `Jika email ${cleanEmail} terdaftar, kode OTP akan dikirimkan.`,
      });
    }

    // Generate OTP recovery via Supabase Admin
    const { data: linkData, error: linkError } =
      await adminClient.auth.admin.generateLink({
        type: "recovery",
        email: cleanEmail,
      });

    if (linkError) {
      console.error("generateLink error:", linkError);
      return NextResponse.json(
        { success: false, message: linkError.message || "Gagal membuat kode reset password." },
        { status: 400 }
      );
    }

    const otp = linkData?.properties?.email_otp;
    if (!otp) {
      return NextResponse.json(
        { success: false, message: "Gagal membuat kode OTP. Coba beberapa saat lagi." },
        { status: 500 }
      );
    }

    // Simpan OTP di store server (10 menit)
    otpStore.set(cleanEmail, {
      otp,
      userId: existingUser.id,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Kirim via Gmail SMTP (sama persis dengan send-otp)
    if (GMAIL_APP_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: GMAIL_USER,
            pass: GMAIL_APP_PASSWORD,
          },
        });

        await transporter.sendMail({
          from: `"Curated OOTD" <${GMAIL_USER}>`,
          to: cleanEmail,
          subject: `${otp} adalah Kode Reset Kata Sandi Curated OOTD Anda`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #fed7e2; border-radius: 16px; background-color: #fff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #ff2b85; margin: 0; font-size: 24px; font-weight: 900;">Curated OOTD</h1>
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

        return NextResponse.json({
          success: true,
          message: `Kode OTP berhasil dikirim ke ${cleanEmail}`,
        });
      } catch (mailError: any) {
        console.error("Gagal mengirim email via Gmail SMTP:", mailError);
        return NextResponse.json({
          success: true,
          devOtp: otp,
          message: `Kode OTP Anda: ${otp} (Gmail SMTP gagal, periksa GMAIL_APP_PASSWORD di .env.local)`,
        });
      }
    }

    // Fallback jika belum pasang GMAIL_APP_PASSWORD
    return NextResponse.json({
      success: true,
      devOtp: otp,
      message: `Kode reset kata sandi Anda adalah ${otp}.`,
    });
  } catch (err: any) {
    console.error("POST /api/auth/reset-password error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

// ── 2. PUT: Verifikasi OTP dari store + Update Password ───────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, newPassword } = body;

    const cleanEmail = email?.trim()?.toLowerCase();
    const cleanOtp = otp?.trim();

    if (!cleanEmail || !cleanOtp || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Email, kode OTP, dan kata sandi baru wajib diisi." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "Kata sandi minimal 8 karakter." },
        { status: 400 }
      );
    }

    // Ambil OTP dari store
    const entry = otpStore.get(cleanEmail);

    if (!entry) {
      return NextResponse.json(
        { success: false, message: "Tidak ada permintaan reset yang aktif untuk email ini. Silakan minta kode baru." },
        { status: 400 }
      );
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(cleanEmail);
      return NextResponse.json(
        { success: false, message: "Kode OTP telah kadaluarsa. Silakan minta kode baru." },
        { status: 400 }
      );
    }

    if (entry.otp !== cleanOtp) {
      return NextResponse.json(
        { success: false, message: "Kode OTP yang Anda masukkan salah. Periksa kembali email Anda." },
        { status: 400 }
      );
    }

    // OTP valid — update password via Supabase Admin
    const adminClient = getSupabaseAdmin();
    const { error: updateError } =
      await adminClient.auth.admin.updateUserById(entry.userId, {
        password: newPassword,
      });

    if (updateError) {
      return NextResponse.json(
        { success: false, message: updateError.message || "Gagal memperbarui kata sandi." },
        { status: 400 }
      );
    }

    // Hapus OTP setelah berhasil digunakan
    otpStore.delete(cleanEmail);

    return NextResponse.json({
      success: true,
      message: "Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru Anda.",
    });
  } catch (err: any) {
    console.error("PUT /api/auth/reset-password error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Terjadi kesalahan saat memperbarui kata sandi." },
      { status: 500 }
    );
  }
}
