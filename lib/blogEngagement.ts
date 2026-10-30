import { createClient as createServiceClient } from "@supabase/supabase-js";

export type EngagementAction = "view" | "like" | "dislike" | "unlike" | "undislike";

export interface EngagementStats {
  views: number;
  likes: number;
  dislikes: number;
}

export interface EngagementResult extends EngagementStats {
  /** true bila tersambung ke DB; false bila fallback (belum ada koneksi / tabel) */
  ok: boolean;
  /** pesan error mentah, untuk debugging (tidak ditampilkan ke user) */
  error?: string;
}

const EMPTY: EngagementStats = { views: 0, likes: 0, dislikes: 0 };

/**
 * Client khusus server (service role) untuk menulis statistik engagement.
 * Service role dibutuhkan karena tabel blog_engagement memakai RLS
 * tanpa policy insert/update untuk anon.
 */
export function getEngagementClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Baca statistik saat ini dari DB (sumber kebenaran). */
export async function getEngagementStats(slug: string): Promise<EngagementResult> {
  const db = getEngagementClient();
  if (!db) {
    return { ...EMPTY, ok: false, error: "SUPABASE_SERVICE_ROLE_KEY / URL not configured" };
  }

  const { data, error } = await db
    .from("blog_engagement")
    .select("views, likes, dislikes")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return { ...EMPTY, ok: false, error: error.message };

  return {
    views: data?.views ?? 0,
    likes: data?.likes ?? 0,
    dislikes: data?.dislikes ?? 0,
    ok: true,
  };
}

/**
 * Catat satu aksi (view/like/dislike/unlike/undislike) secara ATOMIC,
 * lalu kembalikan statistik terbaru yang benar-benar tersimpan di DB.
 */
export async function engage(slug: string, action: EngagementAction): Promise<EngagementResult> {
  const db = getEngagementClient();
  if (!db) {
    return { ...EMPTY, ok: false, error: "SUPABASE_SERVICE_ROLE_KEY / URL not configured" };
  }

  // Jalur utama: RPC atomic (1 statement, tahan concurrency)
  const { data, error } = await db.rpc("blog_engage", { p_slug: slug, p_action: action });

  if (!error && Array.isArray(data) && data.length > 0) {
    const row = data[0] as Partial<EngagementStats>;
    return {
      views: row.views ?? 0,
      likes: row.likes ?? 0,
      dislikes: row.dislikes ?? 0,
      ok: true,
    };
  }

  // Fallback: RPC belum dibuat di database → pakai cara lama (kurang atomic)
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[blogEngagement] RPC blog_engage tidak tersedia (${error?.message ?? "no data"}). ` +
        "Jalankan supabase/migrations/add_blog_engagement_atomic_rpc.sql di Supabase SQL Editor."
    );
  }

  const fallback = await engageFallback(db, slug, action);
  // Kembalikan nilai hasil baca ulang dari DB, bukan angka hasil hitungan app
  const latest = await getEngagementStats(slug);
  if (latest.ok) return { ...latest, error: fallback.error ?? error?.message };
  return { ...fallback, error: fallback.error ?? error?.message };
}

async function engageFallback(
  db: NonNullable<ReturnType<typeof getEngagementClient>>,
  slug: string,
  action: EngagementAction
): Promise<EngagementResult> {
  const incrementCol: Partial<Record<EngagementAction, keyof EngagementStats>> = {
    view: "views",
    like: "likes",
    dislike: "dislikes",
  };
  const decrementCol: Partial<Record<EngagementAction, keyof EngagementStats>> = {
    unlike: "likes",
    undislike: "dislikes",
  };

  const { error: upsertErr } = await db
    .from("blog_engagement")
    .upsert({ slug, views: 0, likes: 0, dislikes: 0 }, { onConflict: "slug", ignoreDuplicates: true });

  if (upsertErr) return { ...EMPTY, ok: false, error: upsertErr.message };

  const col = incrementCol[action] ?? decrementCol[action];
  if (col) {
    const { data: current } = await db
      .from("blog_engagement")
      .select(col)
      .eq("slug", slug)
      .maybeSingle();

    const base = Number((current as Record<string, number> | null)?.[col] ?? 0);
    const delta = incrementCol[action] ? 1 : -1;
    const { error: updateErr } = await db
      .from("blog_engagement")
      .update({ [col]: Math.max(0, base + delta) })
      .eq("slug", slug);

    if (updateErr) return { ...EMPTY, ok: false, error: updateErr.message };
  }

  return await getEngagementStats(slug);
}
