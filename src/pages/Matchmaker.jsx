import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MODELS, CATEGORIES } from "../data/modelsRegistry.js";
import { findMatches, recommendModels } from "../utils/matchmakerAlgo.js";
import { formatUSD, isRequestPriced, priceLabel } from "../utils/costCalculator.js";

const WIZARD_STEPS = [
  { id: "workload", num: "01", label: "Describe workload" },
  { id: "budget", num: "02", label: "Set unit budget" },
  { id: "priority", num: "03", label: "Pick priority" },
];

const PRIORITIES = [
  {
    id: "speed",
    label: "Speed",
    body: "Latency-first routing for realtime UX",
    weights: "LATENCY 80 · BENCHMARK 20",
  },
  {
    id: "balanced",
    label: "Balanced",
    body: "Even split between cost of waiting and quality",
    weights: "LATENCY 50 · BENCHMARK 50",
  },
  {
    id: "accuracy",
    label: "Accuracy",
    body: "Benchmark-first for high-stakes workloads",
    weights: "LATENCY 20 · BENCHMARK 80",
  },
];

const WORKLOAD_PRESETS = [
  "Contract analysis with clause extraction",
  "Realtime support call transcription",
  "Semantic search over a million documents",
  "Invoice and receipt data capture",
  "Brand-safe marketing image generation",
];

function unitPriceOf(model) {
  return isRequestPriced(model) ? model.pricingPerRequest : model.pricingPer1kTokens;
}

