import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import AuthModal from "./AuthModal.jsx";
import { useAuth } from "../utils/auth.js";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/explore", label: "Explore" },
  { to: "/matchmaker", label: "Matchmaker" },
  { to: "/sandbox", label: "Sandbox" },
];

export default function Navbar() {
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { session } = useAuth();

  function closeMenu() {
    setMenuOpen(false);
  }

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

        <ul className="hidden items-center gap-1 rounded-full border border-white/[0.08] bg-[#0E141B]/80 p-1 backdrop-blur-md shadow-inner md:flex">
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

        <div className="flex items-center gap-2.5">
          {session && (
            <Link
              to="/account"
              title={`${session.name} · ${session.email}`}
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 font-mono text-xs font-bold text-[#00FF9D] shadow-[0_0_12px_rgba(0,255,157,0.15)] transition hover:shadow-[0_0_20px_rgba(0,255,157,0.35)] sm:flex"
            >
              {session.name.charAt(0).toUpperCase()}
            </Link>
          )}
          {session ? (
            <Link
              to="/account"
              className="rounded-full bg-[#00FF9D] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all duration-200 hover:bg-[#10B981] hover:shadow-[0_0_28px_rgba(0,255,157,0.55)] active:scale-95"
            >
              My Keys
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="rounded-full bg-[#00FF9D] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all duration-200 hover:bg-[#10B981] hover:shadow-[0_0_28px_rgba(0,255,157,0.55)] active:scale-95 cursor-pointer"
            >
              Get API Key
            </button>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 cursor-pointer md:hidden ${
              menuOpen
                ? "border-[#00FF9D]/50 bg-[#00FF9D]/10 text-[#00FF9D]"
                : "border-white/[0.1] bg-[#0E141B]/90 text-slate-300 hover:border-[#00FF9D]/40 hover:text-[#00FF9D]"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          id="mobile-nav-menu"
          className="border-t border-white/[0.06] bg-[#080C0E]/95 backdrop-blur-xl md:hidden"
        >
          <ul className="mx-auto max-w-7xl space-y-1 px-6 py-4">
            {LINKS.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `block rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "border-[#00FF9D]/40 bg-[#00FF9D]/[0.06] text-[#00FF9D]"
                        : "border-white/[0.06] bg-[#0E141B]/70 text-slate-300 hover:text-white"
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
            {session && (
              <li>
                <NavLink
                  to="/account"
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `block rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "border-[#00FF9D]/40 bg-[#00FF9D]/[0.06] text-[#00FF9D]"
                        : "border-white/[0.06] bg-[#0E141B]/70 text-slate-300 hover:text-white"
                    }`
                  }
                >
                  My Workspace
                </NavLink>
              </li>
            )}
          </ul>
        </div>
      )}

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </header>
  );
}
