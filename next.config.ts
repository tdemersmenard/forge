import type { NextConfig } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://forge-zeta-silk.vercel.app";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const csp = [
  `default-src 'self'`,
  // Scripts: self + Stripe + Facebook pixel + inline (required for fbq init)
  `script-src 'self' 'unsafe-inline' https://js.stripe.com https://connect.facebook.net`,
  // Connect: Supabase (REST + WS), Stripe, Facebook Graph
  `connect-src 'self' ${SUPABASE_URL} wss://${SUPABASE_URL.replace(/^https?:\/\//, "")} https://api.stripe.com https://graph.facebook.com https://www.facebook.com`,
  // Frames: Stripe checkout/portal
  `frame-src https://js.stripe.com https://hooks.stripe.com`,
  // Images: self + data URIs + any HTTPS (for invoices, etc.)
  `img-src 'self' data: https:`,
  // Styles: inline allowed for Tailwind
  `style-src 'self' 'unsafe-inline'`,
  // Fonts: self + Google Fonts CDN (used by next/font)
  `font-src 'self' data: https://fonts.gstatic.com`,
  // Disallow plugins
  `object-src 'none'`,
  // Forms can only submit to self + Stripe
  `form-action 'self' https://checkout.stripe.com https://billing.stripe.com`,
  // Disallow framing entirely
  `frame-ancestors 'none'`,
  // Force HTTPS upgrades
  `upgrade-insecure-requests`,
].join("; ");

void APP_URL;

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
