import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/explore", label: "Explore" },
  { to: "/sandbox", label: "Sandbox" },
];

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#080C0E]/85 backdrop-blur-xl transition-all duration-300">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <NavLink to="/" className="group flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00FF9D] text-sm font-black text-[#080C0E] shadow-[0_0_15px_rgba(0,255,157,0.35)] transition-all duration-200 group-hover:scale-105 group-hover:shadow-[0_0_22px_rgba(0,255,157,0.6)]">
            H
          </span>
          <span className="text-lg font-bold tracking-tight text-white">
            High<span className="text-[#00FF9D]">Rise</span>
          </span>
          <span className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#00FF9D] sm:inline-block">
            Enterprise
          </span>
        </NavLink>

        <ul className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#0E141B]/80 p-1 backdrop-blur-md shadow-inner">
          {LINKS.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                    isActive
                      ? "border border-white/10 bg-white/10 text-white shadow-[0_0_12px_rgba(0,255,157,0.12)]"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="rounded-full bg-[#00FF9D] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all duration-200 hover:bg-[#10B981] hover:shadow-[0_0_28px_rgba(0,255,157,0.55)] active:scale-95 cursor-pointer"
        >
          Get API Key
        </button>
      </nav>
    </header>
  );
}
