import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildOtpEmailHtml, isEmailConfigured, sendEmail } from "@/lib/email";
import { deleteResetOtp, storeResetOtp, verifyResetOtp } from "@/lib/resetOtpStore";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── 1. POST: Kirim OTP Reset Password ──────────────────────────────────────
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

    // Simpan OTP di database (10 menit) — bukan di memori proses, karena
    // Cloudflare Workers memakai banyak isolate yang tidak saling berbagi memori.
    await storeResetOtp(adminClient, {
      email: cleanEmail,
      userId: existingUser.id,
      otp,
    });

    // Kirim lewat Gmail API (HTTPS) — SMTP tidak tersedia di Cloudflare Workers
    if (!isEmailConfigured()) {
      console.error("[reset-password] kredensial Gmail API belum diisi — email reset tidak dikirim");
      return NextResponse.json(
        {
          success: false,
          message:
            "Layanan email belum aktif. Silakan coba beberapa saat lagi atau hubungi admin.",
          // Kode HANYA dikembalikan saat dev — jangan pernah bocorkan OTP di production
          ...(process.env.NODE_ENV !== "production" ? { devOtp: otp } : {}),
        },
        { status: 503 }
      );
    }

    const sent = await sendEmail({
      to: cleanEmail,
      subject: `${otp} adalah Kode Reset Kata Sandi Curated OOTD Anda`,
      html: buildOtpEmailHtml({
        otp,
        intro:
          "Kami menerima permintaan untuk mengatur ulang kata sandi akun Curated OOTD Anda. Gunakan kode verifikasi (OTP) berikut:",
        note: "Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini.",
      }),
    });

    if (!sent.ok) {
      console.error("[reset-password] gagal kirim email:", sent.error);
      return NextResponse.json(
        { success: false, message: "Kode OTP gagal dikirim. Periksa alamat email lalu coba lagi." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Kode OTP berhasil dikirim ke ${cleanEmail}`,
    });
  } catch (err) {
    console.error("POST /api/auth/reset-password error:", err);
    return NextResponse.json(
      {
        success: false,
        message:
          err instanceof Error && err.message
            ? err.message
            : "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}

// ── 2. PUT: Verifikasi OTP dari database + Update Password ────────────────────
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

    // Verifikasi OTP — dibaca dari database (sekali pakai, otomatis terhapus saat cocok)
    const adminClient = getSupabaseAdmin();
    const verified = await verifyResetOtp(adminClient, cleanEmail, cleanOtp);

    if (!verified.ok) {
      const message =
        verified.reason === "expired"
          ? "Kode OTP telah kadaluarsa. Silakan minta kode baru."
          : verified.reason === "wrong_code"
            ? "Kode OTP yang Anda masukkan salah. Periksa kembali email Anda."
            : "Tidak ada permintaan reset yang aktif untuk email ini. Silakan minta kode baru.";

      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    // OTP valid — update password via Supabase Admin
    const { error: updateError } =
      await adminClient.auth.admin.updateUserById(verified.userId, {
        password: newPassword,
      });

    if (updateError) {
      return NextResponse.json(
        { success: false, message: updateError.message || "Gagal memperbarui kata sandi." },
        { status: 400 }
      );
    }

    // Pastikan jejak OTP (termasuk cadangan di memori) benar-benar hilang
    await deleteResetOtp(adminClient, cleanEmail);

    return NextResponse.json({
      success: true,
      message: "Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru Anda.",
    });
  } catch (err) {
    console.error("PUT /api/auth/reset-password error:", err);
    return NextResponse.json(
      {
        success: false,
        message:
          err instanceof Error && err.message
            ? err.message
            : "Terjadi kesalahan saat memperbarui kata sandi.",
      },
      { status: 500 }
    );
  }
}
