import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/adminServer";
import {
  deleteFeedback,
  listAllFeedback,
  moderateFeedback,
  type BlogFeedbackStatus,
} from "@/lib/blogFeedback";

const VALID_STATUSES: BlogFeedbackStatus[] = ["pending", "approved", "rejected"];

function adminOnly() {
  return NextResponse.json(
    { success: false, message: "Akses ditolak. Hanya admin yang boleh melakukan aksi ini." },
    { status: 403 }
  );
}

// ─── GET /api/admin/blog-feedback ───────────────────────────
// Semua catatan (pending + approved + rejected) untuk moderasi.
export async function GET() {
  const { isAdmin } = await getAdminContext();
  if (!isAdmin) return adminOnly();

  const result = await listAllFeedback();
  if (!result.success) {
    return NextResponse.json(
      { success: false, feedback: [], message: result.message },
      { status: result.missingTable ? 503 : 500 }
    );
  }

  return NextResponse.json({ success: true, feedback: result.data ?? [] });
}

// ─── PATCH /api/admin/blog-feedback ─────────────────────────
// Setujui / tolak catatan. Body: { id, status }
export async function PATCH(req: NextRequest) {
  const { isAdmin, label } = await getAdminContext();
  if (!isAdmin) return adminOnly();

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const status = body?.status;

  if (!id) {
    return NextResponse.json({ success: false, message: "id catatan wajib ada." }, { status: 400 });
  }
  if (typeof status !== "string" || !VALID_STATUSES.includes(status as BlogFeedbackStatus)) {
    return NextResponse.json(
      { success: false, message: "Status harus pending, approved, atau rejected." },
      { status: 400 }
    );
  }

  const result = await moderateFeedback(id, status as BlogFeedbackStatus, label);
  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.missingTable ? 503 : 500 }
    );
  }

  const message =
    status === "approved"
      ? "Catatan disetujui dan sekarang tampil di artikel."
      : status === "rejected"
        ? "Catatan ditolak dan tidak ditampilkan ke publik."
        : "Catatan dikembalikan ke antrean peninjauan.";

  return NextResponse.json({ success: true, feedback: result.data, message });
}

// ─── DELETE /api/admin/blog-feedback?id=... ─────────────────
export async function DELETE(req: NextRequest) {
  const { isAdmin } = await getAdminContext();
  if (!isAdmin) return adminOnly();

  let id = req.nextUrl.searchParams.get("id") || "";
  if (!id) {
    const body = await req.json().catch(() => null);
    id = typeof body?.id === "string" ? body.id : "";
  }

  if (!id) {
    return NextResponse.json({ success: false, message: "id catatan wajib ada." }, { status: 400 });
  }

  const result = await deleteFeedback(id);
  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.missingTable ? 503 : 500 }
    );
  }

  return NextResponse.json({ success: true, message: "Catatan berhasil dihapus." });
}
