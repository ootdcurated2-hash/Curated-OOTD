import { createClient as createServiceClient } from "@supabase/supabase-js";

export type FeedbackVote = "like" | "dislike";
export type BlogFeedbackStatus = "pending" | "approved" | "rejected";

export interface BlogFeedback {
  id: string;
  slug: string;
  vote: FeedbackVote;
  note: string;
  user_id: string | null;
  display_name: string;
  status: BlogFeedbackStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export const FEEDBACK_COLUMNS =
  "id, slug, vote, note, user_id, display_name, status, reviewed_at, reviewed_by, created_at, updated_at";

export const FEEDBACK_STATUS_LABEL: Record<BlogFeedbackStatus, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export const MAX_NOTE_LENGTH = 500;
export const MAX_NAME_LENGTH = 60;

/** Menormalkan status apa pun dari request/DB menjadi nilai valid. */
export function normalizeFeedbackStatus(value: unknown): BlogFeedbackStatus {
  return value === "approved" || value === "rejected" ? value : "pending";
}

/**
 * Service role key WAJIB — tabel blog_feedback sengaja tidak punya policy
 * insert/update untuk anon, jadi publishable key tidak akan bisa menulis.
 */
export function getFeedbackClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface FeedbackResult<T> {
  success: boolean;
  data?: T;
  message?: string;
  /** true bila kegagalan disebabkan tabel belum dibuat di database */
  missingTable?: boolean;
}

function toResult<T>(error: { message: string } | null, data?: T): FeedbackResult<T> {
  if (!error) return { success: true, data };
  const missingTable = /does not exist|relation .* not found|Could not find the table/i.test(error.message);
  return {
    success: false,
    message: missingTable
      ? "Tabel blog_feedback belum ada. Jalankan supabase/migrations/add_blog_feedback_table.sql di Supabase SQL Editor."
      : error.message,
    missingTable,
  };
}

/** Catatan berstatus 'approved' untuk satu artikel (tampilan publik). */
export async function getPublicFeedback(slug: string): Promise<FeedbackResult<BlogFeedback[]>> {
  const db = getFeedbackClient();
  if (!db) return { success: false, message: "Supabase service role belum dikonfigurasi." };

  const { data, error } = await db
    .from("blog_feedback")
    .select(FEEDBACK_COLUMNS)
    .eq("slug", slug)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return toResult<BlogFeedback[]>(error);
  return { success: true, data: (data as BlogFeedback[]) ?? [] };
}

/**
 * Simpan catatan baru. Status SELALU dipaksa 'pending' di sini,
 * sehingga pengunjung tidak bisa menyetujui catatannya sendiri.
 */
export async function createFeedback(input: {
  slug: string;
  vote: FeedbackVote;
  note: string;
  userId: string | null;
  displayName: string;
}): Promise<FeedbackResult<BlogFeedback>> {
  const db = getFeedbackClient();
  if (!db) return { success: false, message: "Supabase service role belum dikonfigurasi." };

  const { data, error } = await db
    .from("blog_feedback")
    .insert({
      slug: input.slug,
      vote: input.vote,
      note: input.note,
      user_id: input.userId,
      display_name: input.displayName,
      status: "pending",
      reviewed_at: null,
      reviewed_by: null,
    })
    .select(FEEDBACK_COLUMNS)
    .single();

  if (error) return toResult<BlogFeedback>(error);

  // Notifikasi admin bersifat opsional — kegagalan di sini tidak boleh
  // membuat pengiriman catatan gagal.
  try {
    await db.from("admin_notifications").insert({
      type: "blog_feedback_pending",
      title: "Catatan artikel menunggu persetujuan",
      message:
        `${input.displayName} mengirim catatan untuk artikel "${input.slug}" ` +
        `(vote: ${input.vote}).`,
      review_id: null,
    });
  } catch {
    // diabaikan
  }

  return { success: true, data: data as BlogFeedback };
}

/**
 * Cegah spam: tolak bila pengirim yang sama sudah mengirim catatan
 * pada artikel yang sama dalam rentang waktu tertentu.
 */
export async function hasRecentFeedback(
  slug: string,
  userId: string | null,
  displayName: string,
  withinMinutes = 10
): Promise<boolean> {
  const db = getFeedbackClient();
  if (!db) return false;

  const since = new Date(Date.now() - withinMinutes * 60 * 1000).toISOString();

  let query = db
    .from("blog_feedback")
    .select("id")
    .eq("slug", slug)
    .gte("created_at", since);

  query = userId ? query.eq("user_id", userId) : query.eq("display_name", displayName);

  const { data } = await query.limit(1);
  return Array.isArray(data) && data.length > 0;
}

// ─── Kebutuhan dashboard admin ──────────────────────────────

/** SEMUA catatan (pending + approved + rejected), untuk moderasi. */
export async function listAllFeedback(): Promise<FeedbackResult<BlogFeedback[]>> {
  const db = getFeedbackClient();
  if (!db) return { success: false, message: "Supabase service role belum dikonfigurasi." };

  const { data, error } = await db
    .from("blog_feedback")
    .select(FEEDBACK_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) return toResult<BlogFeedback[]>(error);
  return { success: true, data: (data as BlogFeedback[]) ?? [] };
}

/** Jumlah catatan yang masih menunggu persetujuan admin (0 bila tabel belum ada). */
export async function countPendingFeedback(): Promise<number> {
  const db = getFeedbackClient();
  if (!db) return 0;

  const { count, error } = await db
    .from("blog_feedback")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) return 0;
  return count ?? 0;
}

/** Setujui / tolak / kembalikan ke pending. */
export async function moderateFeedback(
  id: string,
  status: BlogFeedbackStatus,
  adminLabel: string
): Promise<FeedbackResult<BlogFeedback>> {
  const db = getFeedbackClient();
  if (!db) return { success: false, message: "Supabase service role belum dikonfigurasi." };

  const now = new Date().toISOString();
  const { data, error } = await db
    .from("blog_feedback")
    .update({
      status,
      reviewed_at: status === "pending" ? null : now,
      reviewed_by: status === "pending" ? null : adminLabel,
    })
    .eq("id", id)
    .select(FEEDBACK_COLUMNS)
    .maybeSingle();

  if (error) return toResult<BlogFeedback>(error);
  if (!data) return { success: false, message: "Catatan tidak ditemukan." };

  return { success: true, data: data as BlogFeedback };
}

export async function deleteFeedback(id: string): Promise<FeedbackResult<null>> {
  const db = getFeedbackClient();
  if (!db) return { success: false, message: "Supabase service role belum dikonfigurasi." };

  const { error } = await db.from("blog_feedback").delete().eq("id", id);
  if (error) return toResult<null>(error);

  return { success: true, data: null };
}
