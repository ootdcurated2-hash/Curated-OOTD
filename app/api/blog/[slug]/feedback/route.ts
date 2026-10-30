import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import {
  MAX_NAME_LENGTH,
  MAX_NOTE_LENGTH,
  createFeedback,
  getPublicFeedback,
  hasRecentFeedback,
  type FeedbackVote,
} from "@/lib/blogFeedback";

interface Props {
  params: Promise<{ slug: string }>;
}

const VOTES: FeedbackVote[] = ["like", "dislike"];
const MIN_NOTE_LENGTH = 3;

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

// ─── GET /api/blog/[slug]/feedback ──────────────────────────
// Catatan pembaca yang sudah disetujui admin (tampilan publik).
export async function GET(_req: NextRequest, { params }: Props) {
  const { slug } = await params;
  const result = await getPublicFeedback(slug);

  if (!result.success) {
    return NextResponse.json(
      { success: false, feedback: [], message: result.message },
      { status: result.missingTable ? 503 : 500 }
    );
  }

  return NextResponse.json({ success: true, feedback: result.data ?? [] });
}

// ─── POST /api/blog/[slug]/feedback ─────────────────────────
// Menyimpan catatan baru. Status selalu 'pending' (butuh persetujuan admin).
// Tamu wajib lolos verifikasi Turnstile; pengguna login tidak.
export async function POST(req: NextRequest, { params }: Props) {
  const { slug } = await params;
  const body = await req.json().catch(() => null);

  const vote = body?.vote as FeedbackVote;
  if (!VOTES.includes(vote)) {
    return NextResponse.json(
      { success: false, message: "Pilih dulu salah satu: suka atau tidak suka." },
      { status: 400 }
    );
  }

  const note = cleanText(body?.note, MAX_NOTE_LENGTH);
  if (note.length < MIN_NOTE_LENGTH) {
    return NextResponse.json(
      { success: false, message: "Tulis catatan minimal 3 karakter ya." },
      { status: 400 }
    );
  }

  // Identitas pengirim
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user ?? null;

  let displayName = "";
  let avatarUrl = "";

  if (user) {
    displayName =
      user.user_metadata?.username ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Pengguna";

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.username) displayName = profile.username;
    if (profile?.avatar_url) avatarUrl = profile.avatar_url;
  } else {
    // Tamu: nama bebas (opsional) + wajib Turnstile
    displayName = cleanText(body?.name, MAX_NAME_LENGTH) || "Pembaca";

    const verification = await verifyTurnstileToken(String(body?.turnstileToken ?? ""));
    if (!verification.success) {
      return NextResponse.json(
        { success: false, message: verification.message ?? "Verifikasi keamanan gagal." },
        { status: 403 }
      );
    }
  }

  // Tahan spam: 1 catatan per pengirim per artikel per 10 menit
  const tooSoon = await hasRecentFeedback(slug, user?.id ?? null, displayName, 10);
  if (tooSoon) {
    return NextResponse.json(
      { success: false, message: "Kamu baru saja mengirim catatan. Tunggu sebentar ya." },
      { status: 429 }
    );
  }

  const result = await createFeedback({
    slug,
    vote,
    note,
    userId: user?.id ?? null,
    displayName,
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message ?? "Catatan gagal disimpan." },
      { status: result.missingTable ? 503 : 500 }
    );
  }

  return NextResponse.json({
    success: true,
    avatarUrl,
    displayName,
    message:
      "Catatan terkirim! Catatan kamu akan tampil setelah disetujui admin.",
  });
}
