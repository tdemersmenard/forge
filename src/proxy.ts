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

  // 1. Not authenticated → /login
  if (!user && isDashboard) {
    return redirectTo("/login", request);
  }

  // 2. Authenticated, accessing /dashboard → check agent exists
  if (user && isDashboard) {
    const { data: agents } = await supabase
      .from("agents")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    const hasAgent = (agents?.length ?? 0) > 0;

    // No agent yet → send to onboarding wizard
    if (!hasAgent) {
      return redirectTo("/onboarding", request);
    }
  }

  // 3. /onboarding/* and everything else → always allow through
  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
