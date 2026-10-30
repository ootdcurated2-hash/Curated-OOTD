import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildOtpEmailHtml, isEmailConfigured, sendEmail } from "@/lib/email";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, username, displayName, avatarUrl } = body;

    const cleanEmail = email?.trim()?.toLowerCase();
    const cleanUsername = username?.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Alamat email wajib diisi dengan benar." },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Kata sandi minimal 8 karakter." },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdmin();

    // 1. Generate link & OTP token via Supabase Admin (tanpa trigger error kuota Supabase email)
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "signup",
      email: cleanEmail,
      password,
      options: {
        data: {
          username: cleanUsername,
          display_name: displayName || username,
          avatar_url: avatarUrl || "",
        },
      },
    });

    if (linkError) {
      if (linkError.message?.includes("already registered") || linkError.message?.includes("User already exists")) {
        return NextResponse.json(
          { success: false, message: "Email atau akun ini sudah terdaftar. Silakan langsung masuk." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, message: linkError.message || "Gagal memproses pendaftaran." },
        { status: 400 }
      );
    }

    const otp = linkData?.properties?.email_otp;
    if (!otp) {
      return NextResponse.json(
        { success: false, message: "Gagal membuat kode OTP verifikasi." },
        { status: 500 }
      );
    }

    // 2. Kirim email lewat Gmail API (HTTPS) — SMTP tidak tersedia di Cloudflare Workers
    if (!isEmailConfigured()) {
      console.error("[send-otp] kredensial Gmail API belum diisi — email verifikasi tidak dikirim");
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
      subject: `${otp} adalah Kode Verifikasi Curated OOTD Anda`,
      html: buildOtpEmailHtml({
        otp,
        recipientName: displayName || username,
        intro:
          "Terima kasih telah mendaftar di Curated OOTD. Gunakan kode verifikasi (OTP) berikut untuk menyelesaikan pembuatan akun Anda:",
      }),
    });

    if (!sent.ok) {
      console.error("[send-otp] gagal kirim email:", sent.error);
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
    console.error("POST /api/auth/send-otp error:", err);
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
