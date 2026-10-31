import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, getServiceClient } from "@/lib/adminServer";
import { NOTIFICATION_COLUMNS, type AdminNotification } from "@/lib/reviews";

// Jumlah notifikasi terbaru yang dikirim ke lonceng dashboard admin
const LIMIT = 30;

function adminOnly() {
  return NextResponse.json(
    { success: false, message: "Akses ditolak. Hanya admin yang boleh mengakses notifikasi." },
    { status: 403 }
  );
}

function notConfigured() {
  return NextResponse.json(
    { success: false, notifications: [], unreadCount: 0, message: "Supabase belum dikonfigurasi." },
    { status: 500 }
  );
}

// ─── GET /api/admin/notifications ───────────────────────────
// Daftar notifikasi terbaru + jumlah yang belum dibaca.
// Tabel admin_notifications sengaja tanpa policy RLS, sehingga hanya bisa
// dibaca lewat service role di route ini setelah role admin divalidasi.
export async function GET() {
  try {
    const { isAdmin } = await getAdminContext();
    if (!isAdmin) return adminOnly();

    const db = getServiceClient();
    if (!db) return notConfigured();

    const { data, error } = await db
      .from("admin_notifications")
      .select(NOTIFICATION_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(LIMIT);

    if (error) {
      console.error("Gagal memuat notifikasi admin:", error.message);
      return NextResponse.json(
        { success: false, notifications: [], unreadCount: 0, message: "Gagal memuat notifikasi." },
        { status: 500 }
      );
    }

    const { count } = await db
      .from("admin_notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);

    return NextResponse.json({
      success: true,
      notifications: (data as AdminNotification[]) ?? [],
      unreadCount: count ?? 0,
    });
  } catch (error: any) {
    console.error("GET /api/admin/notifications error:", error?.message || error);
    return NextResponse.json(
      { success: false, notifications: [], unreadCount: 0, message: "Gagal memuat notifikasi." },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/admin/notifications ─────────────────────────
// Menandai notifikasi sebagai sudah dibaca.
// Body: { ids: string[] } atau { id: string } atau { all: true }
export async function PATCH(request: NextRequest) {
  try {
    const { isAdmin } = await getAdminContext();
    if (!isAdmin) return adminOnly();

    const db = getServiceClient();
    if (!db) return notConfigured();

    const body = await request.json().catch(() => null);
    const now = new Date().toISOString();

    if (body?.all === true) {
      const { error } = await db
        .from("admin_notifications")
        .update({ is_read: true, read_at: now })
        .eq("is_read", false);

      if (error) {
        console.error("Gagal menandai notifikasi:", error.message);
        return NextResponse.json(
          { success: false, message: "Notifikasi gagal diperbarui." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: "Semua notifikasi ditandai sudah dibaca." });
    }

    const ids: string[] = Array.isArray(body?.ids)
      ? body.ids.filter((value: unknown): value is string => typeof value === "string")
      : typeof body?.id === "string"
        ? [body.id]
        : [];

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "id notifikasi wajib disertakan." },
        { status: 400 }
      );
    }

    const { error } = await db
      .from("admin_notifications")
      .update({ is_read: true, read_at: now })
      .in("id", ids)
      .eq("is_read", false);

    if (error) {
      console.error("Gagal menandai notifikasi:", error.message);
      return NextResponse.json(
        { success: false, message: "Notifikasi gagal diperbarui." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Notifikasi ditandai sudah dibaca." });
  } catch (error: any) {
    console.error("PATCH /api/admin/notifications error:", error?.message || error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat memperbarui notifikasi." },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/admin/notifications ──────────────────────────
// Menghapus notifikasi. Body: { ids: string[] } atau { id: string } atau { all: true }
export async function DELETE(request: NextRequest) {
  try {
    const { isAdmin } = await getAdminContext();
    if (!isAdmin) return adminOnly();

    const db = getServiceClient();
    if (!db) return notConfigured();

    const body = await request.json().catch(() => null);

    if (body?.all === true) {
      const { error } = await db
        .from("admin_notifications")
        .delete()
        .not("id", "is", null);

      if (error) {
        console.error("Gagal menghapus notifikasi:", error.message);
        return NextResponse.json(
          { success: false, message: "Notifikasi gagal dihapus." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: "Semua notifikasi dihapus." });
    }

    const ids: string[] = Array.isArray(body?.ids)
      ? body.ids.filter((value: unknown): value is string => typeof value === "string")
      : typeof body?.id === "string"
        ? [body.id]
        : [];

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "id notifikasi wajib disertakan." },
        { status: 400 }
      );
    }

    const { error } = await db
      .from("admin_notifications")
      .delete()
      .in("id", ids);

    if (error) {
      console.error("Gagal menghapus notifikasi:", error.message);
      return NextResponse.json(
        { success: false, message: "Notifikasi gagal dihapus." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Notifikasi dihapus." });
  } catch (error: any) {
    console.error("DELETE /api/admin/notifications error:", error?.message || error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat menghapus notifikasi." },
      { status: 500 }
    );
  }
}
