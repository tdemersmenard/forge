/** Call at request time (not module-level) — throws in production if env var is missing. */
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
    throw new Error("NEXT_PUBLIC_APP_URL must be set in production");
  }
  return url;
}
