import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    const { email, password, username, captchaAnswer, captchaToken } = body;

    const cleanEmail = email?.trim()?.toLowerCase();
    const cleanUsername = username?.trim();

    // 1. Validasi Input Dasar
    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 30) {
      return NextResponse.json(
        { success: false, message: "Username harus memiliki panjang 3 hingga 30 karakter." },
        { status: 400 }
      );
    }

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Alamat email tidak valid." },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Kata sandi minimal 8 karakter." },
        { status: 400 }
      );
    }

    // 2. Validasi Captcha
    if (!captchaAnswer || !captchaToken) {
      return NextResponse.json(
        { success: false, message: "Silakan selesaikan captcha terlebih dahulu." },
        { status: 400 }
      );
    }

    try {
      // Dekripsi token captcha sederhana (Base64 encoded: expectedAnswer:timestamp)
      const decoded = Buffer.from(captchaToken, "base64").toString("utf-8");
      const [expectedAnswer, timestampStr] = decoded.split(":");
      const timestamp = parseInt(timestampStr, 10);

      // Kadaluarsa setelah 5 menit
      if (Date.now() - timestamp > 5 * 60 * 1000) {
        return NextResponse.json(
          { success: false, message: "Captcha sudah kadaluarsa. Silakan refresh captcha baru." },
          { status: 400 }
        );
      }

      if (String(captchaAnswer).trim() !== String(expectedAnswer).trim()) {
        return NextResponse.json(
          { success: false, message: "Jawaban captcha salah. Silakan coba lagi." },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, message: "Validasi captcha gagal. Silakan muat ulang captcha." },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    // 3. Pengecekan Eksistensi Username (Penyebab utama error 'Database error saving new user')
    const { data: existingUser } = await admin
      .from("profiles")
      .select("id, username")
      .ilike("username", cleanUsername)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: `Username "${cleanUsername}" sudah digunakan oleh orang lain. Silakan pilih username lain.`,
        },
        { status: 400 }
      );
    }

    // 4. Pengecekan Eksistensi Email
    const { data: existingEmail } = await admin
      .from("profiles")
      .select("id, email")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          message: `Email "${cleanEmail}" sudah terdaftar. Silakan langsung masuk/login.`,
        },
        { status: 400 }
      );
    }

    // 5. Buat Akun Baru (Langsung aktif / email_confirm = true tanpa perlu OTP email)
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        username: cleanUsername,
        display_name: cleanUsername,
      },
    });

    if (createError) {
      if (createError.message?.includes("already registered") || createError.message?.includes("already exists")) {
        return NextResponse.json(
          { success: false, message: "Email ini sudah terdaftar. Silakan login." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, message: createError.message || "Gagal membuat akun." },
        { status: 400 }
      );
    }

    // Pastikan baris profile tersinkron
    if (newUser?.user?.id) {
      await admin.from("profiles").upsert(
        {
          id: newUser.user.id,
          username: cleanUsername,
          email: cleanEmail,
        },
        { onConflict: "id" }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Akun berhasil dibuat! Silakan masuk.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Terjadi kesalahan server saat mendaftar." },
      { status: 500 }
    );
  }
}
