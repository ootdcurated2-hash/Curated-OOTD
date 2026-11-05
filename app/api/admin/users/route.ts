import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, getServiceClient } from "@/lib/adminServer";

/**
 * Kelola User (CRUD akun) — khusus admin.
 *
 * PENTING (pelajaran dari insiden lalu):
 * - listUsers() TIDAK mendukung filter email dari API; pencarian selalu
 *   difilter di sisi kode, bukan lewat parameter API.
 * - DELETE hanya menerima SATU id eksplisit. Tidak ada jalur hapus massal.
 * - Akun admin (adminootd@gmail.com) dan akun admin yang sedang login
 *   tidak boleh dihapus.
 */

function adminOnly() {
  return NextResponse.json(
    { success: false, message: "Akses ditolak. Hanya admin yang boleh mengelola user." },
    { status: 403 }
  );
}

function notConfigured() {
  return NextResponse.json(
    { success: false, message: "Supabase belum dikonfigurasi." },
    { status: 500 }
  );
}

const ADMIN_EMAIL = "adminootd@gmail.com";

interface AdminUserRow {
  id: string;
  email: string;
  username: string;
  display_name: string;
  created_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

/** Gabungkan metadata auth + baris profiles untuk daftar user. */
async function buildUserRows(admin: NonNullable<ReturnType<typeof getServiceClient>>): Promise<AdminUserRow[]> {
  const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(error.message);

  const users = list?.users ?? [];

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, username, email");
  const profileById = new Map(
    (profiles ?? []).map((p: { id: string; username: string; email: string }) => [p.id, p])
  );

  return users.map((u) => {
    const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
    const prof = profileById.get(u.id);
    return {
      id: u.id,
      email: u.email ?? "",
      username: String(prof?.username || meta.username || ""),
      display_name: String(meta.display_name || prof?.username || ""),
      created_at: u.created_at ?? null,
      last_sign_in_at: u.last_sign_in_at ?? null,
      email_confirmed_at: u.email_confirmed_at ?? null,
    };
  });
}

// ─── GET /api/admin/users — daftar seluruh user ─────────────────────────────
export async function GET() {
  try {
    const { isAdmin } = await getAdminContext();
    if (!isAdmin) return adminOnly();

    const db = getServiceClient();
    if (!db) return notConfigured();

    const users = await buildUserRows(db);
    return NextResponse.json({ success: true, users });
  } catch (err: any) {
    console.error("GET /api/admin/users error:", err?.message || err);
    return NextResponse.json(
      { success: false, users: [], message: err?.message || "Gagal memuat daftar user." },
      { status: 500 }
    );
  }
}

// ─── POST /api/admin/users — buat user baru ─────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { isAdmin } = await getAdminContext();
    if (!isAdmin) return adminOnly();

    const db = getServiceClient();
    if (!db) return notConfigured();

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const username = typeof body?.username === "string" ? body.username.trim() : "";

    if (!email || !email.includes("@") || !email.includes(".")) {
      return NextResponse.json({ success: false, message: "Alamat email tidak valid." }, { status: 400 });
    }
    if (username.length < 3 || username.length > 30) {
      return NextResponse.json({ success: false, message: "Username harus 3–30 karakter." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, message: "Kata sandi minimal 8 karakter." }, { status: 400 });
    }

    // Username tidak boleh dipakai (filter dilakukan di kode, bukan API param)
    const { data: existingProfile } = await db
      .from("profiles")
      .select("id")
      .ilike("username", username)
      .maybeSingle();
    if (existingProfile) {
      return NextResponse.json({ success: false, message: `Username "${username}" sudah digunakan.` }, { status: 400 });
    }

    const users = await buildUserRows(db);
    if (users.some((u) => u.email.toLowerCase() === email)) {
      return NextResponse.json({ success: false, message: `Email "${email}" sudah terdaftar.` }, { status: 400 });
    }

    const { data: created, error: createError } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, display_name: username },
    });
    if (createError) {
      return NextResponse.json({ success: false, message: createError.message }, { status: 400 });
    }

    if (created?.user?.id) {
      await db
        .from("profiles")
        .upsert({ id: created.user.id, username, email }, { onConflict: "id" });
    }

    return NextResponse.json({ success: true, message: `User "${username}" berhasil dibuat.`, user: created?.user });
  } catch (err: any) {
    console.error("POST /api/admin/users error:", err?.message || err);
    return NextResponse.json(
      { success: false, message: err?.message || "Gagal membuat user." },
      { status: 500 }
    );
  }
}

