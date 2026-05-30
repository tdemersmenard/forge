const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  "https://forgee.app",
  "http://localhost:3000",
].filter(Boolean) as string[];

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin requests sometimes omit Origin
  return ALLOWED_ORIGINS.includes(origin);
}

export function originGuard(request: Request): Response | null {
  if (!isAllowedOrigin(request)) {
    return Response.json({ error: "Forbidden origin" }, { status: 403 });
  }
  return null;
}
