export type PlanId = "starter" | "growth" | "agency";

export type Plan = {
  id: PlanId;
  name: string;
  price: number;
  limit: number | null;
  badge?: string;
  featured: boolean;
  features: readonly string[];
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 97,
    limit: 500,
    featured: false,
    features: [
      "1 AI agent",
      "500 conversations/month",
      "SMS via Twilio",
      "Basic dashboard",
      "Email support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 297,
    limit: null,
    badge: "Most Popular",
    featured: true,
    features: [
      "3 AI agents",
      "Unlimited conversations",
      "SMS + Facebook Lead Ads",
      "Real-time dashboard",
      "Route optimization",
      "Priority support",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: 697,
    limit: null,
    featured: false,
    features: [
      "Unlimited agents",
      "White-label",
      "Client sub-accounts",
      "Custom integrations",
      "Dedicated support",
    ],
  },
];
