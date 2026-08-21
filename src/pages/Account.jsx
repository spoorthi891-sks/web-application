import { useState } from "react";
import { Link } from "react-router-dom";
import AuthModal from "../components/AuthModal.jsx";
import { signOut, useAuth } from "../utils/auth.js";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Account() {
  const { session, apiKeys } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  if (!session) {
    return (
      <div className="relative min-h-screen bg-[#080C0E]">
        <div className="pointer-events-none absolute top-10 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[#00FF9D]/[0.05] blur-[140px]" />
        <div className="relative mx-auto max-w-md px-6 py-32 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-2xl shadow-[0_0_25px_rgba(0,255,157,0.2)]">
            🔒
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
            Sign in required
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Create a workspace to manage your API keys and deployed models.
          </p>
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="mt-8 rounded-full bg-[#00FF9D] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all hover:bg-[#10B981] cursor-pointer"
          >
            Sign in to Highrise
          </button>
          {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
        </div>
      </div>
    );
  }

  const initial = session.name.charAt(0).toUpperCase();
  const plansUsed = [...new Set(apiKeys.map((entry) => entry.plan))];

  async function copyKey(entry) {
    try {
      await navigator.clipboard.writeText(entry.key);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setCopiedId(null);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#080C0E]">
      <div className="pointer-events-none absolute top-0 right-1/4 h-[350px] w-[500px] rounded-full bg-[#00FF9D]/[0.04] blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-semibold tracking-widest text-[#00FF9D] uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
          WORKSPACE CONSOLE
        </div>

        <header className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00FF9D] text-xl font-black text-[#080C0E] shadow-[0_0_25px_rgba(0,255,157,0.35)]">
              {initial}
            </span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                {session.name}
              </h1>
              <p className="font-mono text-xs uppercase tracking-wider text-slate-500">
                {session.email} · MEMBER SINCE {formatDate(session.signedInAt).toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="self-start rounded-full border border-white/10 bg-[#0E141B]/90 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-slate-300 transition hover:border-rose-500/40 hover:text-rose-300 cursor-pointer sm:self-auto"
          >
            Sign out
          </button>
        </header>

        <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.05] shadow-xl sm:grid-cols-3">
          {[
            { value: String(apiKeys.length), label: "Active API keys" },
            { value: String(plansUsed.length), label: "Billing plans" },
            { value: "99.95%", label: "Workspace uptime" },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col bg-[#0E141B]/95 px-6 py-6">
              <dd className="font-mono text-3xl font-bold text-white">{value}</dd>
              <dt className="mt-1 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                {label}
              </dt>
            </div>
          ))}
        </dl>

        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white">
              API keys
            </h2>
            <Link
              to="/explore"
              className="rounded-full bg-[#00FF9D] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_15px_rgba(0,255,157,0.3)] transition-all hover:bg-[#10B981]"
            >
              + Deploy new model
            </Link>
          </div>

          {apiKeys.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#0E141B]/40 p-16 text-center">
              <p className="text-sm font-semibold text-slate-300">
                No API keys yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Pick a model from the marketplace, choose a plan, and your key is provisioned instantly.
              </p>
              <Link
                to="/explore"
                className="mt-6 inline-block rounded-full border border-white/10 bg-[#131B24] px-5 py-2 font-mono text-xs text-slate-200 transition hover:border-[#00FF9D]/40 hover:text-[#00FF9D]"
              >
                Browse the marketplace →
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {apiKeys.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#0E141B]/95 p-5 shadow-lg backdrop-blur-md transition-colors hover:border-[#00FF9D]/30 sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#00FF9D] shadow-[0_0_8px_#00FF9D]" />
                        <h3 className="truncate text-sm font-bold text-white">
                          {entry.model}
                        </h3>
                        <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#00FF9D]">
                          {entry.plan.toUpperCase()}
                        </span>
                      </div>
                      <code className="mt-2 block truncate font-mono text-xs text-slate-400">
                        {revealed[entry.id]
                          ? entry.key
                          : `${entry.key.slice(0, 12)}${"•".repeat(18)}`}
                      </code>
                      <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                        Provisioned {formatDate(entry.createdAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setRevealed((current) => ({
                            ...current,
                            [entry.id]: !current[entry.id],
                          }))
                        }
                        className="rounded-full border border-white/10 bg-[#080C0E] px-4 py-2 font-mono text-[11px] font-semibold text-slate-300 transition hover:border-[#00FF9D]/50 hover:text-[#00FF9D] cursor-pointer"
                      >
                        {revealed[entry.id] ? "HIDE" : "REVEAL"}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyKey(entry)}
                        className="rounded-full border border-white/10 bg-[#080C0E] px-4 py-2 font-mono text-[11px] font-semibold text-slate-300 transition hover:border-[#00FF9D]/50 hover:text-[#00FF9D] cursor-pointer"
                      >
                        {copiedId === entry.id ? "COPIED ✓" : "COPY"}
                      </button>
                      <Link
                        to={
                          entry.modelId
                            ? `/sandbox?model=${encodeURIComponent(entry.modelId)}`
                            : "/sandbox"
                        }
                        className="rounded-full bg-[#00FF9D] px-4 py-2 font-mono text-[11px] font-bold uppercase text-[#080C0E] transition-all hover:bg-[#10B981]"
                      >
                        Test →
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