export default function Matchmaker() {
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const priceCeiling = useMemo(
    () => Math.max(...MODELS.map(unitPriceOf), 0),
    [],
  );
  const [maxBudget, setMaxBudget] = useState(priceCeiling);
  const [priority, setPriority] = useState("balanced");

  const rankedTop3 = useMemo(() => {
    const matches = findMatches(
      {
        category,
        maxBudget: maxBudget >= priceCeiling ? null : maxBudget,
        priority,
      },
      MODELS,
    );
    if (matches.length === 0) return [];

    const trimmed = query.trim();
    if (!trimmed) {
      return matches.slice(0, 3);
    }

    const relevanceOrder = recommendModels(trimmed, MODELS, {
      limit: Number.POSITIVE_INFINITY,
    });
    if (relevanceOrder.length === 0) return matches.slice(0, 3);

    const relevanceRank = new Map(
      relevanceOrder.map((model, index) => [model.id, index]),
    );

    const blended = matches.map(({ model, score }) => {
      const rank = relevanceRank.get(model.id);
      const relevance = rank == null ? 0 : 1 - rank / relevanceOrder.length;
      return {
        model,
        score: rank == null ? score * 0.35 : relevance * 0.65 + score * 0.35,
        relevant: rank != null,
      };
    });

    return blended.sort((a, b) => b.score - a.score).slice(0, 3);
  }, [query, category, priority, maxBudget, priceCeiling]);

  const activePriority =
    PRIORITIES.find((option) => option.id === priority) ?? PRIORITIES[1];
  const budgetIsAny = maxBudget >= priceCeiling;
  const workloadReady = query.trim().length > 0;

  function resetWizard() {
    setStep(0);
  }

  return (
    <div className="relative min-h-screen bg-[#080C0E]">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
      <div className="pointer-events-none absolute top-10 right-1/4 h-[350px] w-[500px] rounded-full bg-[#00FF9D]/[0.04] blur-[140px]" />

      <div className="relative mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-semibold tracking-widest text-[#00FF9D] uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
          INTELLIGENT MATCHMAKER
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Find your <span className="text-[#00FF9D]">perfect model</span> match
        </h1>
        <p className="mt-1.5 max-w-2xl text-xs text-slate-400 sm:text-sm">
          Four quick steps. Every registry model is rescored live against your
          preferences — no signup required.
        </p>

        {/* Progress rail */}
        <nav aria-label="Matchmaker progress" className="mt-10">
          <ol className="flex items-center">
            {WIZARD_STEPS.map((s, index) => {
              const done = step > index;
              const active = step === index;
              const reachable = done || active;
              return (
                <li key={s.id} className="flex flex-none items-center last:flex-1">
                  <button
                    type="button"
                    onClick={() => reachable && setStep(index)}
                    disabled={!reachable}
                    aria-current={active ? "step" : undefined}
                    aria-label={`Step ${s.num}: ${s.label}`}
                    className={`flex items-center gap-2.5 rounded-full py-1 pr-2 transition-opacity ${
                      reachable ? "cursor-pointer hover:opacity-80" : "cursor-default"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-bold transition-all duration-300 ${
                        active
                          ? "border-[#00FF9D] bg-[#00FF9D] text-[#080C0E] shadow-[0_0_14px_rgba(0,255,157,0.45)]"
                          : done
                            ? "border-[#00FF9D]/50 bg-[#00FF9D]/10 text-[#00FF9D]"
                            : "border-white/10 bg-[#0E141B] text-slate-500"
                      }`}
                    >
                      {done ? "✓" : s.num}
                    </span>
                    <span
                      className={`hidden font-mono text-[10px] font-semibold uppercase tracking-wider sm:block ${
                        active ? "text-white" : done ? "text-[#00FF9D]" : "text-slate-500"
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>
                  {index < WIZARD_STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={`mx-3 h-px w-6 flex-none sm:w-12 lg:w-20 ${
                        step > index ? "bg-[#00FF9D]/40" : "bg-white/[0.08]"
                      } transition-colors duration-300`}
                    />
                  )}
                  {index === WIZARD_STEPS.length - 1 && (
                    <>
                      <span
                        aria-hidden="true"
                        className={`mx-3 h-px w-6 flex-none sm:w-12 lg:w-20 ${
                          step >= 3 ? "bg-[#00FF9D]/40" : "bg-white/[0.08]"
                        } transition-colors duration-300`}
                      />
                      <button
                        type="button"
                        onClick={() => step === 3 && window.scrollTo({ top: 0 })}
                        aria-current={step === 3 ? "step" : undefined}
                        className={`flex items-center gap-2.5 rounded-full py-1 pr-2 ${
                          step === 3 ? "cursor-default" : ""
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-bold transition-all duration-300 ${
                            step === 3
                              ? "border-[#00FF9D] bg-[#00FF9D] text-[#080C0E] shadow-[0_0_14px_rgba(0,255,157,0.45)]"
                              : "border-white/10 bg-[#0E141B] text-slate-500"
                          }`}
                        >
                          ⚡
                        </span>
                        <span
                          className={`hidden font-mono text-[10px] font-semibold uppercase tracking-wider sm:block ${
                            step === 3 ? "text-white" : "text-slate-500"
                          }`}
                        >
                          Ranked results
                        </span>
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Step panel */}
        {step < 3 && (
          <section
            key={step}
            className="fade-in-up mt-8 flex min-h-[420px] flex-col rounded-2xl border border-white/[0.08] bg-[#0E141B]/95 p-6 shadow-xl backdrop-blur-md sm:p-10"
          >
            <header className="border-b border-white/[0.07] pb-5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">
                STEP {WIZARD_STEPS[step].num} / 03
              </span>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
                {WIZARD_STEPS[step].label}
              </h2>
            </header>

            <div className="flex-1 pt-7">
              {step === 0 && (
                <div>
                  <label
                    htmlFor="matchmaker-query"
                    className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                  >
                    What are you building?
                  </label>
                  <textarea
                    id="matchmaker-query"
                    rows={4}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="e.g. summarize legal contracts and flag renewal clauses in realtime..."
                    autoFocus
                    className="w-full resize-y rounded-xl border border-white/[0.1] bg-[#080C0E] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-[#00FF9D]/50 focus:shadow-[0_0_20px_-4px_rgba(0,255,157,0.3)]"
                  />
                  {!workloadReady && (
                    <p className="mt-2 font-mono text-[10px] text-slate-500">
                      Or start from a preset below →
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {WORKLOAD_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setQuery(preset)}
                        className="rounded-full border border-white/[0.08] bg-[#080C0E]/70 px-3 py-1.5 text-left text-[11px] text-slate-400 transition-all duration-200 hover:border-[#00FF9D]/40 hover:text-[#00FF9D] active:scale-[0.98] cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <p className="mb-2 mt-7 block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Category <span className="normal-case text-slate-600">(optional)</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", ...CATEGORIES].map((option) => {
                      const active = category === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setCategory(option)}
                          aria-pressed={active}
                          className={`rounded-full border px-3 py-1 font-mono text-[11px] font-semibold transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                            active
                              ? "border-[#00FF9D]/60 bg-[#00FF9D]/10 text-[#00FF9D] shadow-[0_0_12px_rgba(0,255,157,0.15)]"
                              : "border-white/[0.08] bg-[#080C0E]/70 text-slate-400 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <div className="flex items-end justify-between gap-4">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Max price per unit
                    </span>
                    <span className="font-mono text-3xl font-extrabold tracking-tight text-[#00FF9D] drop-shadow-[0_0_12px_rgba(0,255,157,0.35)]">
                      {budgetIsAny ? "ANY" : formatUSD(maxBudget)}
                      {!budgetIsAny && (
                        <span className="ml-1 align-middle font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          / unit
                        </span>
                      )}
                    </span>
                  </div>
                  <input
                    id="matchmaker-budget"
                    type="range"
                    min="0"
                    max={priceCeiling}
                    step="0.0005"
                    value={maxBudget}
                    onChange={(event) => setMaxBudget(parseFloat(event.target.value))}
                    aria-label="Maximum unit price"
                    aria-valuetext={budgetIsAny ? "Any price" : `${formatUSD(maxBudget)} per unit`}
                    className="mt-6 w-full accent-[#00FF9D] cursor-pointer"
                  />
                  <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    <span>$0</span>
                    <span>No cap · {formatUSD(priceCeiling)}</span>
                  </div>
                  <p className="mt-6 rounded-xl border border-white/[0.06] bg-[#080C0E]/70 p-4 text-xs leading-relaxed text-slate-400">
                    Models priced above your cap are excluded from matching.
                    Drag fully right for{" "}
                    <span className="font-mono font-semibold text-[#00FF9D]">ANY</span>{" "}
                    — no budget ceiling.
                  </p>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3" role="radiogroup" aria-label="Optimization priority">
                  {PRIORITIES.map((option) => {
                    const active = priority === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setPriority(option.id)}
                        className={`flex w-full items-start justify-between gap-3 rounded-xl border p-4 text-left transition-all duration-300 active:scale-[0.99] cursor-pointer sm:p-5 ${
                          active
                            ? "border-[#00FF9D]/60 bg-[#00FF9D]/[0.06] shadow-[0_0_24px_-6px_rgba(0,255,157,0.25)] ring-1 ring-[#00FF9D]/30"
                            : "border-white/[0.07] bg-[#080C0E]/70 hover:border-white/20 hover:bg-[#131B24]"
                        }`}
                      >
                        <span>
                          <span
                            className={`block text-base font-bold transition-colors ${
                              active ? "text-[#00FF9D]" : "text-slate-200"
                            }`}
                          >
                            {option.label}
                          </span>
                          <span className="mt-0.5 block text-xs leading-snug text-slate-400">
                            {option.body}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[9px] font-bold tracking-wider ${
                            active
                              ? "bg-[#00FF9D]/15 text-[#00FF9D]"
                              : "bg-white/[0.05] text-slate-500"
                          }`}
                        >
                          {option.weights}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Wizard footer nav */}
            <footer className="mt-8 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-5">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="rounded-full border border-white/10 bg-[#080C0E] px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-slate-300 transition hover:border-[#00FF9D]/40 hover:text-[#00FF9D] active:scale-[0.98] cursor-pointer"
                >
                  ← Back
                </button>
              ) : (
                <span />
              )}
              {step < 2 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={step === 0 && !workloadReady}
                  className="rounded-full bg-[#00FF9D] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all hover:bg-[#10B981] hover:shadow-[0_0_28px_rgba(0,255,157,0.5)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none cursor-pointer"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#00FF9D] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all hover:bg-[#10B981] hover:shadow-[0_0_28px_rgba(0,255,157,0.5)] active:scale-[0.98] cursor-pointer"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Run matchmaker
                </button>
              )}
            </footer>
          </section>
        )}

        {/* Results panel */}
        {step === 3 && (
          <section key="results" className="fade-in-up mt-8">
            {/* Preference summary strip */}
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#0E141B]/95 p-4 shadow-lg backdrop-blur-md">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">
                YOUR INPUTS:
              </span>
              <span className="max-w-56 truncate rounded-full border border-white/[0.08] bg-[#080C0E] px-3 py-1 font-mono text-[11px] text-slate-300">
                {query.trim() || "No description"}
              </span>
              <span className="rounded-full border border-white/[0.08] bg-[#080C0E] px-3 py-1 font-mono text-[11px] text-slate-300">
                {category}
              </span>
              <span className="rounded-full border border-white/[0.08] bg-[#080C0E] px-3 py-1 font-mono text-[11px] text-slate-300">
                ≤ {budgetIsAny ? "ANY" : `${formatUSD(maxBudget)} / unit`}
              </span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-[#00FF9D]">
                {activePriority.label.toUpperCase()}
              </span>
              <button
                type="button"
                onClick={resetWizard}
                className="ml-auto rounded-full border border-white/10 bg-[#080C0E] px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300 transition hover:border-[#00FF9D]/40 hover:text-[#00FF9D] active:scale-[0.98] cursor-pointer"
              >
                ↺ Start over
              </button>
            </div>

            <div className="mb-4 mt-8 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                TOP 3 MATCHES ·{" "}
                <span className="text-[#00FF9D]">{activePriority.label.toUpperCase()}-OPTIMIZED</span>
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                {activePriority.weights}
              </span>
            </div>

            {rankedTop3.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-[#0E141B]/40 p-16 text-center">
                <p className="text-sm font-semibold text-slate-300">
                  No models fit this combination yet
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Raise the unit budget or widen the category back to All.
                </p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-6 rounded-full bg-[#00FF9D] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_15px_rgba(0,255,157,0.3)] transition hover:bg-[#10B981] active:scale-[0.98] cursor-pointer"
                >
                  Adjust budget
                </button>
              </div>
            ) : (
              <ol className="space-y-4">
                {rankedTop3.map(({ model, score, relevant }, index) => (
                  <li
                    key={model.id}
                    style={{ "--stagger": index, animationDelay: `${index * 50}ms` }}
                    className="fade-in-up"
                  >
                    <Link
                      to={`/models/${encodeURIComponent(model.id)}`}
                      className={`group relative block overflow-hidden rounded-2xl border bg-[#0E141B]/95 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#131B24] active:scale-[0.99] sm:p-6 ${
                        index === 0
                          ? "border-[#00FF9D]/40 shadow-[0_8px_32px_-10px_rgba(0,255,157,0.35)]"
                          : "border-white/[0.08] hover:border-[#00FF9D]/40"
                      }`}
                    >
                      {index === 0 && (
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#00FF9D]/60 to-transparent" />
                      )}

                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border font-mono text-base font-bold ${
                            index === 0
                              ? "border-[#00FF9D] bg-[#00FF9D] text-[#080C0E] shadow-[0_0_16px_rgba(0,255,157,0.5)]"
                              : "border-white/10 bg-[#080C0E] text-slate-400 group-hover:text-[#00FF9D]"
                          }`}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-white transition-colors group-hover:text-[#00FF9D]">
                              {model.name}
                            </h3>
                            <span className="rounded-full border border-white/[0.08] bg-[#080C0E] px-2 py-0.5 font-mono text-[10px] text-slate-400">
                              {model.category}
                            </span>
                            {index === 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#00FF9D] uppercase tracking-wider">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Top match
                              </span>
                            )}
                            {relevant && (
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#00FF9D]">
                                WORKLOAD FIT
                              </span>
                            )}
                          </div>
                          <p className="mt-1 line-clamp-1 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                            {model.provider} · {model.description}
                          </p>
                          <div className="mt-3 flex items-center gap-3">
                            <span className="h-1.5 w-full max-w-64 overflow-hidden rounded-full bg-white/[0.06]">
                              <span
                                className="block h-full rounded-full bg-linear-to-r from-[#00FF9D] to-emerald-300 transition-all duration-700"
                                style={{ width: `${Math.max(4, Math.round(score * 100))}%` }}
                              />
                            </span>
                            <span className="font-mono text-xs font-bold text-[#00FF9D]">
                              {Math.round(score * 100)}% match
                            </span>
                          </div>
                        </div>

                        <div className="grid shrink-0 grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.06] sm:min-w-64">
                          {[
                            { k: "Unit", v: priceLabel(model).replace(" / ", "/") },
                            {
                              k: "Latency",
                              v: model.latencyMs != null ? `${model.latencyMs}ms` : "—",
                            },
                            {
                              k: "Score",
                              v: model.benchmarkScore != null ? String(model.benchmarkScore) : "OPEN",
                            },
                          ].map(({ k, v }) => (
                            <div key={k} className="bg-[#080C0E] px-3 py-2.5 text-center sm:text-left">
                              <dd className="truncate font-mono text-xs font-bold text-[#00FF9D]">{v}</dd>
                              <dt className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-500">
                                {k}
                              </dt>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={resetWizard}
                className="rounded-full border border-white/10 bg-[#0E141B] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-200 transition hover:border-[#00FF9D]/40 hover:text-[#00FF9D] active:scale-[0.98] cursor-pointer"
              >
                ← Refine preferences
              </button>
              <Link
                to="/explore"
                className="group inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#00FF9D] transition-colors hover:text-emerald-300"
              >
                OR BROWSE THE FULL REGISTRY
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
