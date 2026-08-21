import { Link } from "react-router-dom";

const FOOTER_COLUMNS = [
  {
    heading: "Marketplace",
    links: [
      { to: "/explore", label: "Explore models" },
      { to: "/matchmaker", label: "Matchmaker" },
      { to: "/compare", label: "Compare models" },
      { to: "/models/atlas-70b/checkout", label: "Deploy a model" },
    ],
  },
  {
    heading: "Developers",
    links: [
      { to: "/docs", label: "Documentation" },
      { to: "/docs#run-inference", label: "API reference" },
      { to: "/docs#errors", label: "Error codes" },
      { to: "/docs#rate-limits", label: "Rate limits" },
    ],
  },
  {
    heading: "Platform",
    links: [
      { to: "/account", label: "Workspace" },
      { to: "/sandbox", label: "Sandbox" },
      { to: "/docs#rate-limits", label: "Plans & pricing" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#06090B]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-[1fr_auto] lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00FF9D] text-xs font-black text-[#080C0E] shadow-[0_0_15px_rgba(0,255,157,0.35)]">
                H
              </span>
              <span className="text-sm font-bold tracking-tight text-white">
                High<span className="text-[#00FF9D]">Rise</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs font-mono text-[11px] leading-relaxed tracking-wider text-slate-500">
              ENTERPRISE AI INFRASTRUCTURE · ONE API IN FRONT OF EVERY FOUNDATION MODEL
            </p>
            <p className="mt-4 flex items-center gap-2 font-mono text-[10px] tracking-wider text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9D] shadow-[0_0_8px_#00FF9D]" />
              ALL SYSTEMS OPERATIONAL · 99.95% SLA
            </p>
          </div>

          {FOOTER_COLUMNS.map(({ heading, links }) => (
            <nav key={heading} aria-label={`Footer — ${heading}`}>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {heading}
              </p>
              <ul className="mt-3 space-y-2">
                {links.map(({ to, label }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-xs text-slate-500 transition-colors hover:text-[#00FF9D]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t border-white/[0.06] pt-6 sm:flex-row sm:justify-between">
          <p className="font-mono text-[11px] tracking-wider text-slate-600">
            © 2026 HIGHRISE · ENTERPRISE AI INFRASTRUCTURE
          </p>
          <p className="font-mono text-[10px] tracking-wider text-slate-600">
            PRESS <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 font-mono text-slate-400">/</kbd> ANYWHERE TO SEARCH
          </p>
        </div>
      </div>
    </footer>
  );
}
