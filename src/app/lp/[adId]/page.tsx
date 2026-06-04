import type { Metadata } from "next";
import { LpClient } from "./LpClient";

export type AdConfig = {
  h1: string;
  subtitle: string;
  video: string;
  ogTitle: string;
  ogDesc: string;
};

const AD_CONFIGS: Record<string, AdConfig> = {
  video1: {
    h1: "The first to reply wins. Make it you.",
    subtitle:
      "78% of buyers choose whoever responds first. Your AI agent replies in under 30 seconds — 24/7.",
    video: "/ads/video1.mp4",
    ogTitle: "The first to reply wins | Forgee",
    ogDesc:
      "78% of buyers choose whoever responds first. Deploy an AI agent that replies in 30 seconds, 24/7.",
  },
  video2: {
    h1: "Stop wasting time on tire-kickers.",
    subtitle:
      "Your AI agent qualifies every lead before you ever get involved. Talk only to buyers who are ready.",
    video: "/ads/video2.mp4",
    ogTitle: "Stop wasting time on tire-kickers | Forgee",
    ogDesc:
      "Your AI agent qualifies every lead automatically. Talk only to buyers who are ready.",
  },
  video3: {
    h1: "Your business runs without you.",
    subtitle:
      "Welcome messages, follow-ups, contracts — your AI agent handles everything 24/7. No salary. No days off.",
    video: "/ads/video3.mp4",
    ogTitle: "Your business runs without you | Forgee",
    ogDesc:
      "Your AI agent handles messages, follow-ups, and contracts 24/7. No salary, no days off.",
  },
  default: {
    h1: "Your leads. Handled.",
    subtitle:
      "Deploy an AI agent that qualifies leads, sends contracts, and collects payments — 24/7.",
    video: "/ads/video1.mp4",
    ogTitle: "AI agents for service businesses | Forgee",
    ogDesc:
      "Deploy an AI agent that qualifies leads, sends contracts, and collects payments — 24/7.",
  },
};

export async function generateStaticParams() {
  return Object.keys(AD_CONFIGS).map((adId) => ({ adId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ adId: string }>;
}): Promise<Metadata> {
  const { adId } = await params;
  const config = AD_CONFIGS[adId] ?? AD_CONFIGS.default;
  return {
    title: config.ogTitle,
    description: config.ogDesc,
    openGraph: {
      title: config.ogTitle,
      description: config.ogDesc,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: config.ogTitle,
      description: config.ogDesc,
    },
  };
}

export default async function LpPage({
  params,
}: {
  params: Promise<{ adId: string }>;
}) {
  const { adId } = await params;
  const config = AD_CONFIGS[adId] ?? AD_CONFIGS.default;
  return (
    <LpClient
      adId={adId}
      h1={config.h1}
      subtitle={config.subtitle}
      video={config.video}
    />
  );
}
