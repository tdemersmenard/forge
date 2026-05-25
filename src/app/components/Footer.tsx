const footerLinks = {
  Product: ["Features", "Pricing", "Changelog", "Roadmap"],
  Developers: ["Docs", "API Reference", "Status", "GitHub"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy", "Terms", "Security"],
};

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-white">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2h4v4H2V2zM8 2h4v4H8V2zM2 8h4v4H2V8zM9 9l2 2-2 2" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-white">Forge</span>
            </div>
            <p className="text-sm text-white/30 leading-relaxed">
              AI agents for service businesses.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/30">
                {category}
              </p>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-white/40 transition-colors hover:text-white/70"
                    >
                      {link}
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
            &copy; {new Date().getFullYear()} Forge, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {/* X/Twitter */}
            <a href="#" className="text-white/25 transition-colors hover:text-white/60" aria-label="Twitter">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12.6 1.5h2.3L9.8 7.2 15.5 14.5H11L7.4 9.8 3.2 14.5H.9L6.2 8.4.5 1.5H5.1l3.3 4.3L12.6 1.5zm-.8 11.7h1.3L4.3 2.8H2.9L11.8 13.2z" fill="currentColor"/>
              </svg>
            </a>
            {/* LinkedIn */}
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
