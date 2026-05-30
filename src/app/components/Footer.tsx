"use client";

import { useTranslations } from "next-intl";

type CategoryKey = "product" | "developers" | "company" | "legal";
type LinkKey =
  | "features" | "pricing" | "changelog" | "roadmap"
  | "docs" | "apiReference" | "status" | "github"
  | "about" | "blog" | "careers" | "contact"
  | "privacy" | "terms" | "security";

const footerStructure: { category: CategoryKey; links: LinkKey[] }[] = [
  { category: "product", links: ["features", "pricing", "changelog", "roadmap"] },
  { category: "developers", links: ["docs", "apiReference", "status", "github"] },
  { category: "company", links: ["about", "blog", "careers", "contact"] },
  { category: "legal", links: ["privacy", "terms", "security"] },
];

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-white/[0.06] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <img src="/logo.svg" alt="Forgee" height="28" />
            </div>
            <p className="text-sm text-white/30 leading-relaxed">
              {t("tagline")}
            </p>
          </div>

          {/* Links */}
          {footerStructure.map(({ category, links }) => (
            <div key={category}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/30">
                {t(category)}
              </p>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-white/40 transition-colors hover:text-white/70"
                    >
                      {t(`links.${link}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-white/25">
            &copy; {new Date().getFullYear()} {t("copyright")}
          </p>
          <div className="flex items-center gap-5">
            <a href="#" className="text-white/25 transition-colors hover:text-white/60" aria-label="Twitter">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12.6 1.5h2.3L9.8 7.2 15.5 14.5H11L7.4 9.8 3.2 14.5H.9L6.2 8.4.5 1.5H5.1l3.3 4.3L12.6 1.5zm-.8 11.7h1.3L4.3 2.8H2.9L11.8 13.2z" fill="currentColor"/>
              </svg>
            </a>
            <a href="#" className="text-white/25 transition-colors hover:text-white/60" aria-label="LinkedIn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2.5C2 1.7 2.7 1 3.5 1S5 1.7 5 2.5 4.3 4 3.5 4 2 3.3 2 2.5zM2.5 5.5H4.5V14H2.5V5.5zM6 5.5H8V6.4C8.5 5.8 9.3 5.3 10.3 5.3 12.2 5.3 13.5 6.7 13.5 8.7V14H11.5V9C11.5 7.9 10.9 7.2 9.9 7.2 9 7.2 8.5 7.8 8 8.5V14H6V5.5z" fill="currentColor"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
