import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatUSD, formatTokenCount, priceLabel } from "../utils/costCalculator.js";
import { calculatePlanCost, PLANS } from "../utils/pricingPlans.js";

const DEFAULT_REQUESTS = 250000;
const DEFAULT_TOKENS = 1200;

export default function PricingSection({ model }) {
  const navigate = useNavigate();
  const [monthlyRequests, setMonthlyRequests] = useState(DEFAULT_REQUESTS);
  const [avgTokens, setAvgTokens] = useState(DEFAULT_TOKENS);
  const [selectedPlanId, setSelectedPlanId] = useState("pay-as-you-go");

  const traffic = { monthlyRequests, avgTokensPerRequest: avgTokens };

  function goToCheckout() {
    const params = new URLSearchParams({
      plan: selectedPlanId,
      requests: String(monthlyRequests),
      tokens: String(avgTokens),
    });
    navigate(`/models/${encodeURIComponent(model.id)}/checkout?${params.toString()}`);
  }

  return (
    <section className="mt-10 rounded-2xl border border-white/[0.08] bg-[#0E141B]/95 p-6 sm:p-8 shadow-xl backdrop-blur-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-white/[0.07] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#00FF9D] uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9D]" />
            DEPLOYMENT CAPACITY &amp; PRICING
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">Tiered Infrastructure Plans</h2>
          <p className="mt-1 text-xs text-slate-400">
            Project workload costs dynamically — base endpoint list price is{" "}
            <span className="font-mono font-semibold text-white">{priceLabel(model)}</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={goToCheckout}
          className="shrink-0 rounded-full bg-[#00FF9D] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all duration-200 hover:bg-[#10B981] hover:shadow-[0_0_28px_rgba(0,255,157,0.5)] active:scale-95 cursor-pointer"
        >
          Continue to checkout →
        </button>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 rounded-xl border border-white/[0.06] bg-[#080C0E]/70 p-5">
        <div>
          <div className="mb-2 flex items-center justify-between font-mono text-xs">
            <span className="font-semibold uppercase tracking-wider text-slate-400">
              Monthly requests
            </span>
            <span className="font-bold text-[#00FF9D]">
              {formatTokenCount(monthlyRequests)}
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="2000000"
            step="1000"
            value={monthlyRequests}
            onChange={(event) => setMonthlyRequests(parseInt(event.target.value, 10))}
            aria-label="Monthly requests"
            className="w-full accent-[#00FF9D] cursor-pointer"
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between font-mono text-xs">
            <span className="font-semibold uppercase tracking-wider text-slate-400">
              Avg tokens / request
            </span>
            <span className="font-bold text-[#00FF9D]">
              {avgTokens.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="10000"
            step="50"
            value={avgTokens}
            onChange={(event) => setAvgTokens(parseInt(event.target.value, 10))}
            aria-label="Average tokens per request"
            className="w-full accent-[#00FF9D] cursor-pointer"
          />
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {PLANS.map((plan) => {
          const cost = calculatePlanCost(plan, model, traffic);
          const selected = plan.id === selectedPlanId;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlanId(plan.id)}
              aria-pressed={selected}
              className={`relative flex flex-col justify-between rounded-2xl border p-6 text-left transition-all duration-300 ${
                selected
                  ? "border-[#00FF9D] bg-[#00FF9D]/[0.04] shadow-[0_0_32px_-8px_rgba(0,255,157,0.25)] ring-1 ring-[#00FF9D]/40"
                  : "border-white/[0.08] bg-[#080C0E]/80 hover:border-white/20 hover:bg-[#131B24]"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 right-5 rounded-full border border-emerald-500/40 bg-[#080C0E] px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#00FF9D] shadow-md">
                  POPULAR CHOICE
                </span>
              )}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-white">{plan.name}</h3>
                  <span
                    className={`h-4 w-4 rounded-full border transition-all ${
                      selected
                        ? "border-[#00FF9D] bg-[#00FF9D] shadow-[0_0_8px_#00FF9D]"
                        : "border-white/30"
                    }`}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">{plan.tagline}</p>
                <div className="mt-5">
                  <span className="font-mono text-3xl font-extrabold text-white">
                    {formatUSD(cost.total)}
                  </span>
                  <span className="font-mono text-xs text-slate-500"> / month</span>
                </div>
              </div>

              <ul className="mt-6 space-y-2 border-t border-white/[0.07] pt-5 text-xs text-slate-300">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5">
                    <span className="font-bold text-[#00FF9D]">✓</span>
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </section>
  );
}
