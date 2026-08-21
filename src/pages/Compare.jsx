import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MODELS, getModelById } from "../data/modelsRegistry.js";
import { compareMonthlyCosts, formatUSD, formatTokenCount } from "../utils/costCalculator.js";

const DEFAULT_SELECTION = ["atlas-70b", "nova-mini", "forge-coder-34b"];

function TrafficSlider({ id, label, min, max, step, value, onChange, hint }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label
          htmlFor={id}
          className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400"
        >
          {label}
        </label>
        <span className="font-mono text-xs font-bold text-[#00FF9D]">{hint}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
        className="w-full accent-[#00FF9D] cursor-pointer"
      />
    </div>
  );
}

export default function Compare() {
  const [selectedIds, setSelectedIds] = useState(DEFAULT_SELECTION);
  const [monthlyRequests, setMonthlyRequests] = useState(250000);
  const [avgTokensPerRequest, setAvgTokensPerRequest] = useState(1200);

  const traffic = useMemo(
    () => ({ monthlyRequests, avgTokensPerRequest }),
    [monthlyRequests, avgTokensPerRequest],
  );

  const comparison = useMemo(
    () => compareMonthlyCosts(selectedIds.map(getModelById).filter(Boolean), traffic),
    [selectedIds, traffic],
  );

  const maxCost = comparison.length ? comparison[comparison.length - 1].monthlyCost : 0;
  const cheapest = comparison[0]?.monthlyCost ?? 0;
  const spread =
    maxCost > 0 && cheapest >= 0 && maxCost !== cheapest
      ? maxCost / Math.max(cheapest, Number.EPSILON)
      : null;

  function toggleModel(id) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  }

  return (
    <div className="relative min-h-screen bg-[#080C0E]">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
      <div className="pointer-events-none absolute top-10 right-1/4 h-[350px] w-[500px] rounded-full bg-[#00FF9D]/[0.04] blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-semibold tracking-widest text-[#00FF9D] uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
          COST COMPARISON ENGINE
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Compare <span className="text-[#00FF9D]">monthly spend</span> across models
        </h1>
        <p className="mt-1.5 max-w-2xl text-xs text-slate-400 sm:text-sm">
          Project your workload traffic against list prices for every selected
          model. Rankings update live — before finance or procurement gets involved.
        </p>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[380px_1fr]">
          {/* Assumptions panel */}
          <section className="space-y-6 rounded-2xl border border-white/[0.08] bg-[#0E141B]/95 p-6 shadow-xl backdrop-blur-md sm:p-8 lg:sticky lg:top-24">
            <div className="space-y-6">
              <TrafficSlider
                id="compare-requests"
                label="Monthly requests"
                min={10000}
                max={5000000}
                step={10000}
                value={monthlyRequests}
                onChange={setMonthlyRequests}
                hint={formatTokenCount(monthlyRequests)}
              />
              <TrafficSlider
                id="compare-tokens"
                label="Avg tokens / request"
                min={100}
                max={8000}
                step={100}
                value={avgTokensPerRequest}
                onChange={setAvgTokensPerRequest}
                hint={`${formatTokenCount(avgTokensPerRequest)} tok`}
              />
            </div>

            <p className="rounded-xl border border-white/[0.06] bg-[#080C0E]/80 p-3.5 font-mono text-[10px] leading-relaxed text-slate-500">
              WORKLOAD VOLUME ·{" "}
              <span className="text-slate-300">
                {formatTokenCount(monthlyRequests * avgTokensPerRequest)}
              </span>{" "}
              TOKENS / MO · LIST PRICE BEFORE PLAN DISCOUNTS
            </p>

            <div className="border-t border-white/[0.07] pt-5">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Models in scope
                </span>
                <span className="font-mono text-xs font-bold text-[#00FF9D]">
                  {selectedIds.length}/{MODELS.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MODELS.map((model) => {
                  const active = selectedIds.includes(model.id);
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => toggleModel(model.id)}
                      aria-pressed={active}
                      className={`rounded-full border px-3 py-1 font-mono text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
                        active
                          ? "border-[#00FF9D]/60 bg-[#00FF9D]/10 text-[#00FF9D] shadow-[0_0_12px_rgba(0,255,157,0.15)]"
                          : "border-white/[0.08] bg-[#080C0E]/70 text-slate-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {model.name}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() =>
                  setSelectedIds(
                    selectedIds.length === MODELS.length ? [] : MODELS.map((m) => m.id),
                  )
                }
                className="mt-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-[#00FF9D] cursor-pointer"
              >
                {selectedIds.length === MODELS.length ? "CLEAR ALL" : "SELECT ALL"}
              </button>
            </div>
          </section>

          {/* Results panel */}
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs text-slate-400">
                RANKED BY MONTHLY COST ·{" "}
                <span className="font-bold text-white">{comparison.length}</span>{" "}
                MODEL{comparison.length === 1 ? "" : "S"}
              </p>
              {spread && (
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  {spread.toFixed(1)}× SPREAD BETWEEN CHEAPEST & PRICIEST
                </span>
              )}
            </div>

            {comparison.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-[#0E141B]/40 p-16 text-center">
                <p className="text-sm font-semibold text-slate-300">
                  No models selected
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Pick at least one model from the panel to project costs.
                </p>
              </div>
            ) : (
              <ol className="space-y-3">
                {comparison.map(({ model, monthlyCost }, index) => {
                  const isCheapest = index === 0;
                  const delta = monthlyCost - cheapest;
                  const barWidth = maxCost > 0 ? Math.max(3, (monthlyCost / maxCost) * 100) : 3;
                  return (
                    <li key={model.id}>
                      <Link
                        to={`/models/${encodeURIComponent(model.id)}`}
                        className={`group flex flex-col gap-4 rounded-2xl border bg-[#0E141B]/95 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#131B24] sm:flex-row sm:items-center ${
                          isCheapest
                            ? "border-[#00FF9D]/40 shadow-[0_8px_28px_-10px_rgba(0,255,157,0.25)]"
                            : "border-white/[0.08] hover:border-[#00FF9D]/40"
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-mono text-sm font-bold ${
                            isCheapest
                              ? "border-[#00FF9D] bg-[#00FF9D] text-[#080C0E] shadow-[0_0_14px_rgba(0,255,157,0.45)]"
                              : "border-white/10 bg-[#080C0E] text-slate-400 group-hover:text-[#00FF9D]"
                          }`}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-white transition-colors group-hover:text-[#00FF9D]">
                              {model.name}
                            </span>
                            <span className="rounded-full border border-white/[0.08] bg-[#080C0E] px-2 py-0.5 font-mono text-[10px] text-slate-400">
                              {model.category}
                            </span>
                            {isCheapest && (
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#00FF9D]">
                                BEST VALUE
                              </span>
                            )}
                          </span>
                          <span className="mt-2 block h-1.5 w-full max-w-72 overflow-hidden rounded-full bg-white/[0.06]">
                            <span
                              className={`block h-full rounded-full transition-all duration-500 ${
                                isCheapest
                                  ? "bg-linear-to-r from-[#00FF9D] to-emerald-300"
                                  : "bg-slate-600 group-hover:bg-slate-500"
                              }`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </span>
                        </span>

                        <span className="shrink-0 text-right">
                          <span className="block font-mono text-lg font-extrabold text-white">
                            {formatUSD(monthlyCost)}
                            <span className="text-[10px] font-medium text-slate-500"> /MO</span>
                          </span>
                          <span
                            className={`mt-0.5 block font-mono text-[10px] uppercase tracking-wider ${
                              isCheapest ? "text-[#00FF9D]" : "text-slate-500"
                            }`}
                          >
                            {isCheapest
                              ? "LOWEST IN SELECTION"
                              : `+${formatUSD(delta)} VS BEST`}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}

            <p className="mt-5 font-mono text-[10px] leading-relaxed text-slate-500">
              PROJECTIONS USE PER-TOKEN OR PER-REQUEST LIST PRICING FROM THE REGISTRY.
              GROWTH (−20%) AND ENTERPRISE (−35%) PLAN DISCOUNTS APPLY AT CHECKOUT.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
