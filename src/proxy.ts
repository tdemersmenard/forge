// NOTE: In Next.js 16, middleware.ts was renamed to proxy.ts.
// The function is exported as `proxy` (or as a default export).
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function redirectTo(pathname: string, request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do NOT add code between createServerClient and getUser
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isDashboard =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  // /onboarding/plan and sub-paths require auth; /onboarding itself is public
  const isPlanPage =
    pathname === "/onboarding/plan" || pathname.startsWith("/onboarding/plan/");

  // /onboarding/plan → requires auth
  if (isPlanPage && !user) {
    return redirectTo("/signup", request);
  }

  // 1. Not authenticated trying to reach /dashboard → /login
  if (!user && isDashboard) {
    return redirectTo("/login", request);
  }

  // 2. Authenticated + /dashboard → check agent + subscription
  if (user && isDashboard) {
    // Coming back from Stripe checkout — webhook may not have fired yet,
    // allow through so the success banner can show while DB catches up
    const isSuccessCallback =
      request.nextUrl.searchParams.get("success") === "true";
    if (isSuccessCallback) return supabaseResponse;

    const { data: agents } = await supabase
      .from("agents")
      .select("id, stripe_subscription_id")
      .eq("user_id", user.id)
      .limit(1);

    const agent = agents?.[0] as
      | { id: string; stripe_subscription_id: string | null }
      | undefined;

    // No agent yet → onboarding wizard
    if (!agent) {
      return redirectTo("/onboarding", request);
    }

    // Agent exists but no subscription → plan selection
    if (!agent.stripe_subscription_id) {
      return redirectTo("/onboarding/plan", request);
    }
  }

  // 3. Everything else → allow through
  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/onboarding/plan", "/onboarding/plan/:path*"],
};
