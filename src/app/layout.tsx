import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
      <body className="min-h-screen bg-[#0a0a0a] text-white">
        {children}
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
