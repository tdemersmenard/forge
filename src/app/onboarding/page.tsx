"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    fbq: any;
  }
}

// ─── Translations ──────────────────────────────────────────────────────────────

const TRANSLATIONS = {
  en: {
    stepOf: (step: number, total: number) => `Step ${step} of ${total}`,
    next: "Next",
    back: "Back",
    skip: "I'll set this up later",
    saveError: "Failed to save data. Please try again.",

    step1_title: "What kind of business do you run?",
    step1_subtitle: "Your agent will introduce itself by this name when texting your leads.",
    step1_agentNameLabel: "Agent name",
    step1_agentNamePlaceholder: "Max, Sophie, Alex...",
    step1_businessNameLabel: "Business name",
    step1_businessNamePlaceholder: "Pool Pro, GreenLawn...",
    step1_sectorLabel: "Sector",
    sectors: {
      pool: "Pool & Spa",
      lawn: "Lawn & Landscaping",
      cleaning: "Cleaning",
      hvac: "HVAC",
      construction: "Construction & Renovation",
      other: "Other",
    },

    step2_title: "What do you offer, and at what price?",
    step2_subtitle: "Your agent will know exactly what to pitch and how much to charge.",
    step2_servicePlaceholder: "Full season maintenance",
    step2_addService: "+ Add service",
    step2_contractValueLabel: "Typical contract value",

    step3_title: "What should your agent ask to qualify leads?",
    step3_subtitle: "These questions determine if a lead is worth pursuing.",
    step3_questionPlaceholder: "Ask a qualifying question...",
    step3_addQuestion: "+ Add question",
    step3_disqualLabel: "Disqualification criteria",
    step3_disqualPlaceholder: "e.g. outside service area, budget under $200...",

    step4_title: "How should your agent communicate?",
    step4_languageLabel: "Agent language",
    step4_bilingualLabel: "Bilingual (FR + EN)",
    step4_hoursLabel: "Business hours",
    step4_openLabel: "Opens",
    step4_closesLabel: "Closes",
    tones: {
      professional: {
        label: "Professional",
        desc: "Formal, precise, builds trust fast.",
        example: "Hello! I'm Max from Pool Pro. How can I help you today?",
      },
      friendly: {
        label: "Friendly",
        desc: "Warm, approachable, feels human.",
        example: "Hey! I'm Max from Pool Pro \u{1F60A} Great to hear from you! How can I help?",
      },
      direct: {
        label: "Direct",
        desc: "Fast, no fluff, straight to the point.",
        example: "Max here \u2014 Pool Pro. What do you need?",
      },
    },
    days: { Mon: "Mon", Tue: "Tue", Wed: "Wed", Thu: "Thu", Fri: "Fri", Sat: "Sat", Sun: "Sun" },

    step5_title: "Anything else your agent should know?",
    step5_subtitle: "The more context you give, the better your agent performs.",
    step5_serviceAreaLabel: "Service area",
    step5_serviceAreaPlaceholder: "e.g. Greater Montreal, Laval, Longueuil...",
    step5_promotionsLabel: "Current promotions",
    step5_promotionsPlaceholder: "e.g. 10% off first service...",
    step5_neverSayLabel: "Never say",
    step5_neverSayPlaceholder: "e.g. competitor names, specific pricing tiers...",
    step5_escalationLabel: "Escalation criteria",
    step5_escalationPlaceholder: "e.g. angry customer, complex legal question...",

    step6_title: "Activate your agent.",
    step6_subtitle: "Connect a Twilio number so your agent can send and receive SMS.",
    step6_whatIsTwilio: "What is Twilio?",
    step6_twilioDesc:
      "Twilio is a phone service that gives your agent its own SMS number. Your clients will text this number and your agent will respond automatically.",
    step6_twilioNote: "Cost: ~$1.15/month for a local number. Setup takes about 3 minutes.",
    step6_setupTitle: "Setup instructions",
    step6_instructions: [
      "Go to twilio.com and create a free account",
      "Buy a local phone number (~$1.15/mo)",
      "In your Twilio console, go to your number settings",
      null as null,
      "Copy your credentials below and paste them here",
    ],
    step6_webhookInstructions:
      "Copy this URL into your Twilio number's Messaging webhook (A message comes in):",
    step6_copy: "Copy",
    step6_copied: "Copied!",
    step6_accountSidLabel: "Account SID",
    step6_accountSidPlaceholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    step6_authTokenLabel: "Auth token",
    step6_authTokenPlaceholder: "Your auth token",
    step6_phoneLabel: "Twilio phone number",
    step6_phonePlaceholder: "+15141234567",
    step6_testConnection: "Test connection",
    step6_testing: "Testing\u2026",
    step6_connected: "Connected",

    step7_title: "Forge is building your agent.",
    step7_profile: "Saving your business profile...",
    step7_personality: "Generating agent personality...",
    step7_services: "Loading your services and pricing...",
    step7_questions: "Calibrating qualification questions...",
    step7_ready: "Your agent is ready.",
    step7_readyNamed: (name: string) => `Your agent ${name} is ready.`,

    defaultQuestions: {
      pool: [
        "What size is your pool?",
        "Is your pool above or in-ground?",
        "What city are you located in?",
      ],
      lawn: [
        "How large is your property?",
        "Do you need weekly or bi-weekly service?",
        "What city are you in?",
      ],
      cleaning: [
        "How many rooms?",
        "Residential or commercial?",
        "How often do you need cleaning?",
      ],
      hvac: [
        "What type of system do you have?",
        "When was your last maintenance?",
        "What city are you in?",
      ],
      construction: [
        "What type of renovation are you planning?",
        "What is your approximate budget?",
        "What city are you in?",
      ],
      other: ["What are you looking for?", "What city are you in?", "What is your budget?"],
    },
  },

  fr: {
    stepOf: (step: number, total: number) => `\u00C9tape ${step} sur ${total}`,
    next: "Suivant",
    back: "Retour",
    skip: "Je ferai \u00E7a plus tard",
    saveError: "Erreur lors de la sauvegarde. Veuillez r\u00E9essayer.",

    step1_title: "Quel type de business avez-vous?",
    step1_subtitle:
      "Votre agent se pr\u00E9sentera par ce nom lorsqu\u2019il enverra des SMS \u00E0 vos leads.",
    step1_agentNameLabel: "Nom de l\u2019agent",
    step1_agentNamePlaceholder: "Max, Sophie, Alex...",
    step1_businessNameLabel: "Nom de l\u2019entreprise",
    step1_businessNamePlaceholder: "Pool Pro, GreenLawn...",
    step1_sectorLabel: "Secteur",
    sectors: {
      pool: "Piscine & Spa",
      lawn: "Pelouse & Paysagement",
      cleaning: "Nettoyage",
      hvac: "CVC",
      construction: "Construction & R\u00E9novation",
      other: "Autre",
    },

    step2_title: "Qu\u2019est-ce que vous offrez et \u00E0 quel prix?",
    step2_subtitle: "Votre agent saura exactement quoi proposer et \u00E0 quel prix.",
    step2_servicePlaceholder: "Entretien saison compl\u00E8te",
    step2_addService: "+ Ajouter un service",
    step2_contractValueLabel: "Valeur typique du contrat",

    step3_title: "Que doit demander votre agent aux leads?",
    step3_subtitle: "Ces questions d\u00E9terminent si un lead vaut la peine d\u2019\u00EAtre suivi.",
    step3_questionPlaceholder: "Posez une question de qualification...",
    step3_addQuestion: "+ Ajouter une question",
    step3_disqualLabel: "Crit\u00E8res de disqualification",
    step3_disqualPlaceholder: "ex. hors zone de service, budget inf\u00E9rieur \u00E0 200$...",

    step4_title: "Comment votre agent doit communiquer?",
    step4_languageLabel: "Langue de l\u2019agent",
    step4_bilingualLabel: "Bilingue (FR + EN)",
    step4_hoursLabel: "Heures d\u2019ouverture",
    step4_openLabel: "Ouvre",
    step4_closesLabel: "Ferme",
    tones: {
      professional: {
        label: "Professionnel",
        desc: "Formel, pr\u00E9cis, inspire confiance rapidement.",
        example: "Bonjour! Je suis Max de Pool Pro. Comment puis-je vous aider?",
      },
      friendly: {
        label: "Amical",
        desc: "Chaleureux, accessible, ressemble \u00E0 un humain.",
        example: "Salut! Je suis Max de Pool Pro \u{1F60A} Ravi de vous avoir! Comment je peux aider?",
      },
      direct: {
        label: "Direct",
        desc: "Rapide, sans fioritures, droit au but.",
        example: "Max ici \u2014 Pool Pro. Qu\u2019est-ce qu\u2019il vous faut?",
      },
    },
    days: { Mon: "Lun", Tue: "Mar", Wed: "Mer", Thu: "Jeu", Fri: "Ven", Sat: "Sam", Sun: "Dim" },

    step5_title: "Autre chose que votre agent doit savoir?",
    step5_subtitle: "Plus vous donnez de contexte, mieux votre agent performe.",
    step5_serviceAreaLabel: "Zone de service",
    step5_serviceAreaPlaceholder: "ex. Grand Montr\u00E9al, Laval, Longueuil...",
    step5_promotionsLabel: "Promotions en cours",
    step5_promotionsPlaceholder: "ex. 10% de rabais sur le premier service...",
    step5_neverSayLabel: "Ne jamais dire",
    step5_neverSayPlaceholder: "ex. noms de concurrents, paliers de prix sp\u00E9cifiques...",
    step5_escalationLabel: "Crit\u00E8res d\u2019escalade",
    step5_escalationPlaceholder: "ex. client en col\u00E8re, question juridique complexe...",

    step6_title: "Activez votre agent.",
    step6_subtitle:
      "Connectez un num\u00E9ro Twilio pour que votre agent puisse envoyer et recevoir des SMS.",
    step6_whatIsTwilio: "Qu\u2019est-ce que Twilio?",
    step6_twilioDesc:
      "Twilio est un service t\u00E9l\u00E9phonique qui donne \u00E0 votre agent son propre num\u00E9ro SMS. Vos clients textent ce num\u00E9ro et votre agent r\u00E9pond automatiquement.",
    step6_twilioNote:
      "Co\u00FBt: ~1,15$/mois pour un num\u00E9ro local. La configuration prend environ 3 minutes.",
    step6_setupTitle: "Instructions de configuration",
    step6_instructions: [
      "Allez sur twilio.com et cr\u00E9ez un compte gratuit",
      "Achetez un num\u00E9ro local (~1,15$/mois)",
      "Dans la console Twilio, allez dans les param\u00E8tres de votre num\u00E9ro",
      null as null,
      "Copiez vos identifiants ci-dessous et collez-les ici",
    ],
    step6_webhookInstructions:
      "Copiez cette URL dans le webhook Messagerie de votre num\u00E9ro Twilio (Un message arrive):",
    step6_copy: "Copier",
    step6_copied: "Copi\u00E9!",
    step6_accountSidLabel: "Account SID",
    step6_accountSidPlaceholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    step6_authTokenLabel: "Auth token",
    step6_authTokenPlaceholder: "Votre auth token",
    step6_phoneLabel: "Num\u00E9ro Twilio",
    step6_phonePlaceholder: "+15141234567",
    step6_testConnection: "Tester la connexion",
    step6_testing: "Test en cours\u2026",
    step6_connected: "Connect\u00E9",

    step7_title: "Forge construit votre agent.",
    step7_profile: "Sauvegarde du profil de votre entreprise...",
    step7_personality: "G\u00E9n\u00E9ration de la personnalit\u00E9 de l\u2019agent...",
    step7_services: "Chargement de vos services et tarifs...",
    step7_questions: "Calibrage des questions de qualification...",
    step7_ready: "Votre agent est pr\u00EAt.",
    step7_readyNamed: (name: string) => `Votre agent ${name} est pr\u00EAt.`,

    defaultQuestions: {
      pool: [
        "Quelle est la taille de votre piscine?",
        "Votre piscine est-elle hors sol ou enterr\u00E9e?",
        "Dans quelle ville \u00EAtes-vous?",
      ],
      lawn: [
        "Quelle est la superficie de votre terrain?",
        "Voulez-vous un service hebdomadaire ou aux deux semaines?",
        "Dans quelle ville \u00EAtes-vous?",
      ],
      cleaning: [
        "Combien de pi\u00E8ces?",
        "R\u00E9sidentiel ou commercial?",
        "\u00C0 quelle fr\u00E9quence avez-vous besoin du nettoyage?",
      ],
      hvac: [
        "Quel type de syst\u00E8me avez-vous?",
        "Quand a eu lieu votre dernier entretien?",
        "Dans quelle ville \u00EAtes-vous?",
      ],
      construction: [
        "Quel type de r\u00E9novation planifiez-vous?",
        "Quel est votre budget approximatif?",
        "Dans quelle ville \u00EAtes-vous?",
      ],
      other: [
        "Que recherchez-vous?",
        "Dans quelle ville \u00EAtes-vous?",
        "Quel est votre budget?",
      ],
    },
  },
};