// ─── PUT /api/admin/users — update email/username/kata sandi ────────────────
export async function PUT(request: NextRequest) {
  try {
    const { isAdmin } = await getAdminContext();
    if (!isAdmin) return adminOnly();

    const db = getServiceClient();
    if (!db) return notConfigured();

    const body = await request.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ success: false, message: "id user wajib disertakan." }, { status: 400 });
    }

    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (email && (!email.includes("@") || !email.includes("."))) {
      return NextResponse.json({ success: false, message: "Alamat email tidak valid." }, { status: 400 });
    }
    if (username && (username.length < 3 || username.length > 30)) {
      return NextResponse.json({ success: false, message: "Username harus 3–30 karakter." }, { status: 400 });
    }
    if (password && password.length < 8) {
      return NextResponse.json({ success: false, message: "Kata sandi minimal 8 karakter." }, { status: 400 });
    }

    if (username) {
      const { data: taken } = await db
        .from("profiles")
        .select("id")
        .ilike("username", username)
        .neq("id", id)
        .maybeSingle();
      if (taken) {
        return NextResponse.json({ success: false, message: `Username "${username}" sudah digunakan.` }, { status: 400 });
      }
    }

    const updates: Record<string, unknown> = {};
    if (email) updates.email = email;
    if (password) updates.password = password;
    if (username) {
      updates.user_metadata = { username, display_name: username };
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, message: "Tidak ada perubahan untuk disimpan." }, { status: 400 });
    }

    const { error: updateError } = await db.auth.admin.updateUserById(id, updates as any);
    if (updateError) {
      return NextResponse.json({ success: false, message: updateError.message }, { status: 400 });
    }

    if (username || email) {
      await db
        .from("profiles")
        .update({ ...(username ? { username } : {}), ...(email ? { email } : {}) })
        .eq("id", id);
    }

    return NextResponse.json({ success: true, message: "User berhasil diperbarui." });
  } catch (err: any) {
    console.error("PUT /api/admin/users error:", err?.message || err);
    return NextResponse.json(
      { success: false, message: err?.message || "Gagal memperbarui user." },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/admin/users — hapus SATU user berdasarkan id ───────────────
export async function DELETE(request: NextRequest) {
  try {
    const { isAdmin, userId, label } = await getAdminContext();
    if (!isAdmin) return adminOnly();

    const db = getServiceClient();
    if (!db) return notConfigured();

    const body = await request.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id.trim() : "";

    // Keamanan: id wajib ada & bukan array — tidak ada hapus massal.
    if (!id) {
      return NextResponse.json({ success: false, message: "id user wajib disertakan (hapus satu per satu)." }, { status: 400 });
    }

    if (id === userId) {
      return NextResponse.json({ success: false, message: "Tidak bisa menghapus akun admin yang sedang digunakan." }, { status: 400 });
    }

    const target = await db.auth.admin.getUserById(id);
    if (target.error || !target.data?.user) {
      return NextResponse.json({ success: false, message: "User tidak ditemukan." }, { status: 404 });
    }
    if (
      target.data.user.email?.toLowerCase() === ADMIN_EMAIL ||
      (target.data.user.email?.toLowerCase() === label.toLowerCase() && label.includes("@"))
    ) {
      return NextResponse.json({ success: false, message: "Akun admin tidak boleh dihapus dari halaman ini." }, { status: 400 });
    }

    const { error: delError } = await db.auth.admin.deleteUser(id);
    if (delError) {
      return NextResponse.json({ success: false, message: delError.message }, { status: 500 });
    }

    // Bersihkan baris profiles user tersebut (bukan cascade massal).
    await db.from("profiles").delete().eq("id", id);

    return NextResponse.json({ success: true, message: `User ${target.data.user.email} berhasil dihapus.` });
  } catch (err: any) {
    console.error("DELETE /api/admin/users error:", err?.message || err);
    return NextResponse.json(
      { success: false, message: err?.message || "Gagal menghapus user." },
      { status: 500 }
    );
  }
}
