import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          // Jangan filter cookie auth Supabase (sb-*) — nilainya bisa > 3KB.
          return request.cookies.getAll().filter(
            (c) => c.name.startsWith("sb-") || (c.value ? c.value.length < 3072 : true)
          );
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            if (!name.startsWith("sb-") && value && value.length > 3072) return;
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            if (!name.startsWith("sb-") && value && value.length > 3072) return;
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const hasAdminSession = request.cookies.get("admin_session")?.value === "adminootd_authenticated";

  // Public routes — accessible without login
  const publicPaths = ["/", "/outfit", "/about", "/faq", "/help", "/privacy", "/terms", "/blog"];
  const isPublicRoute = publicPaths.some(
    (p) => request.nextUrl.pathname === p || (p !== "/" && request.nextUrl.pathname.startsWith(p + "/"))
  );

  if (
    !isPublicRoute &&
    !user &&
    !hasAdminSession &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/api")
  ) {
    // no user, redirect the user to the login page with next return parameter
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