type Lang = "en" | "fr";

// ─── Constants ───────────────────────────────────────────────────────────────

const SECTORS = [
  { id: "pool", emoji: "\u{1F3CA}" },
  { id: "lawn", emoji: "\u{1F33F}" },
  { id: "cleaning", emoji: "\u{1F3E0}" },
  { id: "hvac", emoji: "\u{1F527}" },
  { id: "construction", emoji: "\u{1F528}" },
  { id: "other", emoji: "\u2728" },
] as const;

type SectorId = typeof SECTORS[number]["id"];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type DayKey = typeof DAYS[number];

const TONES = [
  { id: "professional", emoji: "\u{1F3AF}" },
  { id: "friendly", emoji: "\u{1F60A}" },
  { id: "direct", emoji: "\u26A1" },
] as const;

type ToneId = typeof TONES[number]["id"];

const CONTRACT_VALUES = ["Under $500", "$500\u2013$2,000", "$2,000\u2013$5,000", "$5,000+"];

const UNITS = ["fixed", "per visit", "per sqft", "custom"];

const TOTAL_STEPS = 7;

const WEBHOOK_URL = `${
  process.env.NEXT_PUBLIC_APP_URL ?? "https://forge-zeta-silk.vercel.app"
}/api/webhook/twilio`;

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceItem = { id: string; name: string; price: string; unit: string };

