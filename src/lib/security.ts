const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  "https://forgee.app",
  // localhost is only a valid origin during local development — never in production
  ...(process.env.NODE_ENV !== "production" ? ["http://localhost:3000"] : []),
].filter(Boolean) as string[];

const ALLOWED_HOSTS = new Set(
  ALLOWED_ORIGINS.map((o) => {
    try {
      return new URL(o).host;
    } catch {
      return "";
    }
  }).filter(Boolean)
);

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  // No Origin header: browsers always send Origin on cross-site state-changing
  // requests, so a missing Origin should be treated as a *same-origin* request,
  // not blindly trusted. Validate against the Host instead of allowing blanket.
  if (!origin) {
    const host = request.headers.get("host");
    return host !== null && ALLOWED_HOSTS.has(host);
  }

  return ALLOWED_ORIGINS.includes(origin);
}

export function originGuard(request: Request): Response | null {
  if (!isAllowedOrigin(request)) {
    return Response.json({ error: "Forbidden origin" }, { status: 403 });
  }
  return null;
}
