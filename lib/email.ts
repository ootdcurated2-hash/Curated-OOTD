/**
 * Pengiriman email lewat Gmail API (HTTPS + OAuth2) — BUKAN SMTP.
 *
 * Kenapa bukan nodemailer/SMTP?
 * Cloudflare Workers tidak menyediakan TCP socket, sehingga koneksi SMTP
 * akan selalu gagal di runtime Workers. Gmail API hanya memakai `fetch`.
 * Email benar-benar terkirim dari mailbox Gmail, bukan layanan pihak ketiga.
 *
 * Env var:
 * - GMAIL_CLIENT_ID      : OAuth client id dari Google Cloud Console
 * - GMAIL_CLIENT_SECRET  : OAuth client secret pasangan id di atas
 * - GMAIL_REFRESH_TOKEN  : refresh token scope https://www.googleapis.com/auth/gmail.send
 * - EMAIL_FROM          : wajib SAMA dengan mailbox Gmail yang dipakai authorize
 * - EMAIL_FROM_NAME     : nama pengirim (opsional, default "Curated OOTD")
 *
 * PENTING: OAuth consent screen harus berstatus "In production". Selama masih
 * "Testing", Google menjadwalkan ulang refresh token setiap 7 hari.
 */

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GMAIL_SEND_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

const DEFAULT_FROM = "ootdcurated@gmail.com";
const DEFAULT_FROM_NAME = "Curated OOTD";

export type SendEmailResult = { ok: true } | { ok: false; error: string };

function getEnv(name: string): string {
  return (process.env[name] || "").trim();
}

function getFromEmail(): string {
  return getEnv("EMAIL_FROM") || DEFAULT_FROM;
}

function getFromName(): string {
  return getEnv("EMAIL_FROM_NAME") || DEFAULT_FROM_NAME;
}

/** True bila kredensial Gmail API sudah lengkap. */
export function isEmailConfigured(): boolean {
  return Boolean(
    getEnv("GMAIL_CLIENT_ID") && getEnv("GMAIL_CLIENT_SECRET") && getEnv("GMAIL_REFRESH_TOKEN"),
  );
}

// Access token di-cache per isolate. Ini kredensial aplikasi (bukan data user),
// jadi hilang saat isolate didaur ulang tidak masalah: akan diambil lagi.
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

type AccessTokenResult = { token: string } | { error: string };

async function getAccessToken(): Promise<AccessTokenResult> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return { token: cachedAccessToken.token };
  }

  const clientId = getEnv("GMAIL_CLIENT_ID");
  const clientSecret = getEnv("GMAIL_CLIENT_SECRET");
  const refreshToken = getEnv("GMAIL_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    return {
      error:
        "Kredensial Gmail API belum lengkap (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN)",
    };
  }

  try {
    const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const payload = (await res.json().catch(() => ({}))) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };

    if (!res.ok || !payload.access_token) {
      const reason = payload.error_description || payload.error || `HTTP ${res.status}`;
      if (payload.error === "invalid_grant") {
        return {
          error:
            `Refresh token Gmail API ditolak (${reason}). ` +
            'Pastikan OAuth consent screen sudah "In production" dan token belum di-revoke.',
        };
      }
      return { error: `Gagal mengambil access token Google: ${reason}` };
    }

    cachedAccessToken = {
      token: payload.access_token,
      // Google memberi umur 1 jam; kita segarkan 60 detik lebih awal.
      expiresAt: Date.now() + Math.max(60, (payload.expires_in ?? 3600) - 60) * 1000,
    };

    return { token: payload.access_token };
  } catch (err) {
    const message =
      err instanceof Error && err.message ? err.message : "Kesalahan jaringan saat menghubungi Google";
    return { error: message };
  }
}

/**
 * Kirim satu email HTML lewat Gmail API. Tidak pernah melempar exception —
 * kegagalan dikembalikan sebagai { ok: false, error }.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendEmailResult> {
  const token = await getAccessToken();
  if ("error" in token) {
    return { ok: false, error: token.error };
  }

  try {
    const raw = buildRawMessage({
      from: formatAddress(getFromName(), getFromEmail()),
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    const res = await fetch(GMAIL_SEND_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token.token}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ raw }),
    });

    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 240);
      return { ok: false, error: `Gmail API balasan ${res.status}: ${detail}` };
    }

    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error && err.message ? err.message : "Kesalahan jaringan saat mengirim email";
    return { ok: false, error: message };
  }
}

// ── Pembentuk pesan RFC 2822 (dibutuhkan Gmail API) ──────────────────────────

function buildRawMessage(params: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}): string {
  const boundary = `curatedootd.${crypto.randomUUID()}`;
  const plain =
    params.text ??
    params.html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const message = [
    `From: ${params.from}`,
    `To: ${encodeHeaderValue(params.to)}`,
    `Subject: ${encodeHeaderValue(params.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    toBase64(plain),
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    toBase64(params.html),
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");

  return toBase64Url(new TextEncoder().encode(message));
}

function formatAddress(name: string, email: string): string {
  const cleanName = encodeHeaderValue(name);
  return cleanName ? `${cleanName} <${email}>` : email;
}

/** Bersihkan baris baru + encode nilai header non-ASCII (RFC 2047). */
function encodeHeaderValue(value: string): string {
  const clean = value.replace(/[\r\n]+/g, " ").trim();
  if (/^[\x20-\x7E]*$/.test(clean)) return clean;
  return `=?UTF-8?B?${toBase64(clean)}?=`;
}

function toBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    for (const byte of chunk) binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Template email OTP (verification / reset password) dengan gaya sesuai brand.
 * `intro` dan `note` bebas, `otp` disisipkan di kotak kode.
 */
export function buildOtpEmailHtml(options: {
  otp: string;
  recipientName?: string;
  intro: string;
  note?: string;
}): string {
  const name = options.recipientName?.trim();
  const greeting = name
    ? `<p style="color: #2d3748; font-size: 14px; font-weight: 600;">Halo <strong>${escapeHtml(name)}</strong>,</p>`
    : `<p style="color: #2d3748; font-size: 14px; font-weight: 600;">Halo,</p>`;
  const note = options.note
    ? `<br/>${escapeHtml(options.note)}`
    : "";

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #fed7e2; border-radius: 16px; background-color: #fff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #ff2b85; margin: 0; font-size: 24px; font-weight: 900;">Curated OOTD</h1>
        <p style="color: #718096; font-size: 13px; margin-top: 4px;">Pusat Inspirasi Fashion &amp; Koleksi Gaya</p>
      </div>
      ${greeting}
      <p style="color: #4a5568; font-size: 13px; line-height: 1.6;">${escapeHtml(options.intro)}</p>
      <div style="text-align: center; margin: 28px 0;">
        <span style="display: inline-block; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #ff2b85; background: #fff1f5; border: 2px dashed #ff2b85; padding: 12px 28px; border-radius: 12px;">
          ${escapeHtml(options.otp)}
        </span>
      </div>
      <p style="color: #a0aec0; font-size: 11px; text-align: center; margin-top: 24px;">Kode ini hanya berlaku selama 10 menit. Jangan bagikan kode ini kepada siapa pun.${note}</p>
    </div>
  `;
}

/** Cegah sisipan HTML dari data user (nama, dsb.) ke dalam template email. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
