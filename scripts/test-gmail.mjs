// Tes koneksi Gmail API memakai kredensial di .env.local.
// Jalankan: node scripts/test-gmail.mjs <email-tujuan>
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const env = {};
for (const line of readFileSync(resolve(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/i);
  if (m) env[m[1]] = m[2].trim();
}

const to = process.argv[2] || env.EMAIL_FROM || "ootdcurated@gmail.com";
const missing = ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN"].filter(
  (key) => !env[key]
);

if (missing.length) {
  console.log(`LENGKAP DULU di .env.local -> ${missing.join(", ")} masih kosong`);
  process.exit(1);
}

function toBase64(value) {
  return btoa(Array.from(new TextEncoder().encode(value), (b) => String.fromCharCode(b)).join(""));
}

// ── Langkah 1: refresh token -> access token ────────────────────────────────
const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: env.GMAIL_CLIENT_ID,
    client_secret: env.GMAIL_CLIENT_SECRET,
    refresh_token: env.GMAIL_REFRESH_TOKEN,
    grant_type: "refresh_token",
  }),
});

const tokenJson = await tokenRes.json().catch(() => ({}));

if (!tokenRes.ok || !tokenJson.access_token) {
  console.log(`LANGKAH 1 (access token): GAGAL ${tokenRes.status}`);
  console.log(`RESPON: ${JSON.stringify(tokenJson).slice(0, 400)}`);
  console.log('\nCatatan: "invalid_grant" = refresh token salah/kedaluwarsa/di-revoke,');
  console.log('         atau OAuth consent screen masih berstatus "Testing".');
  process.exit(1);
}

console.log("LANGKAH 1 (access token): OK");

// ── Langkah 2: kirim email sungguhan ────────────────────────────────────────
const boundary = `curatedootd.${crypto.randomUUID()}`;
const html =
  "<p>Halo, ini tes bahwa <strong>Curated OOTD</strong> bisa mengirim email langsung dari akun Gmail.</p>";

const message = [
  `From: ${env.EMAIL_FROM_NAME || "Curated OOTD"} <${env.EMAIL_FROM}>`,
  `To: ${to}`,
  "Subject: Tes koneksi Gmail API - Curated OOTD",
  `Date: ${new Date().toUTCString()}`,
  "MIME-Version: 1.0",
  `Content-Type: multipart/alternative; boundary="${boundary}"`,
  "",
  `--${boundary}`,
  'Content-Type: text/plain; charset="UTF-8"',
  "Content-Transfer-Encoding: base64",
  "",
  toBase64("Halo, ini tes bahwa Curated OOTD bisa mengirim email langsung dari akun Gmail."),
  "",
  `--${boundary}`,
  'Content-Type: text/html; charset="UTF-8"',
  "Content-Transfer-Encoding: base64",
  "",
  toBase64(html),
  "",
  `--${boundary}--`,
  "",
].join("\r\n");

const raw = toBase64(message).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
  method: "POST",
  headers: {
    authorization: `Bearer ${tokenJson.access_token}`,
    "content-type": "application/json",
    accept: "application/json",
  },
  body: JSON.stringify({ raw }),
});

const sendText = await sendRes.text().catch(() => "");

console.log(`LANGKAH 2 (kirim ke ${to}): STATUS ${sendRes.status}`);
if (!sendRes.ok) console.log(`RESPON: ${sendText.slice(0, 400)}`);
console.log(sendRes.ok ? "HASIL: EMAIL TERKIRIM DARI GMAIL" : "HASIL: GAGAL");
