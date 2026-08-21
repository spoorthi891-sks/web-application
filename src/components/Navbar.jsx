import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/explore", label: "Explore" },
  { to: "/sandbox", label: "Sandbox" },
];

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <NavLink to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-neon-blue to-neon-emerald text-sm font-black text-slate-950">
            H
          </span>
          <span className="text-lg font-bold tracking-tight text-white">
            High
            <span className="bg-linear-to-r from-neon-blue to-neon-emerald bg-clip-text text-transparent">
              Rise
            </span>
          </span>
        </NavLink>

        <ul className="hidden items-center gap-1 sm:flex">
          {LINKS.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:text-white"
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
          className="rounded-lg bg-linear-to-r from-neon-blue to-neon-emerald px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110"
        >
          Get API Key
        </button>
      </nav>
    </header>
  );
}
