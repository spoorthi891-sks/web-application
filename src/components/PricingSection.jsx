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
    <section className="mt-10 rounded-2xl border border-white/5 bg-slate-900/60 p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Plans &amp; pricing</h2>
          <p className="mt-1 text-sm text-slate-400">
            Project your monthly bill and pick a plan — list price is{" "}
            {priceLabel(model)}.
          </p>
        </div>
        <button
          type="button"
          onClick={goToCheckout}
          className="shrink-0 rounded-xl bg-linear-to-r from-neon-blue to-neon-emerald px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110"
        >
          Continue to checkout →
        </button>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-slate-500">
              Monthly requests
            </span>
            <span className="font-semibold text-cyan-300">
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
            className="w-full accent-cyan-400"
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-slate-500">
              Avg tokens per request
            </span>
            <span className="font-semibold text-cyan-300">
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
            className="w-full accent-cyan-400"
          />
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const cost = calculatePlanCost(plan, model, traffic);
          const selected = plan.id === selectedPlanId;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlanId(plan.id)}
              aria-pressed={selected}
              className={`relative flex flex-col rounded-xl border p-5 text-left transition ${
                selected
                  ? "border-cyan-400/60 bg-cyan-400/5 shadow-[0_0_28px_-10px_rgba(34,211,238,0.45)]"
                  : "border-white/10 bg-slate-950/40 hover:border-white/25"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 right-4 rounded-full border border-emerald-400/30 bg-slate-950 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Popular
                </span>
              )}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{plan.name}</h3>
                <span
                  className={`h-4 w-4 rounded-full border transition ${
                    selected
                      ? "border-cyan-400 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]"
                      : "border-white/25"
                  }`}
                />
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{plan.tagline}</p>
              <p className="mt-4 text-2xl font-bold text-white">
                {formatUSD(cost.total)}
                <span className="text-xs font-medium text-slate-500"> / mo</span>
              </p>
              <ul className="mt-4 space-y-1.5 border-t border-white/5 pt-4 text-xs text-slate-400">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    {perk}
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
