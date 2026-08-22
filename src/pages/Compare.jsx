import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MODELS, getModelById } from "../data/modelsRegistry.js";
import {
  compareMonthlyCosts,
  estimateMonthlyCost,
  formatUSD,
  formatTokenCount,
  isRequestPriced,
} from "../utils/costCalculator.js";

const DEFAULT_SELECTION = ["atlas-70b", "nova-mini", "forge-coder-34b"];
const MAX_SELECTION = 3;

function findExtreme(models, valueFn, direction) {
  let best = null;
  let bestValue = null;
  for (const model of models) {
    const value = valueFn(model);
    if (value == null) continue;
    if (
      bestValue == null ||
      (direction === "min" ? value < bestValue : value > bestValue)
    ) {
      best = model;
      bestValue = value;
    }
  }
  return best?.id ?? null;
}

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

function SpecRow({ label, hint, children }) {
  return (
    <tr className="border-t border-white/[0.06] transition-colors hover:bg-white/[0.02]">
      <th
        scope="row"
        className="sticky left-0 z-10 bg-[#10171F] px-5 py-3.5 align-top"
      >
        <span className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300">
          {label}
        </span>
        {hint && (
          <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wider text-slate-500">
            {hint}
          </span>
        )}
      </th>
      {children}
    </tr>
  );
}

