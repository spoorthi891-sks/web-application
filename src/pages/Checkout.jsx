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
          <p className="text-sm text-slate-400">Loading model details...</p>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <h1 className="text-2xl font-bold text-white">Model not found</h1>
        <p className="mt-2 text-sm text-slate-400">
          The model <code className="text-cyan-300">{id}</code> is not in the
          registry.
        </p>
        <Link
          to="/explore"
          className="mt-8 inline-block rounded-xl bg-linear-to-r from-neon-blue to-neon-emerald px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
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
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-3xl text-emerald-300">
          ✓
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">
          You&apos;re subscribed
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {model.name} on the {plan.name} plan is live. Here&apos;s your API
          key — store it somewhere safe, it won&apos;t be shown again.
        </p>

        <div className="mt-8 flex items-center justify-between gap-3 rounded-xl border border-cyan-400/30 bg-cyan-400/5 px-5 py-4">
          <code className="truncate font-mono text-sm text-cyan-200">
            {apiKey}
          </code>
          <button
            type="button"
            onClick={handleCopyKey}
            className="shrink-0 rounded-lg border border-white/10 bg-slate-950/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <Link
            to={`/sandbox`}
            className="rounded-xl bg-linear-to-r from-neon-blue to-neon-emerald px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            Run your first inference
          </Link>
          <Link
            to={`/models/${encodeURIComponent(model.id)}`}
            className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-300"
          >
            Back to model
          </Link>
        </div>
      </div>
    );
  }

  const lineItems = [
    {
      label: `Usage (${formatTokenCount(traffic.monthlyRequests)} req × ${formatTokenCount(traffic.avgTokensPerRequest)} tokens)`,
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
      label: "Platform fee",
      value: cost.platformFee === 0 ? "$0" : formatUSD(cost.platformFee),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link
        to={`/models/${encodeURIComponent(model.id)}`}
        className="text-sm text-slate-400 transition-colors hover:text-cyan-300"
      >
        ← Back to {model.name}
      </Link>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">
        Checkout
      </h1>
      <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-300">
          Demo mode
        </span>
        Simulated Stripe-style checkout — no real charge is made.
      </p>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <form
          onSubmit={handlePay}
          className="space-y-5 rounded-2xl border border-white/5 bg-slate-900/60 p-6"
        >
          <div>
            <label
              htmlFor="checkout-email"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Work email
            </label>
            <input
              id="checkout-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50"
            />
          </div>

          <div>
            <label
              htmlFor="checkout-card"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
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
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 font-mono text-sm text-slate-200 placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="checkout-expiry"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Expiry
              </label>
              <input
                id="checkout-expiry"
                inputMode="numeric"
                value={expiry}
                onChange={(event) => setExpiry(formatExpiry(event.target.value))}
                placeholder="MM/YY"
                autoComplete="cc-exp"
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 font-mono text-sm text-slate-200 placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50"
              />
            </div>
            <div>
              <label
                htmlFor="checkout-cvc"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                CVC
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
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 font-mono text-sm text-slate-200 placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="checkout-name"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Name on card
            </label>
            <input
              id="checkout-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ada Lovelace"
              autoComplete="cc-name"
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50"
            />
          </div>

          <button
            type="submit"
            disabled={!formValid || phase === "processing"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-neon-blue to-neon-emerald px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {phase === "processing" ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/40 border-t-slate-900" />
                Processing payment...
              </>
            ) : (
              `Pay ${formatUSD(cost.total)} / mo`
            )}
          </button>
          <p className="text-center text-[11px] text-slate-600">
            Secured by Highrise Billing · PCI DSS · cancel anytime
          </p>
        </form>

        <aside className="space-y-4 rounded-2xl border border-white/5 bg-slate-900/60 p-6 lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold text-white">Order summary</h2>

          <div className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-slate-950/60 p-4">
            <div>
              <p className="text-sm font-semibold text-white">{model.name}</p>
              <p className="mt-0.5 text-xs uppercase tracking-wider text-slate-500">
                {model.provider} · {model.category}
              </p>
            </div>
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-300">
              {plan.name}
            </span>
          </div>

          <dl className="space-y-2.5 border-t border-white/5 pt-4 text-sm">
            {lineItems.map(({ label, value, accent }) => (
              <div key={label} className="flex items-baseline justify-between gap-4">
                <dt className="text-xs leading-relaxed text-slate-500">{label}</dt>
                <dd
                  className={`shrink-0 font-medium ${accent ? "text-emerald-300" : "text-slate-300"}`}
                >
                  {value}
                </dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 border-t border-white/5 pt-3">
              <dt className="text-sm font-semibold text-white">Total / month</dt>
              <dd className="text-lg font-bold text-white">
                {formatUSD(cost.total)}
              </dd>
            </div>
          </dl>

          <ul className="space-y-1.5 border-t border-white/5 pt-4 text-xs text-slate-500">
            {plan.perks.map((perk) => (
              <li key={perk} className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                {perk}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
