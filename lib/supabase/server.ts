import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Safe mock client when Supabase env vars are not configured
function createMockClient() {
  const noop = async () => ({ data: null, error: null });
  return {
    auth: {
      getClaims: async () => ({ data: null, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: null, error: { message: "Supabase not configured" } }),
      signInWithOAuth: async () => ({ data: null, error: { message: "Supabase not configured" } }),
      signUp: async () => ({ data: null, error: { message: "Supabase not configured" } }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ data: null, error: null, eq: () => ({ data: null, error: null, maybeSingle: async () => ({ data: null, error: null }) }), order: () => ({ data: [], error: null }), maybeSingle: async () => ({ data: null, error: null }) }),
      insert: () => ({ data: null, error: null }),
      upsert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null, eq: () => ({ data: null, error: null }) }),
      delete: () => ({ data: null, error: null, eq: () => ({ data: null, error: null }) }),
    }),
  } as any;
}

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return createMockClient();
  }

  const cookieStore = await cookies();

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      cookies: {
        getAll() {
          // JANGAN pernah filter cookie auth Supabase (sb-*) — nilainya bisa > 3KB
          // karena berisi session JSON utuh. Filter hanya untuk cookie abnormal lainnya.
          return cookieStore.getAll().filter(
            (c) => c.name.startsWith("sb-") || (c.value ? c.value.length < 3072 : true)
          );
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Cookie sb-* wajib disimpan utuh, jika tidak sesi user hilang.
              if (!name.startsWith("sb-") && value && value.length > 3072) return;
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
