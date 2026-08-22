import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getModelById } from "../data/modelsRegistry.js";
import { fetchHfModelDetail } from "../utils/hfHub.js";
import { formatUSD, formatTokenCount } from "../utils/costCalculator.js";
import { calculatePlanCost, getPlanById } from "../utils/pricingPlans.js";
import { saveApiKey, useAuth } from "../utils/auth.js";

function generateApiKey() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `highrise_sk_${hex}`;
}

const PROVISION_STEPS = [
  {
    id: "queue",
    label: "Request queued",
    log: "orchestrator: job accepted · queue position #3 · region us-east-1",
    ms: 1600,
  },
  {
    id: "gpu",
    label: "GPU allocation",
    log: "scheduler: reserving H100 slice · 80GB HBM3 · NVLink mesh attached",
    ms: 1900,
  },
  {
    id: "live",
    label: "Endpoint live",
    log: "gateway: TLS 1.3 handshake OK · health probe 200 · serving traffic",
    ms: 1500,
  },
];

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
  const [provisionStep, setProvisionStep] = useState(0);
  const [apiKey, setApiKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { session } = useAuth();

  const cost = useMemo(
    () => calculatePlanCost(plan, model, traffic),
    [plan, model, traffic],
  );

  useEffect(() => {
    if (phase !== "provisioning") return undefined;
    let cancelled = false;
    let elapsed = 0;
    const timers = [];
    PROVISION_STEPS.forEach((step, index) => {
      elapsed += step.ms;
      timers.push(
        setTimeout(() => {
          if (!cancelled) setProvisionStep(index + 1);
        }, elapsed),
      );
    });
    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        const key = generateApiKey();
        if (session) {
          saveApiKey({
            apiKey: key,
            modelName: model.name,
            planName: plan.name,
            modelId: model.id,
          });
        }
        setApiKey(key);
        setPhase("done");
      }, elapsed + 700),
    );
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [phase]);

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
          className="mt-8 inline-block rounded-full bg-[#00FF9D] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_20px_rgba(0,255,157,0.3)] transition hover:bg-[#10B981]"
        >
          Back to marketplace
        </Link>
      </div>
    );
  }

  const cardDigits = cardNumber.replace(/\s/g, "");
  const fieldErrors = {
    email: /.+@.+\..+/.test(email) ? null : "Enter a valid work email address",
    cardNumber:
      cardDigits.length === 16
        ? null
        : `Card number must be 16 digits (${cardDigits.length}/16 entered)`,
    expiry: /^\d{2}\/\d{2}$/.test(expiry) ? null : "Use MM/YY format",
    cvc: /^\d{3,4}$/.test(cvc) ? null : "Enter the 3–4 digit code",
    name: name.trim().length > 1 ? null : "Enter the name printed on the card",
  };
  const formValid = Object.values(fieldErrors).every((error) => error === null);
  const showFieldError = (field) =>
    (submitted || fieldErrors[field]) && fieldErrors[field];

  function handlePay(event) {
    event.preventDefault();
    setSubmitted(true);
    if (!formValid || phase !== "form") return;
    setProvisionStep(0);
    setPhase("provisioning");
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

  if (phase === "provisioning") {
    return (
      <div className="relative min-h-screen bg-[#080C0E]">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
        <div className="pointer-events-none absolute top-1/3 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[#00FF9D]/[0.05] blur-[140px]" />

        <div className="relative mx-auto max-w-xl px-6 py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-semibold tracking-widest text-[#00FF9D] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
              PROVISIONING PIPELINE
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Deploying your <span className="text-[#00FF9D]">endpoint</span>
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {model.name} · {plan.name} plan — payment confirmed, spinning up
              dedicated capacity.
            </p>
          </div>

          <div
            role="status"
            aria-live="polite"
            className="mt-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E141B]/95 shadow-xl backdrop-blur-md"
          >
            <ol className="divide-y divide-white/[0.06]">
              {PROVISION_STEPS.map((step, index) => {
                const done = provisionStep > index;
                const active = provisionStep === index;
                return (
                  <li key={step.id} className={`p-5 sm:p-6 ${active ? "bg-[#00FF9D]/[0.03]" : ""}`}>
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-bold transition-all duration-300 ${
                          done
                            ? "border-emerald-500/50 bg-emerald-500/15 text-[#00FF9D]"
                            : active
                              ? "border-[#00FF9D]/60 bg-[#00FF9D]/[0.06]"
                              : "border-white/10 bg-[#080C0E] text-slate-600"
                        }`}
                      >
                        {done ? (
                          "✓"
                        ) : active ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#00FF9D] border-t-transparent" />
                        ) : (
                          String(index + 1).padStart(2, "0")
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block font-mono text-sm font-bold transition-colors ${
                            done || active ? "text-white" : "text-slate-500"
                          }`}
                        >
                          {step.label}
                        </span>
                        <span
                          className={`mt-0.5 block truncate font-mono text-[11px] transition-all duration-300 ${
                            done
                              ? "text-[#00FF9D]/70"
                              : active
                                ? "text-slate-400"
                                : "text-slate-600"
                          }`}
                        >
                          {done ? step.log : active ? step.log : "waiting…"}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 font-mono text-[9px] font-bold uppercase tracking-widest ${
                          done ? "text-[#00FF9D]" : "text-slate-600"
                        }`}
                      >
                        {done ? "DONE" : "\u00A0"}
                      </span>
                    </div>
                    {(active || done) && (
                      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.05]" style={{ marginLeft: "3.25rem" }}>
                        <div
                          className={`h-full rounded-full bg-linear-to-r from-[#00FF9D] to-emerald-300 transition-all duration-700 ease-out ${
                            done ? "w-full" : "w-2/3 animate-flow"
                          }`}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>

            <div className="border-t border-white/[0.06] bg-[#080C0E]/80 px-5 py-3.5 text-center sm:px-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                Do not close this window · simulated provision in progress
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="relative min-h-screen bg-[#080C0E]">
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

          <div className="mt-8 flex items-center justify-between gap-3 rounded-2xl border border-[#00FF9D]/40 bg-[#00FF9D]/[0.05] p-5 shadow-[0_0_35px_-8px_rgba(0,255,157,0.25)] animate-fade-rise">
            <code className="truncate font-mono text-sm font-bold text-[#00FF9D]">
              {apiKey}
            </code>
            <button
              type="button"
              onClick={handleCopyKey}
              className="shrink-0 rounded-full border border-white/20 bg-[#080C0E] px-4 py-2 font-mono text-xs font-semibold text-slate-200 transition hover:border-[#00FF9D] hover:text-[#00FF9D] active:scale-95 cursor-pointer"
            >
              {copied ? "COPIED ✓" : "COPY KEY"}
            </button>
          </div>

          {session && (
            <p className="mt-4 font-mono text-[11px] text-[#00FF9D]/80">
              ✓ KEY SAVED TO YOUR WORKSPACE VAULT
            </p>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to={`/sandbox?model=${encodeURIComponent(model.id)}`}
              className="rounded-full bg-[#00FF9D] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all hover:bg-[#10B981] hover:shadow-[0_0_28px_rgba(0,255,157,0.5)] active:scale-[0.98]"
            >
              Run inference in Sandbox
            </Link>
            {session && (
              <Link
                to="/account"
                className="rounded-full border border-white/10 bg-[#0E141B] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-200 transition hover:border-[#00FF9D]/40 hover:text-[#00FF9D] active:scale-[0.98]"
              >
                View workspace
              </Link>
            )}
            <Link
              to={`/models/${encodeURIComponent(model.id)}`}
              className="rounded-full border border-white/10 bg-[#0E141B] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-200 transition hover:border-[#00FF9D]/40 hover:text-[#00FF9D] active:scale-[0.98]"
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
    <div className="relative min-h-screen bg-[#080C0E]">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
      <div className="pointer-events-none absolute top-0 right-1/4 h-[350px] w-[500px] rounded-full bg-[#00FF9D]/[0.04] blur-[140px]" />

      <div className="relative mx-auto max-w-5xl px-6 py-12">
        <Link
          to={`/models/${encodeURIComponent(model.id)}`}
          className="group inline-flex items-center gap-1 font-mono text-xs font-semibold text-slate-400 transition-colors hover:text-[#00FF9D]"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span> BACK TO {model.name.toUpperCase()}
        </Link>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-semibold tracking-widest text-[#00FF9D] uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
          SECURE BILLING TERMINAL
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Complete <span className="text-[#00FF9D]">provisioning</span>
        </h1>
        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400 sm:text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#00FF9D]">
            DEMO MODE
          </span>
          Simulated high-assurance billing — no live credit card charge is incurred.
        </p>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          <form
            onSubmit={handlePay}
            className="space-y-5 rounded-2xl border border-white/[0.08] bg-[#0E141B]/95 p-6 shadow-xl backdrop-blur-md sm:p-8"
          >
            <div className="flex items-center gap-2 border-b border-white/[0.07] pb-4">
              <span className="h-2 w-2 rounded-full bg-[#00FF9D]" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                Billing Details
              </h2>
            </div>
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
                aria-invalid={Boolean(showFieldError("email"))}
                className={`w-full rounded-xl border bg-[#080C0E] px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-[#00FF9D]/50 focus:shadow-[0_0_20px_-4px_rgba(0,255,157,0.3)] ${
                  showFieldError("email")
                    ? "border-rose-500/60"
                    : "border-white/[0.1]"
                }`}
              />
              {showFieldError("email") && (
                <p className="mt-1.5 font-mono text-[10px] text-rose-400">
                  {fieldErrors.email}
                </p>
              )}
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
                aria-invalid={Boolean(showFieldError("cardNumber"))}
                className={`w-full rounded-xl border bg-[#080C0E] px-4 py-2.5 font-mono text-xs text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-[#00FF9D]/50 focus:shadow-[0_0_20px_-4px_rgba(0,255,157,0.3)] ${
                  showFieldError("cardNumber")
                    ? "border-rose-500/60"
                    : "border-white/[0.1]"
                }`}
              />
              {showFieldError("cardNumber") && (
                <p className="mt-1.5 font-mono text-[10px] text-rose-400">
                  {fieldErrors.cardNumber}
                </p>
              )}
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
                  aria-invalid={Boolean(showFieldError("expiry"))}
                  className={`w-full rounded-xl border bg-[#080C0E] px-4 py-2.5 font-mono text-xs text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-[#00FF9D]/50 focus:shadow-[0_0_20px_-4px_rgba(0,255,157,0.3)] ${
                    showFieldError("expiry")
                      ? "border-rose-500/60"
                      : "border-white/[0.1]"
                  }`}
                />
                {showFieldError("expiry") && (
                  <p className="mt-1.5 font-mono text-[10px] text-rose-400">
                    {fieldErrors.expiry}
                  </p>
                )}
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
                  aria-invalid={Boolean(showFieldError("cvc"))}
                  className={`w-full rounded-xl border bg-[#080C0E] px-4 py-2.5 font-mono text-xs text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-[#00FF9D]/50 focus:shadow-[0_0_20px_-4px_rgba(0,255,157,0.3)] ${
                    showFieldError("cvc")
                      ? "border-rose-500/60"
                      : "border-white/[0.1]"
                  }`}
                />
                {showFieldError("cvc") && (
                  <p className="mt-1.5 font-mono text-[10px] text-rose-400">
                    {fieldErrors.cvc}
                  </p>
                )}
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
                aria-invalid={Boolean(showFieldError("name"))}
                className={`w-full rounded-xl border bg-[#080C0E] px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-[#00FF9D]/50 focus:shadow-[0_0_20px_-4px_rgba(0,255,157,0.3)] ${
                  showFieldError("name")
                    ? "border-rose-500/60"
                    : "border-white/[0.1]"
                }`}
              />
              {showFieldError("name") && (
                <p className="mt-1.5 font-mono text-[10px] text-rose-400">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!formValid}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#00FF9D] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all hover:bg-[#10B981] hover:shadow-[0_0_28px_rgba(0,255,157,0.5)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              {`CONFIRM & PAY ${formatUSD(cost.total)} / MO`}
            </button>
            <p className="text-center font-mono text-[10px] text-slate-500">
              Secured by Highrise Billing · PCI DSS Compliance · Cancel Anytime
            </p>
          </form>

          <aside className="space-y-5 rounded-2xl border border-white/[0.08] bg-[#0E141B]/95 p-6 shadow-xl backdrop-blur-md lg:sticky lg:top-24">
            <div className="flex items-center gap-2 border-b border-white/[0.07] pb-4">
              <span className="h-2 w-2 rounded-full bg-[#00FF9D]" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                Order Summary
              </h2>
            </div>

            <div className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#080C0E]/80 p-4">
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
