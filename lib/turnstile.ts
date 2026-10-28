/**
 * Cloudflare Turnstile Verification Helper
 * Mendukung Site Key & Secret Key resmi dari Cloudflare Dashboard,
 * dengan fallback testing keys otomatis jika env var belum diisi.
 */

export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<{ success: boolean; message?: string }> {
  // Jika token kosong
  if (!token || typeof token !== "string" || !token.trim()) {
    return { success: false, message: "Verifikasi Cloudflare Turnstile diperlukan." };
  }

  // Gunakan Secret Key dari env var, atau dummy testing secret key resmi dari Cloudflare
  // Testing Secret: 1x0000000000000000000000000000000AA (selalu lolos / pass)
  const secretKey =
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY?.trim() ||
    "1x0000000000000000000000000000000AA";

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token.trim());
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const outcome = await res.json();
    if (outcome.success) {
      return { success: true };
    }

    console.warn("[Cloudflare Turnstile] Verification failed:", outcome["error-codes"]);
    return {
      success: false,
      message: "Verifikasi keamanan Cloudflare gagal. Silakan coba lagi.",
    };
  } catch (err) {
    console.error("[Cloudflare Turnstile] Network error:", err);
    // Jika network Cloudflare gagal diakses sementara, biarkan lolos agar user tidak terblokir
    return { success: true };
  }
}
