import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Forge — AI Agent Builder for Service Businesses",
  description:
    "Build and deploy AI agents that qualify leads, close deals, collect payments, and handle operations — without writing code.",
  openGraph: {
    title: "Forge — AI Agent Builder for Service Businesses",
    description:
      "Build and deploy AI agents that qualify leads, close deals, collect payments, and handle operations — without writing code.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Forge — AI Agent Builder for Service Businesses",
    description:
      "Build and deploy AI agents that qualify leads, close deals, collect payments, and handle operations.",
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
        <LanguageProvider>
          {children}
          <Toaster theme="dark" position="bottom-right" />
        </LanguageProvider>
      </body>
    </html>
  );
}
