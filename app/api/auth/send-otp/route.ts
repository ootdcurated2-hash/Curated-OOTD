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

export async function POST(req: NextRequest) {
  try {
    const gmailUser = (process.env.GMAIL_USER || "ootdcurated@gmail.com").trim();
    const gmailPassword = (process.env.GMAIL_APP_PASSWORD || "").trim();
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

    // 2. Kirim email via Gmail SMTP jika gmailPassword telah dikonfigurasi
    if (gmailPassword) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: gmailUser,
            pass: gmailPassword,
          },
        });

        await transporter.sendMail({
          from: `"Curated OOTD" <${gmailUser}>`,
          to: cleanEmail,
          subject: `${otp} adalah Kode Verifikasi Curated OOTD Anda`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #fed7e2; border-radius: 16px; background-color: #fff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #ff2b85; margin: 0; font-size: 24px; font-weight: 900;">Curated OOTD</h1>
                <p style="color: #718096; font-size: 13px; margin-top: 4px;">Pusat Inspirasi Fashion & Koleksi Gaya</p>
              </div>
              <p style="color: #2d3748; font-size: 14px; font-weight: 600;">Halo <strong>${displayName || username}</strong>,</p>
              <p style="color: #4a5568; font-size: 13px; line-height: 1.6;">Terima kasih telah mendaftar di Curated OOTD. Gunakan kode verifikasi (OTP) berikut untuk menyelesaikan pembuatan akun Anda:</p>
              <div style="text-align: center; margin: 28px 0;">
                <span style="display: inline-block; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #ff2b85; background: #fff1f5; border: 2px dashed #ff2b85; padding: 12px 28px; border-radius: 12px;">
                  ${otp}
                </span>
              </div>
              <p style="color: #a0aec0; font-size: 11px; text-align: center; margin-top: 24px;">Kode ini hanya berlaku selama 10 menit. Jangan bagikan kode ini kepada siapa pun.</p>
            </div>
          `,
        });

        return NextResponse.json({
          success: true,
          message: `Kode OTP berhasil dikirim ke ${cleanEmail}`,
        });
      } catch (mailError: any) {
        console.error("Gagal mengirim email via Gmail SMTP:", mailError);
        // Jika gagal mengirim via SMTP, kembalikan OTP dalam mode dev/fallback
        return NextResponse.json({
          success: true,
          devOtp: otp,
          message: `Kode OTP Anda: ${otp} (Pengiriman Gmail memerlukan App Password di .env.local)`,
        });
      }
    }

    // Fallback jika belum pasang GMAIL_APP_PASSWORD di .env.local:
    // Beritahukan kode langsung ke user agar pendaftaran TIDAK pernah macet!
    return NextResponse.json({
      success: true,
      devOtp: otp,
      message: `Kode verifikasi OTP Anda adalah ${otp}.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