type FormData = {
  agentName: string;
  businessName: string;
  sector: string;
  servicesList: ServiceItem[];
  contractValue: string;
  qualificationQuestions: string[];
  disqualificationCriteria: string;
  tone: string;
  language: string;
  bilingual: boolean;
  openDays: string[];
  openTime: string;
  closeTime: string;
  serviceArea: string;
  promotions: string;
  neverSay: string;
  escalationCriteria: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  phone: string;
};

function newService(): ServiceItem {
  return { id: Math.random().toString(36).slice(2), name: "", price: "", unit: "fixed" };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  const [lang, setLang] = useState<Lang>("en");
  const [step, setStep] = useState(1);
  const [visible, setVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deployIndex, setDeployIndex] = useState(-1);
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [twilioStatus, setTwilioStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [twilioError, setTwilioError] = useState<string | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);

  const [form, setForm] = useState<FormData>({
    agentName: "",
    businessName: "",
    sector: "",
    servicesList: [newService()],
    contractValue: "",
    qualificationQuestions: ["What are you looking for?", "What city are you in?", "What is your budget?"],
    disqualificationCriteria: "",
    tone: "",
    language: "FR",
    bilingual: false,
    openDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    openTime: "09:00",
    closeTime: "18:00",
    serviceArea: "",
    promotions: "",
    neverSay: "",
    escalationCriteria: "",
    twilioAccountSid: "",
    twilioAuthToken: "",
    phone: "",
  });

  const text = TRANSLATIONS[lang];

  // Read language preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("forgee_lang") as Lang | null;
    if (stored === "en" || stored === "fr") setLang(stored);
  }, []);

  function setLanguage(newLang: Lang) {
    setLang(newLang);
    localStorage.setItem("forgee_lang", newLang);
  }

  // Track CompleteRegistration on first load
  useEffect(() => {
    window.fbq?.("track", "CompleteRegistration");
  }, []);

  // Step entry animation
  useEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(timer);
  }, [step]);

  // Auto-populate qualification questions when sector or language changes
  useEffect(() => {
    if (!form.sector) return;
    const qs =
      text.defaultQuestions[form.sector as SectorId] ??
      text.defaultQuestions.other;
    setForm((prev) => ({ ...prev, qualificationQuestions: qs as string[] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.sector, lang]);

  // Persist form to localStorage as user progresses
  useEffect(() => {
    localStorage.setItem("forgee_onboarding_data", JSON.stringify(form));
  }, [form]);

  // Deploy animation (step 7)
  useEffect(() => {
    if (step !== 7) return;

    setDeployIndex(-1);
    setError(null);

    const labels = [
      text.step7_profile,
      text.step7_personality,
      text.step7_services,
      text.step7_questions,
      form.agentName ? text.step7_readyNamed(form.agentName) : text.step7_ready,
    ];

    const timers: ReturnType<typeof setTimeout>[] = [];

    labels.forEach((_, i) => {
      timers.push(setTimeout(() => setDeployIndex(i), 400 + i * 600));
    });

    const totalDuration = 400 + labels.length * 600 + 700;
    timers.push(
      setTimeout(() => {
        router.push("/signup");
      }, totalDuration)
    );

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function canProceed(): boolean {
    if (step === 1)
      return form.agentName.trim() !== "" && form.businessName.trim() !== "" && form.sector !== "";
    if (step === 2)
      return form.servicesList.some((s) => s.name.trim() !== "") && form.contractValue !== "";
    if (step === 3) return form.qualificationQuestions.some((q) => q.trim() !== "");
    if (step === 4) return form.tone !== "";
    return true;
  }

  async function testTwilio() {
    setTwilioStatus("loading");
    setTwilioError(null);
    try {
      const res = await fetch("/api/twilio/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twilio_account_sid: form.twilioAccountSid,
          twilio_auth_token: form.twilioAuthToken,
          phone: form.phone,
        }),
      });
      const data = (await res.json()) as { success: boolean; error?: string };
      if (data.success) {
        setTwilioStatus("success");
      } else {
        setTwilioStatus("error");
        setTwilioError(data.error ?? "Invalid credentials.");
      }
    } catch {
      setTwilioStatus("error");
      setTwilioError("Network error — try again.");
    }
  }

  async function copyWebhookUrl() {
    await navigator.clipboard.writeText(WEBHOOK_URL);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  }

  function addService() {
    if (form.servicesList.length >= 10) return;
    set("servicesList", [...form.servicesList, newService()]);
  }

  function removeService(id: string) {
    if (form.servicesList.length <= 1) return;
    set("servicesList", form.servicesList.filter((s) => s.id !== id));
  }

  function updateService(id: string, field: keyof Omit<ServiceItem, "id">, value: string) {
    set("servicesList", form.servicesList.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  function addQuestion() {
    if (form.qualificationQuestions.length >= 8) return;
    set("qualificationQuestions", [...form.qualificationQuestions, ""]);
  }

  function removeQuestion(i: number) {
    const qs = [...form.qualificationQuestions];
    qs.splice(i, 1);
    set("qualificationQuestions", qs);
  }

  function updateQuestion(i: number, value: string) {
    const qs = [...form.qualificationQuestions];
    qs[i] = value;
    set("qualificationQuestions", qs);
  }

  function toggleDay(day: string) {
    const days = form.openDays.includes(day)
      ? form.openDays.filter((d) => d !== day)
      : [...form.openDays, day];
    set("openDays", days);
  }

  const deployLabels = [
    text.step7_profile,
    text.step7_personality,
    text.step7_services,
    text.step7_questions,
    form.agentName ? text.step7_readyNamed(form.agentName) : text.step7_ready,
  ];

  const inputCls =
    "h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors";
  const textareaCls =
    "rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors resize-none";

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-white">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 2h4v4H2V2zM8 2h4v4H8V2zM2 8h4v4H2V8zM9 9l2 2-2 2"
                stroke="#0a0a0a"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white">Forge</span>
        </div>

        <div className="flex items-center gap-3">
          {step < TOTAL_STEPS && (
            <span className="text-xs text-white/35">
              {text.stepOf(step, TOTAL_STEPS)}
            </span>
          )}
          {/* Language toggle */}
          <div className="flex items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-2.5 py-1 transition-colors ${
                lang === "en" ? "bg-white text-[#0a0a0a]" : "text-white/40 hover:text-white/70"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("fr")}
              className={`px-2.5 py-1 transition-colors ${
                lang === "fr" ? "bg-white text-[#0a0a0a]" : "text-white/40 hover:text-white/70"
              }`}
            >
              FR
            </button>
          </div>
        </div>
      </header>

      {/* ── Progress bar ── */}
      <div className="h-0.5 bg-white/[0.05]">
        <div
          className="h-full bg-white transition-all duration-500 ease-out"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* ── Step content ── */}
      <main
        className="flex-1 flex flex-col items-center justify-center px-4 py-10"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 300ms ease-out, transform 300ms ease-out",
        }}
      >
        <div className="w-full max-w-2xl">
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 1: Agent Identity
          ════════════════════════════════════════ */}
          {step === 1 && (
            <div className="flex flex-col gap-8">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  {text.step1_title}
                </h1>
                <p className="mt-2 text-base text-white/50">{text.step1_subtitle}</p>
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">
                    {text.step1_agentNameLabel}
                  </label>
                  <input
                    type="text"
                    value={form.agentName}
                    onChange={(e) => set("agentName", e.target.value)}
                    placeholder={text.step1_agentNamePlaceholder}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">
                    {text.step1_businessNameLabel}
                  </label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => set("businessName", e.target.value)}
                    placeholder={text.step1_businessNamePlaceholder}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-white/50">
                    {text.step1_sectorLabel}
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {SECTORS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => set("sector", s.id)}
                        className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors ${
                          form.sector === s.id
                            ? "border-white bg-white/[0.08] text-white"
                            : "border-white/[0.07] bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white/70"
                        }`}
                      >
                        <span className="text-xl">{s.emoji}</span>
                        <span className="text-xs font-medium leading-snug">
                          {text.sectors[s.id]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 2: Services & Pricing
          ════════════════════════════════════════ */}
          {step === 2 && (
            <div className="flex flex-col gap-8">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  {text.step2_title}
                </h1>
                <p className="mt-2 text-base text-white/50">{text.step2_subtitle}</p>
              </div>
              <div className="flex flex-col gap-3">
                {form.servicesList.map((svc) => (
                  <div key={svc.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={svc.name}
                      onChange={(e) => updateService(svc.id, "name", e.target.value)}
                      placeholder={text.step2_servicePlaceholder}
                      className="h-10 flex-[3] rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                    />
                    <div className="flex items-center">
                      <span className="mr-1 text-white/30 text-sm">$</span>
                      <input
                        type="number"
                        value={svc.price}
                        onChange={(e) => updateService(svc.id, "price", e.target.value)}
                        placeholder="1800"
                        className="h-10 w-20 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                      />
                    </div>
                    <select
                      value={svc.unit}
                      onChange={(e) => updateService(svc.id, "unit", e.target.value)}
                      className="h-10 rounded-lg border border-white/10 bg-[#0a0a0a] px-2 text-xs text-white/60 outline-none focus:border-white/25 transition-colors"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeService(svc.id)}
                      disabled={form.servicesList.length <= 1}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] text-white/25 transition-colors hover:border-red-500/30 hover:text-red-400 disabled:opacity-25"
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path
                          d="M2.5 4.5h8M5 4.5V3h3v1.5M5.5 6.5v3M7.5 6.5v3M3 4.5l.5 6.5h6L10 4.5"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
                {form.servicesList.length < 10 && (
                  <button
                    type="button"
                    onClick={addService}
                    className="flex w-fit items-center gap-1.5 text-xs text-white/35 transition-colors hover:text-white/70"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {text.step2_addService}
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-white/50">
                  {text.step2_contractValueLabel}
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONTRACT_VALUES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => set("contractValue", v)}
                      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                        form.contractValue === v
                          ? "border-white bg-white/[0.08] text-white"
                          : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/70"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 3: Lead Qualification
          ════════════════════════════════════════ */}
          {step === 3 && (
            <div className="flex flex-col gap-8">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  {text.step3_title}
                </h1>
                <p className="mt-2 text-base text-white/50">{text.step3_subtitle}</p>
              </div>
              <div className="flex flex-col gap-3">
                {form.qualificationQuestions.map((q, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-center text-xs text-white/20">{i + 1}</span>
                    <input
                      type="text"
                      value={q}
                      onChange={(e) => updateQuestion(i, e.target.value)}
                      placeholder={text.step3_questionPlaceholder}
                      className="h-10 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                    />
                    {form.qualificationQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(i)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] text-white/25 transition-colors hover:border-red-500/30 hover:text-red-400"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                {form.qualificationQuestions.length < 8 && (
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="ml-7 flex w-fit items-center gap-1.5 text-xs text-white/35 transition-colors hover:text-white/70"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {text.step3_addQuestion}
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">{text.step3_disqualLabel}</label>
                <textarea
                  value={form.disqualificationCriteria}
                  onChange={(e) => set("disqualificationCriteria", e.target.value)}
                  rows={3}
                  placeholder={text.step3_disqualPlaceholder}
                  className={textareaCls}
                />
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 4: Agent Personality
          ════════════════════════════════════════ */}
          {step === 4 && (
            <div className="flex flex-col gap-8">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  {text.step4_title}
                </h1>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {TONES.map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => set("tone", tone.id)}
                    className={`rounded-xl border p-5 text-left transition-colors ${
                      form.tone === tone.id
                        ? "border-white bg-white/[0.06]"
                        : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="mb-2 text-2xl">{tone.emoji}</div>
                    <div className="mb-1 text-sm font-semibold text-white">
                      {text.tones[tone.id].label}
                    </div>
                    <div className="mb-3 text-xs text-white/40">{text.tones[tone.id].desc}</div>
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5 text-xs italic leading-relaxed text-white/45">
                      &ldquo;{text.tones[tone.id].example}&rdquo;
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-5">
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/50">
                    {text.step4_languageLabel}
                  </label>
                  <div className="flex gap-2">
                    {(["FR", "EN"] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => set("language", l)}
                        className={`rounded-full border px-5 py-1.5 text-sm transition-colors ${
                          form.language === l
                            ? "border-white bg-white/[0.06] text-white"
                            : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/70"
                        }`}
                      >
                        {l === "FR" ? "\u{1F1EB}\u{1F1F7} Fran\u00E7ais" : "\u{1F1EC}\u{1F1E7} English"}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={form.bilingual}
                    onChange={(e) => set("bilingual", e.target.checked)}
                    className="h-4 w-4 rounded accent-white"
                  />
                  <span className="text-sm text-white/55">{text.step4_bilingualLabel}</span>
                </label>
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/50">
                    {text.step4_hoursLabel}
                  </label>
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/35">{text.step4_openLabel}</span>
                      <input
                        type="time"
                        value={form.openTime}
                        onChange={(e) => set("openTime", e.target.value)}
                        className="h-9 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-sm text-white outline-none focus:border-white/25 transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/35">{text.step4_closesLabel}</span>
                      <input
                        type="time"
                        value={form.closeTime}
                        onChange={(e) => set("closeTime", e.target.value)}
                        className="h-9 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-sm text-white outline-none focus:border-white/25 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          form.openDays.includes(d)
                            ? "border-white bg-white/[0.08] text-white"
                            : "border-white/10 text-white/30 hover:border-white/20 hover:text-white/60"
                        }`}
                      >
                        {text.days[d as DayKey]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 5: Special Instructions
          ════════════════════════════════════════ */}
          {step === 5 && (
            <div className="flex flex-col gap-8">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  {text.step5_title}
                </h1>
                <p className="mt-2 text-base text-white/50">{text.step5_subtitle}</p>
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">
                    {text.step5_serviceAreaLabel}
                  </label>
                  <input
                    type="text"
                    value={form.serviceArea}
                    onChange={(e) => set("serviceArea", e.target.value)}
                    placeholder={text.step5_serviceAreaPlaceholder}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">
                    {text.step5_promotionsLabel}
                  </label>
                  <textarea
                    value={form.promotions}
                    onChange={(e) => set("promotions", e.target.value)}
                    rows={2}
                    placeholder={text.step5_promotionsPlaceholder}
                    className={textareaCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">
                    {text.step5_neverSayLabel}
                  </label>
                  <textarea
                    value={form.neverSay}
                    onChange={(e) => set("neverSay", e.target.value)}
                    rows={2}
                    placeholder={text.step5_neverSayPlaceholder}
                    className={textareaCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">
                    {text.step5_escalationLabel}
                  </label>
                  <textarea
                    value={form.escalationCriteria}
                    onChange={(e) => set("escalationCriteria", e.target.value)}
                    rows={2}
                    placeholder={text.step5_escalationPlaceholder}
                    className={textareaCls}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 6: Connect Phone Number
          ════════════════════════════════════════ */}
          {step === 6 && (
            <div className="flex flex-col gap-7">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  {text.step6_title}
                </h1>
                <p className="mt-2 text-base text-white/50">{text.step6_subtitle}</p>
              </div>

              {/* Twilio callout */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                <p className="mb-2 text-sm font-semibold text-white">{text.step6_whatIsTwilio}</p>
                <p className="text-sm leading-relaxed text-white/50">{text.step6_twilioDesc}</p>
                <p className="mt-1.5 text-xs text-white/30">{text.step6_twilioNote}</p>
              </div>

              {/* Step-by-step instructions */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium uppercase tracking-wider text-white/30">
                  {text.step6_setupTitle}
                </p>
                {text.step6_instructions.map((instruction, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 text-[10px] font-semibold text-white/35">
                      {i + 1}
                    </span>
                    {instruction !== null ? (
                      <p className="pt-0.5 text-sm text-white/45">{instruction}</p>
                    ) : (
                      <div className="flex flex-1 flex-wrap items-center gap-2 pt-0.5">
                        <p className="text-sm text-white/45">{text.step6_webhookInstructions}</p>
                        <div className="flex items-center gap-1.5">
                          <code className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-xs text-white/60">
                            {WEBHOOK_URL}
                          </code>
                          <button
                            type="button"
                            onClick={copyWebhookUrl}
                            className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-white/40 transition-colors hover:text-white/70"
                          >
                            {urlCopied ? text.step6_copied : text.step6_copy}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Credentials */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">
                    {text.step6_accountSidLabel}
                  </label>
                  <input
                    type="text"
                    value={form.twilioAccountSid}
                    onChange={(e) => {
                      set("twilioAccountSid", e.target.value);
                      setTwilioStatus("idle");
                    }}
                    placeholder={text.step6_accountSidPlaceholder}
                    className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">
                    {text.step6_authTokenLabel}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type={showTwilioToken ? "text" : "password"}
                      value={form.twilioAuthToken}
                      onChange={(e) => {
                        set("twilioAuthToken", e.target.value);
                        setTwilioStatus("idle");
                      }}
                      placeholder={text.step6_authTokenPlaceholder}
                      className="h-11 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTwilioToken((v) => !v)}
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/35 transition-colors hover:text-white/70"
                    >
                      {showTwilioToken ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" />
                          <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                          <path d="M2 2l10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" />
                          <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">{text.step6_phoneLabel}</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => {
                      set("phone", e.target.value);
                      setTwilioStatus("idle");
                    }}
                    placeholder={text.step6_phonePlaceholder}
                    className={inputCls}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={testTwilio}
                    disabled={
                      twilioStatus === "loading" ||
                      !form.twilioAccountSid ||
                      !form.twilioAuthToken ||
                      !form.phone
                    }
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white disabled:opacity-40"
                  >
                    {twilioStatus === "loading" ? text.step6_testing : text.step6_testConnection}
                  </button>
                  {twilioStatus === "success" && (
                    <span className="text-sm text-emerald-400">✓ {text.step6_connected}</span>
                  )}
                  {twilioStatus === "error" && (
                    <span className="text-sm text-red-400">✗ {twilioError}</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(7)}
                className="w-fit text-xs text-white/25 underline underline-offset-4 transition-colors hover:text-white/50"
              >
                {text.skip}
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 7: Building (automated)
          ════════════════════════════════════════ */}
          {step === 7 && (
            <div className="flex flex-col items-center gap-10 py-8">
              <div className="text-center">
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  {text.step7_title}
                </h1>
              </div>
              <div className="flex w-full max-w-sm flex-col gap-4">
                {deployLabels.map((label, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3"
                    style={{
                      opacity: deployIndex >= i ? 1 : 0,
                      transform: deployIndex >= i ? "translateY(0)" : "translateY(8px)",
                      transition: "opacity 300ms ease-out, transform 300ms ease-out",
                    }}
                  >
                    <span
                      className={`text-base ${
                        i === deployLabels.length - 1 ? "text-white" : "text-emerald-400"
                      }`}
                    >
                      ✓
                    </span>
                    <span
                      className={`text-sm ${
                        i === deployLabels.length - 1
                          ? "font-semibold text-white"
                          : "text-white/55"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
          )}
        </div>
      </main>

      {/* ── Navigation ── */}
      {step < 7 && (
        <footer className="sticky bottom-0 border-t border-white/[0.06] bg-[#0a0a0a] px-6 py-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-white/55 transition-colors hover:border-white/20 hover:text-white"
              >
                ← {text.back}
              </button>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="rounded-lg bg-white px-6 py-2 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-35"
            >
              {text.next} →
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
