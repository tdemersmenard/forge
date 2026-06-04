import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { CSPostHogProvider, PostHogPageView } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Forgee — AI Agents for Service Businesses | Live in 15 Minutes",
  description:
    "Stop losing leads to voicemail. Forgee deploys an AI agent that qualifies leads, sends quotes, collects payments, and books jobs — 24/7 with no code required.",
  keywords: [
    "AI agent for service businesses",
    "lead qualification automation",
    "SMS AI agent",
    "pool cleaning software",
    "HVAC lead management",
    "landscaping AI",
    "no-code AI agent",
    "automated lead follow-up",
  ],
  authors: [{ name: "Forgee" }],
  creator: "Forgee",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://forgee.app"),
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Forgee — AI Agents for Service Businesses | Live in 15 Minutes",
    description:
      "Stop losing leads to voicemail. Deploy an AI sales agent that qualifies leads, sends quotes, and books jobs — 24/7, no code required.",
    type: "website",
    url: "/",
    siteName: "Forgee",
  },
  twitter: {
    card: "summary_large_image",
    title: "Forgee — AI Agents for Service Businesses",
    description:
      "Stop losing leads to voicemail. Deploy an AI agent in 15 minutes — qualifies leads, sends quotes, books jobs.",
    creator: "@forgeeapp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        {/* Preconnect to external origins for faster resource loading */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        )}
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />

        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
fbq('track', 'PageView');
`}
          </Script>
        )}
      </head>
      <body className="min-h-screen bg-[#0a0a0a] text-white">
        <CSPostHogProvider>
          <LanguageProvider>
            <Suspense>
              <PostHogPageView />
            </Suspense>
            {children}
            <Toaster theme="dark" position="bottom-right" />
          </LanguageProvider>
        </CSPostHogProvider>
      </body>
    </html>
  );
}