function SpecValue({ raw, isBest, big = false }) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${
        big ? "text-base" : "text-sm"
      } font-mono font-bold ${isBest ? "text-[#00FF9D]" : "text-white"}`}
    >
      {raw}
      {isBest && (
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-widest">
          Best
        </span>
      )}
    </span>
  );
}

export default function Compare() {
  const location = useLocation();
  const handoffIds = Array.isArray(location.state?.models)
    ? location.state.models.filter((id) => getModelById(id)).slice(0, MAX_SELECTION)
    : [];
  const [selectedIds, setSelectedIds] = useState(
    handoffIds.length > 0 ? handoffIds : DEFAULT_SELECTION,
  );
  const [monthlyRequests, setMonthlyRequests] = useState(250000);
  const [avgTokensPerRequest, setAvgTokensPerRequest] = useState(1200);

  const traffic = useMemo(
    () => ({ monthlyRequests, avgTokensPerRequest }),
    [monthlyRequests, avgTokensPerRequest],
  );

  const selectedModels = useMemo(
    () => selectedIds.map(getModelById).filter(Boolean),
    [selectedIds],
  );

  const comparison = useMemo(
    () => compareMonthlyCosts(selectedModels, traffic),
    [selectedModels, traffic],
  );

  const monthlyById = useMemo(
    () =>
      Object.fromEntries(
        selectedModels.map((model) => [
          model.id,
          estimateMonthlyCost(model, traffic),
        ]),
      ),
    [selectedModels, traffic],
  );

  const fastestId = useMemo(
    () => findExtreme(selectedModels, (m) => m.latencyMs, "min"),
    [selectedModels],
  );
  const sharpestId = useMemo(
    () => findExtreme(selectedModels, (m) => m.benchmarkScore, "max"),
    [selectedModels],
  );
  const thriftiestId = useMemo(
    () => findExtreme(selectedModels, (m) => monthlyById[m.id], "min"),
    [selectedModels],
  );

  const maxCost = comparison.length ? comparison[comparison.length - 1].monthlyCost : 0;
  const cheapest = comparison[0]?.monthlyCost ?? 0;
  const spread =
    maxCost > 0 && cheapest >= 0 && maxCost !== cheapest
      ? maxCost / Math.max(cheapest, Number.EPSILON)
      : null;

  function toggleModel(id) {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((entry) => entry !== id);
      }
      if (current.length >= MAX_SELECTION) return current;
      return [...current, id];
    });
  }

  return (
    <div className="relative min-h-screen bg-[#080C0E]">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
      <div className="pointer-events-none absolute top-10 right-1/4 h-[350px] w-[500px] rounded-full bg-[#00FF9D]/[0.04] blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-semibold tracking-widest text-[#00FF9D] uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
          MODEL COMPARISON ENGINE
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Compare models <span className="text-[#00FF9D]">side by side</span>
        </h1>
        <p className="mt-1.5 max-w-2xl text-xs text-slate-400 sm:text-sm">
          Line up 2–{MAX_SELECTION} models on latency, benchmark score, and pricing —
          then project your workload traffic to see monthly spend before finance gets involved.
        </p>

        {/* Side-by-side spec comparison (2–3 models) */}
        <section className="mt-8">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              Side-by-side specs
            </h2>
            {selectedModels.length > 0 && (
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                BEST IN ROW MARKED · TRAFFIC AT{" "}
                {formatTokenCount(monthlyRequests)} REQ/MO ×{" "}
                {formatTokenCount(avgTokensPerRequest)} TOK
              </p>
            )}
          </div>

          {selectedModels.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#0E141B]/40 p-12 text-center">
              <p className="text-sm font-semibold text-slate-300">
                Nothing to compare yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Select 2–{MAX_SELECTION} models from the panel below to line up
                latency, price, and benchmark scores.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E141B]/95 shadow-xl backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th
                        scope="col"
                        className="sticky left-0 z-10 bg-[#10171F] px-5 py-4 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                      >
                        Metric
                      </th>
                      {selectedModels.map((model) => (
                        <th
                          key={model.id}
                          scope="col"
                          className="px-5 py-4 align-bottom"
                        >
                          <Link
                            to={`/models/${encodeURIComponent(model.id)}`}
                            className="group block"
                          >
                            <span className="block text-sm font-bold text-white transition-colors group-hover:text-[#00FF9D]">
                              {model.name}
                            </span>
                            <span className="mt-0.5 flex items-center gap-2">
                              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 group-hover:text-slate-400">
                                {model.provider}
                              </span>
                              <span className="rounded-full border border-white/[0.08] bg-[#080C0E] px-2 py-0.5 font-mono text-[9px] text-slate-400">
                                {model.category}
                              </span>
                            </span>
                          </Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <SpecRow label="Latency (median)" hint="Lower is better">
                      {selectedModels.map((model) => (
                        <td key={model.id} className="px-5 py-3.5">
                          <SpecValue
                            raw={`${model.latencyMs} ms`}
                            isBest={model.id === fastestId && selectedModels.length > 1}
                          />
                        </td>
                      ))}
                    </SpecRow>
                    <SpecRow label="Benchmark score" hint="Higher is better">
                      {selectedModels.map((model) => (
                        <td key={model.id} className="px-5 py-3.5">
                          <SpecValue
                            raw={model.benchmarkScore.toFixed(1)}
                            isBest={model.id === sharpestId && selectedModels.length > 1}
                          />
                        </td>
                      ))}
                    </SpecRow>
                    <SpecRow label="List pricing" hint="Per request or per 1K tokens">
                      {selectedModels.map((model) => (
                        <td key={model.id} className="px-5 py-3.5">
                          <span className="font-mono text-xs text-slate-300">
                            {isRequestPriced(model)
                              ? `${formatUSD(model.pricingPerRequest)} / req`
                              : `${formatUSD(model.pricingPer1kTokens)} / 1K tok`}
                          </span>
                        </td>
                      ))}
                    </SpecRow>
                    <SpecRow label={`Est. monthly @ ${formatTokenCount(monthlyRequests)} req`} hint="At current traffic sliders">
                      {selectedModels.map((model) => (
                        <td key={model.id} className="px-5 py-3.5">
                          <SpecValue
                            raw={formatUSD(monthlyById[model.id])}
                            isBest={model.id === thriftiestId && selectedModels.length > 1}
                            big
                          />
                        </td>
                      ))}
                    </SpecRow>
                    <SpecRow label="Privacy posture" hint="Compliance certifications">
                      {selectedModels.map((model) => (
                        <td key={model.id} className="px-5 py-3.5">
                          <span className="font-mono text-[11px] leading-relaxed text-slate-400">
                            {model.privacyRating.split("·").map((part, partIndex) => (
                              <span key={part} className="mr-2 inline-flex items-center gap-1.5">
                                {partIndex > 0 && <span className="text-slate-600">·</span>}
                                {part.trim()}
                              </span>
                            ))}
                          </span>
                        </td>
                      ))}
                    </SpecRow>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {selectedModels.length === 1 && (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-slate-500">
              ADD ONE MORE MODEL TO UNLOCK BEST-IN-ROW HIGHLIGHTS
            </p>
          )}
        </section>

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
                  {selectedIds.length}/{MAX_SELECTION}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MODELS.map((model) => {
                  const active = selectedIds.includes(model.id);
                  const capped = !active && selectedIds.length >= MAX_SELECTION;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => toggleModel(model.id)}
                      aria-pressed={active}
                      aria-disabled={capped}
                      title={
                        capped
                          ? `Max ${MAX_SELECTION} models — remove one to swap`
                          : undefined
                      }
                      className={`rounded-full border px-3 py-1 font-mono text-[11px] font-semibold transition-all duration-200 ${
                        active
                          ? "border-[#00FF9D]/60 bg-[#00FF9D]/10 text-[#00FF9D] shadow-[0_0_12px_rgba(0,255,157,0.15)] active:scale-[0.98] cursor-pointer"
                          : capped
                            ? "border-white/[0.06] bg-[#080C0E]/70 text-slate-600 cursor-not-allowed"
                            : "border-white/[0.08] bg-[#080C0E]/70 text-slate-400 hover:border-white/20 hover:text-white active:scale-[0.98] cursor-pointer"
                      }`}
                    >
                      {model.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Pick 2–{MAX_SELECTION} models for side-by-side specs
              </p>
              <button
                type="button"
                onClick={() =>
                  setSelectedIds(
                    selectedIds.length === 0 ? DEFAULT_SELECTION : [],
                  )
                }
                className="mt-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-[#00FF9D] active:scale-95 cursor-pointer"
              >
                {selectedIds.length === 0 ? "RESTORE DEFAULTS" : "CLEAR ALL"}
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
                    <li key={model.id} style={{ "--stagger": index }} className="stagger-item">
                      <Link
                        to={`/models/${encodeURIComponent(model.id)}`}
                        className={`group flex flex-col gap-4 rounded-2xl border bg-[#0E141B]/95 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#131B24] active:scale-[0.99] sm:flex-row sm:items-center ${
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
