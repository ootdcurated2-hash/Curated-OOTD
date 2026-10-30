import { NextRequest, NextResponse } from "next/server";
import { engage, getEngagementStats, type EngagementAction } from "@/lib/blogEngagement";

interface Props {
  params: Promise<{ slug: string }>;
}

const VALID_ACTIONS: EngagementAction[] = ["view", "like", "dislike", "unlike", "undislike"];

// GET — ambil stats (views, likes, dislikes)
export async function GET(_req: NextRequest, { params }: Props) {
  const { slug } = await params;
  const stats = await getEngagementStats(slug);

  return NextResponse.json({
    views: stats.views,
    likes: stats.likes,
    dislikes: stats.dislikes,
  });
}

// POST — catat view / like / dislike / undo (semua disimpan ke DB agar persisten)
export async function POST(req: NextRequest, { params }: Props) {
  const { slug } = await params;
  const body = await req.json().catch(() => ({}));
  const action = (body?.action ?? "view") as EngagementAction;

  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  }

  const result = await engage(slug, action);

  if (!result.ok) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[/api/blog/engage] gagal menyimpan statistik:", result.error);
    }
    return NextResponse.json(
      {
        success: false,
        error: result.error ?? "DB unavailable",
        views: result.views,
        likes: result.likes,
        dislikes: result.dislikes,
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    success: true,
    views: result.views,
    likes: result.likes,
    dislikes: result.dislikes,
  });
}
