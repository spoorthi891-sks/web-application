import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getModelById } from "../data/modelsRegistry.js";
import { fetchHfModelDetail } from "../utils/hfHub.js";
import { formatUSD, formatTokenCount } from "../utils/costCalculator.js";
import { calculatePlanCost, getPlanById } from "../utils/pricingPlans.js";

function generateApiKey() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `highrise_sk_${hex}`;
}

function formatCardNumber(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function Checkout() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const registryModel = getModelById(id);
  const [hfModel, setHfModel] = useState(null);
  const [hfStatus, setHfStatus] = useState(registryModel ? "ready" : "loading");

  useEffect(() => {
    if (registryModel) return undefined;
    let cancelled = false;
    setHfStatus("loading");
    fetchHfModelDetail(id)
      .then((detail) => {
        if (!cancelled) {
          setHfModel(detail);
          setHfStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setHfStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id, registryModel]);

  const model = registryModel ?? hfModel;

  const plan = getPlanById(searchParams.get("plan"));
  const traffic = {
    monthlyRequests: parseInt(searchParams.get("requests"), 10) || 250000,
    avgTokensPerRequest: parseInt(searchParams.get("tokens"), 10) || 1200,
  };

  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [phase, setPhase] = useState("form");
  const [apiKey, setApiKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const cost = useMemo(
    () => calculatePlanCost(plan, model, traffic),
    [plan, model, traffic],
  );

  if (!model || hfStatus === "loading") {
    if (hfStatus === "loading") {
      return (
        <div className="mx-auto max-w-3xl px-6 py-32 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#00FF9D] border-t-transparent" />
          <p className="mt-4 font-mono text-xs text-slate-400">PROVISIONING CHECKOUT SESSION...</p>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <h1 className="text-2xl font-bold text-white">Model not found</h1>
        <p className="mt-2 text-sm text-slate-400">
          The model <code className="font-mono text-[#00FF9D]">{id}</code> is not in the
          registry.
        </p>
        <Link
          to="/explore"
          className="mt-8 inline-block rounded-full bg-[#00FF9D] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#0B0F12] shadow-[0_0_20px_rgba(0,255,157,0.35)] transition hover:bg-[#10B981]"
        >
          Back to marketplace
        </Link>
      </div>
    );
  }

  const cardDigits = cardNumber.replace(/\s/g, "");
  const formValid =
    /.+@.+\..+/.test(email) &&
    cardDigits.length === 16 &&
    /^\d{2}\/\d{2}$/.test(expiry) &&
    /^\d{3,4}$/.test(cvc) &&
    name.trim().length > 1;

  function handlePay(event) {
    event.preventDefault();
    if (!formValid || phase !== "form") return;
    setPhase("processing");
    setTimeout(() => {
      setApiKey(generateApiKey());
      setPhase("done");
    }, 1800);
  }

  async function handleCopyKey() {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  if (phase === "done") {
    return (
      <div className="relative min-h-screen bg-[#0B0F12]">
        <div className="pointer-events-none absolute top-10 left-1/2 h-[450px] w-[600px] -translate-x-1/2 rounded-full bg-[#00FF9D]/[0.08] blur-[140px]" />

        <div className="relative mx-auto max-w-2xl px-6 py-24 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-4xl text-[#00FF9D] shadow-[0_0_30px_rgba(0,255,157,0.4)]">
            ✓
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Subscription Activated
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Dedicated endpoint for <span className="font-semibold text-white">{model.name}</span> on the{" "}
            <span className="font-semibold text-[#00FF9D]">{plan.name}</span> plan is provisioned.
          </p>

          <div className="mt-8 flex items-center justify-between gap-3 rounded-2xl border border-[#00FF9D]/40 bg-[#00FF9D]/[0.05] p-5 shadow-[0_0_35px_-8px_rgba(0,255,157,0.25)]">
            <code className="truncate font-mono text-sm font-bold text-[#00FF9D]">
              {apiKey}
            </code>
            <button
              type="button"
              onClick={handleCopyKey}
              className="shrink-0 rounded-full border border-white/20 bg-[#0B0F12] px-4 py-2 font-mono text-xs font-semibold text-slate-200 transition hover:border-[#00FF9D] hover:text-[#00FF9D]"
            >
              {copied ? "COPIED ✓" : "COPY KEY"}
            </button>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/sandbox"
              className="rounded-full bg-[#00FF9D] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#0B0F12] shadow-[0_0_20px_rgba(0,255,157,0.35)] transition-all hover:bg-[#10B981] hover:shadow-[0_0_28px_rgba(0,255,157,0.55)]"
            >
              Run inference in Sandbox
            </Link>
            <Link
              to={`/models/${encodeURIComponent(model.id)}`}
              className="rounded-full border border-white/10 bg-[#12181F] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-200 transition hover:border-[#00FF9D]/40 hover:text-[#00FF9D]"
            >
              Back to model specs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const lineItems = [
    {
      label: `Workload (${formatTokenCount(traffic.monthlyRequests)} req × ${formatTokenCount(traffic.avgTokensPerRequest)} tokens)`,
      value: formatUSD(cost.usage),
    },
    ...(plan.usageDiscount > 0
      ? [
          {
            label: `${plan.name} discount (−${Math.round(plan.usageDiscount * 100)}%)`,
            value: `−${formatUSD(cost.savings)}`,
            accent: true,
          },
        ]
      : []),
    {
      label: "Platform management fee",
      value: cost.platformFee === 0 ? "$0" : formatUSD(cost.platformFee),
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#0B0F12]">
      <div className="relative mx-auto max-w-5xl px-6 py-12">
        <Link
          to={`/models/${encodeURIComponent(model.id)}`}
          className="group inline-flex items-center gap-1 font-mono text-xs font-semibold text-slate-400 transition-colors hover:text-[#00FF9D]"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span> BACK TO {model.name.toUpperCase()}
        </Link>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Complete Provisioning
        </h1>
        <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#00FF9D]">
            DEMO MODE
          </span>
          Simulated high-assurance billing — no live credit card charge is incurred.
        </p>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          <form
            onSubmit={handlePay}
            className="space-y-5 rounded-2xl border border-white/[0.08] bg-[#12181F]/90 p-6 sm:p-8 shadow-xl backdrop-blur-md"
          >
            <div>
              <label
                htmlFor="checkout-email"
                className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400"
              >
                Work email address
              </label>
              <input
                id="checkout-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="eng-lead@enterprise.com"
                autoComplete="email"
                className="w-full rounded-xl border border-white/[0.1] bg-[#0B0F12] px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-[#00FF9D]/50 focus:shadow-[0_0_20px_-4px_rgba(0,255,157,0.3)]"
              />
            </div>

            <div>
              <label
                htmlFor="checkout-card"
                className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400"
              >
                Card number
              </label>
              <input
                id="checkout-card"
                inputMode="numeric"
                value={cardNumber}
                onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                placeholder="4242 4242 4242 4242"
                autoComplete="cc-number"
                className="w-full rounded-xl border border-white/[0.1] bg-[#0B0F12] px-4 py-2.5 font-mono text-xs text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-[#00FF9D]/50 focus:shadow-[0_0_20px_-4px_rgba(0,255,157,0.3)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="checkout-expiry"
                  className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                >
                  Expiry date
                </label>
                <input
                  id="checkout-expiry"
                  inputMode="numeric"
                  value={expiry}
                  onChange={(event) => setExpiry(formatExpiry(event.target.value))}
                  placeholder="MM/YY"
                  autoComplete="cc-exp"
                  className="w-full rounded-xl border border-white/[0.1] bg-[#0B0F12] px-4 py-2.5 font-mono text-xs text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-[#00FF9D]/50 focus:shadow-[0_0_20px_-4px_rgba(0,255,157,0.3)]"
                />
              </div>
              <div>
                <label
                  htmlFor="checkout-cvc"
                  className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                >
                  Security CVC
                </label>
                <input
                  id="checkout-cvc"
                  inputMode="numeric"
                  value={cvc}
                  onChange={(event) =>
                    setCvc(event.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="123"
                  autoComplete="cc-csc"
                  className="w-full rounded-xl border border-white/[0.1] bg-[#0B0F12] px-4 py-2.5 font-mono text-xs text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-[#00FF9D]/50 focus:shadow-[0_0_20px_-4px_rgba(0,255,157,0.3)]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="checkout-name"
                className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400"
              >
                Name on card
              </label>
              <input
                id="checkout-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ada Lovelace"
                autoComplete="cc-name"
                className="w-full rounded-xl border border-white/[0.1] bg-[#0B0F12] px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-[#00FF9D]/50 focus:shadow-[0_0_20px_-4px_rgba(0,255,157,0.3)]"
              />
            </div>

            <button
              type="submit"
              disabled={!formValid || phase === "processing"}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#00FF9D] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#0B0F12] shadow-[0_0_20px_rgba(0,255,157,0.35)] transition-all hover:bg-[#10B981] hover:shadow-[0_0_28px_rgba(0,255,157,0.55)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {phase === "processing" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0B0F12] border-t-transparent" />
                  PROVISIONING INSTANCE...
                </>
              ) : (
                `CONFIRM & PAY ${formatUSD(cost.total)} / MO`
              )}
            </button>
            <p className="text-center font-mono text-[10px] text-slate-500">
              Secured by Highrise Billing · PCI DSS Compliance · Cancel Anytime
            </p>
          </form>

          <aside className="space-y-5 rounded-2xl border border-white/[0.08] bg-[#12181F]/90 p-6 shadow-xl backdrop-blur-md lg:sticky lg:top-24">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-white">Order Summary</h2>

            <div className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#0B0F12]/80 p-4">
              <div>
                <p className="text-sm font-bold text-white">{model.name}</p>
                <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  {model.provider} · {model.category}
                </p>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-[#00FF9D]">
                {plan.name}
              </span>
            </div>

            <dl className="space-y-3 border-t border-white/[0.07] pt-4 font-mono text-xs">
              {lineItems.map(({ label, value, accent }) => (
                <div key={label} className="flex items-baseline justify-between gap-4">
                  <dt className="text-[11px] text-slate-400">{label}</dt>
                  <dd
                    className={`shrink-0 font-bold ${accent ? "text-[#00FF9D]" : "text-slate-200"}`}
                  >
                    {value}
                  </dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 border-t border-white/[0.07] pt-3">
                <dt className="text-xs font-bold text-white uppercase tracking-wider">Total / Month</dt>
                <dd className="font-mono text-xl font-extrabold text-[#00FF9D]">
                  {formatUSD(cost.total)}
                </dd>
              </div>
            </dl>

            <ul className="space-y-2 border-t border-white/[0.07] pt-4 text-xs text-slate-400">
              {plan.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2">
                  <span className="font-bold text-[#00FF9D]">✓</span>
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
