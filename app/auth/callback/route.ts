import { createClient } from "@/lib/supabase/server";
import { getAccountDeletionState } from "@/lib/accountDeletion";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: userData } = await supabase.auth.getUser();
      const deletion = getAccountDeletionState(userData.user?.user_metadata);
      if (deletion.isPending) {
        await supabase.auth.signOut();
        const loginUrl = new URL("/auth/login", origin);
        loginUrl.searchParams.set(
          "account",
          deletion.isExpired ? "deleted" : "pending_deletion"
        );
        return NextResponse.redirect(loginUrl.toString());
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error?error=Gagal%20masuk%20dengan%20Google`);
}
