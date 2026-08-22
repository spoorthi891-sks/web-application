import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AuthModal from "../components/AuthModal.jsx";
import Sparkline from "../components/Sparkline.jsx";
import { signOut, useAuth } from "../utils/auth.js";

const USAGE_DAYS = 14;

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let state = seed;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildUsageSeries(seedKey, base, growth = 0.55) {
  const random = mulberry32(hashString(seedKey));
  const today = new Date();
  return Array.from({ length: USAGE_DAYS }, (_, index) => {
    const day = new Date(today);
    day.setDate(day.getDate() - (USAGE_DAYS - 1 - index));
    const weekendDip = [0, 6].includes(day.getDay()) ? 0.45 : 1;
    const trend = 1 + (index / (USAGE_DAYS - 1)) * growth;
    const jitter = 0.72 + random() * 0.56;
    return Math.max(1, Math.round(base * trend * jitter * weekendDip));
  });
}

function sumSeries(seriesList) {
  if (seriesList.length === 0) return [];
  return seriesList[0].map((_, index) =>
    seriesList.reduce((total, series) => total + series[index], 0),
  );
}

function seriesTotal(series) {
  return series.reduce((total, value) => total + value, 0);
}

function seriesDelta(series) {
  const half = Math.floor(series.length / 2);
  const previous = series.slice(0, half).reduce((a, b) => a + b, 0) || 1;
  const current = series.slice(half).reduce((a, b) => a + b, 0);
  return Math.round(((current - previous) / previous) * 100);
}

const compactFormatter = new Intl.NumberFormat("en-US", { notation: "compact" });

function formatCompact(value) {
  return compactFormatter.format(value ?? 0);
}

function DeltaBadge({ value }) {
  const isUp = value >= 0;
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${
        isUp
          ? "border-emerald-500/30 bg-emerald-500/10 text-[#00FF9D]"
          : "border-rose-500/30 bg-rose-500/10 text-rose-300"
      }`}
    >
      {isUp ? "▲" : "▼"} {Math.abs(value)}%
    </span>
  );
}

function UsagePanel({ label, unit, series, stroke }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0E141B]/95 p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <DeltaBadge value={seriesDelta(series)} />
      </div>
      <p className="mt-2 font-mono text-2xl font-bold text-white">
        {formatCompact(seriesTotal(series))}
        <span className="ml-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
          {unit} · 14D
        </span>
      </p>
      <Sparkline
        points={series}
        stroke={stroke}
        label={`${label} over the last ${USAGE_DAYS} days`}
        className="mt-3 h-16 w-full"
      />
    </div>
  );
}

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

  const usageByKey = useMemo(
    () =>
      Object.fromEntries(
        apiKeys.map((entry) => {
          const seed = hashString(entry.id);
          const requestBase = 400 + (seed % 2600);
          const tokensPerRequest = 300 + ((seed >> 5) % 2200);
          return [
            entry.id,
            {
              requests: buildUsageSeries(`${entry.id}:requests`, requestBase),
              tokens: buildUsageSeries(
                `${entry.id}:tokens`,
                requestBase * tokensPerRequest,
                0.7,
              ),
            },
          ];
        }),
      ),
    [apiKeys],
  );

  const workspaceUsage = useMemo(() => {
    const entries = apiKeys
      .map((entry) => usageByKey[entry.id])
      .filter(Boolean);
    return {
      requests: sumSeries(entries.map((usage) => usage.requests)),
      tokens: sumSeries(entries.map((usage) => usage.tokens)),
    };
  }, [apiKeys, usageByKey]);

  if (!session) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#080C0E] px-6">
        <div className="pointer-events-none absolute top-10 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[#00FF9D]/[0.05] blur-[140px]" />
        <div className="relative w-full max-w-md py-16 text-center">
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
            className="mt-8 rounded-full bg-[#00FF9D] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all hover:bg-[#10B981] active:scale-[0.98] cursor-pointer"
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
            className="self-start rounded-full border border-white/10 bg-[#0E141B]/90 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-slate-300 transition hover:border-rose-500/40 hover:text-rose-300 active:scale-95 cursor-pointer sm:self-auto"
          >
            Sign out
          </button>
        </header>

        <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.05] shadow-xl sm:grid-cols-3">
          {[
            { value: String(apiKeys.length), label: "Active API keys" },
            { value: String(plansUsed.length), label: "Billing plans" },
            { value: "99.95%", label: "Workspace uptime" },
          ].map(({ value, label }, index) => (
            <div key={label} style={{ "--stagger": index }} className="stagger-item flex flex-col bg-[#0E141B]/95 px-6 py-6">
              <dd className="font-mono text-3xl font-bold text-white">{value}</dd>
              <dt className="mt-1 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                {label}
              </dt>
            </div>
          ))}
        </dl>

        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white">Usage</h2>
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
              SIMULATED TELEMETRY · LAST {USAGE_DAYS} DAYS
            </span>
          </div>

          {apiKeys.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 bg-[#0E141B]/40 px-5 py-6 text-center font-mono text-xs text-slate-500">
              USAGE CHARTS APPEAR ONCE YOUR KEYS START SERVING TRAFFIC
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <UsagePanel
                  label="Requests / day · all keys"
                  unit="REQ"
                  series={workspaceUsage.requests}
                  stroke="#00FF9D"
                />
                <UsagePanel
                  label="Tokens / day · all keys"
                  unit="TOK"
                  series={workspaceUsage.tokens}
                  stroke="#34d399"
                />
              </div>

              {apiKeys.map((entry) => {
                const usage = usageByKey[entry.id];
                if (!usage) return null;
                return (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-white/[0.06] bg-[#0E141B]/60 p-4 sm:p-5"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#00FF9D]/70" />
                        <span className="truncate font-mono text-[11px] uppercase tracking-wider text-slate-400">
                          {entry.model}
                        </span>
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                        KEY …{entry.key.slice(-6).toLowerCase()}
                      </span>
                    </div>
                    <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                      {[
                        {
                          label: "Requests",
                          unit: "/day",
                          series: usage.requests,
                          stroke: "#00FF9D",
                        },
                        {
                          label: "Tokens",
                          unit: "/day",
                          series: usage.tokens,
                          stroke: "#34d399",
                        },
                      ].map(({ label, unit, series, stroke }) => (
                        <div key={label}>
                          <div className="mb-1 flex items-baseline justify-between gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                              {label}{" "}
                              <span className="text-slate-600">{unit}</span>
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-200">
                              {formatCompact(seriesTotal(series))}
                              <span className="ml-1 text-[9px] font-medium text-slate-500">
                                14D
                              </span>
                            </span>
                          </div>
                          <Sparkline
                            points={series}
                            stroke={stroke}
                            label={`${label} per day for key ending ${entry.key.slice(-4)}`}
                            className="h-10 w-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white">
              API keys
            </h2>
            <Link
              to="/explore"
              className="rounded-full bg-[#00FF9D] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_15px_rgba(0,255,157,0.3)] transition-all hover:bg-[#10B981] active:scale-[0.98]"
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
                className="mt-6 inline-block rounded-full border border-white/10 bg-[#131B24] px-5 py-2 font-mono text-xs text-slate-200 transition hover:border-[#00FF9D]/40 hover:text-[#00FF9D] active:scale-[0.98]"
              >
                Browse the marketplace →
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {apiKeys.map((entry, index) => (
                <li
                  key={entry.id}
                  style={{ "--stagger": index }}
                  className="stagger-item rounded-2xl border border-white/[0.08] bg-[#0E141B]/95 p-5 shadow-lg backdrop-blur-md transition-colors hover:border-[#00FF9D]/30 sm:p-6"
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
                        className="rounded-full border border-white/10 bg-[#080C0E] px-4 py-2 font-mono text-[11px] font-semibold text-slate-300 transition hover:border-[#00FF9D]/50 hover:text-[#00FF9D] active:scale-95 cursor-pointer"
                      >
                        {revealed[entry.id] ? "HIDE" : "REVEAL"}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyKey(entry)}
                        className="rounded-full border border-white/10 bg-[#080C0E] px-4 py-2 font-mono text-[11px] font-semibold text-slate-300 transition hover:border-[#00FF9D]/50 hover:text-[#00FF9D] active:scale-95 cursor-pointer"
                      >
                        {copiedId === entry.id ? "COPIED ✓" : "COPY"}
                      </button>
                      <Link
                        to={
                          entry.modelId
                            ? `/sandbox?model=${encodeURIComponent(entry.modelId)}`
                            : "/sandbox"
                        }
                        className="rounded-full bg-[#00FF9D] px-4 py-2 font-mono text-[11px] font-bold uppercase text-[#080C0E] transition-all hover:bg-[#10B981] active:scale-[0.98]"
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
