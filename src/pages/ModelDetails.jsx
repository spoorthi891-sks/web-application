import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getModelById } from "../data/modelsRegistry.js";
import { fetchHfModelDetail } from "../utils/hfHub.js";
import { priceLabel } from "../utils/costCalculator.js";
import CodeGenerator from "../components/CodeGenerator.jsx";
import PricingSection from "../components/PricingSection.jsx";
import HfModelDetail from "../components/HfModelDetail.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";

function NotFound({ id }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-32 text-center">
      <h1 className="text-2xl font-bold text-white">Model not found</h1>
      <p className="mt-2 text-sm text-slate-400">
        The model <code className="font-mono text-[#00FF9D]">{id}</code> is not in the
        registry or on the Hugging Face Hub.
      </p>
      <Link
        to="/explore"
        className="mt-8 inline-block rounded-full bg-[#00FF9D] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_20px_rgba(0,255,157,0.3)] transition hover:bg-[#10B981] active:scale-[0.98]"
      >
        Back to marketplace
      </Link>
    </div>
  );
}

function RegistryView({ model }) {
  return (
    <div className="relative min-h-screen bg-[#080C0E]">
      <div className="pointer-events-none absolute top-0 right-1/3 h-[400px] w-[600px] rounded-full bg-[#00FF9D]/[0.05] blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-12">
        <Link
          to="/explore"
          className="group inline-flex items-center gap-1 font-mono text-xs font-semibold text-slate-400 transition-colors hover:text-[#00FF9D]"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span> BACK TO MARKETPLACE
        </Link>

        <header className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-[#00FF9D]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9D]" />
              {model.category}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {model.name}
            </h1>
            <p className="mt-1 font-mono text-xs uppercase tracking-wider text-slate-500">
              by <span className="text-slate-300 font-semibold">{model.provider}</span> · VERIFIED PRODUCTION ENDPOINT
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
              {model.description}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {model.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-white/[0.08] bg-[#0E141B] px-3 py-1 font-mono text-[11px] text-slate-400"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            <button
              type="button"
              onClick={() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-full bg-[#00FF9D] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all hover:bg-[#10B981] hover:shadow-[0_0_28px_rgba(0,255,157,0.5)] active:scale-[0.98] cursor-pointer"
            >
              Deploy to production
            </button>
            <Link
              to={`/sandbox?model=${encodeURIComponent(model.id)}`}
              className="rounded-full border border-white/[0.1] bg-[#0E141B]/90 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-200 transition-all hover:border-[#00FF9D]/40 hover:text-[#00FF9D] hover:bg-[#131B24] active:scale-[0.98]"
            >
              Open in Sandbox
            </Link>
          </div>
        </header>

        {/* Spec badges grid */}
        <dl className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Latency (median)", value: `${model.latencyMs} ms` },
            { label: "Benchmark score", value: model.benchmarkScore.toFixed(1), accent: true },
            { label: "Pricing", value: priceLabel(model) },
            { label: "Privacy posture", value: model.privacyRating },
            { label: "Provider", value: model.provider },
            { label: "Category", value: model.category },
          ].map(({ label, value, accent }, index) => (
            <div
              key={label}
              style={{ "--stagger": index }}
              className="stagger-item rounded-2xl border border-white/[0.08] bg-[#0E141B]/95 p-4 backdrop-blur-md shadow-md transition-colors hover:bg-[#131B24]"
            >
              <dt className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                {label}
              </dt>
              <dd className={`mt-1.5 font-mono text-sm font-bold ${accent ? "text-[#00FF9D]" : "text-white"}`}>
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div id="plans" />
        <PricingSection model={model} />

        <div className="mt-10">
          <CodeGenerator model={model} />
        </div>
      </div>
    </div>
  );
}

export default function ModelDetails() {
  const { id } = useParams();
  const registryModel = getModelById(id);
  const [hfState, setHfState] = useState({ status: "idle", model: null, error: null });

  useEffect(() => {
    if (registryModel) return undefined;
    let cancelled = false;
    setHfState({ status: "loading", model: null, error: null });
    fetchHfModelDetail(id)
      .then((model) => {
        if (!cancelled) setHfState({ status: "ready", model });
      })
      .catch((error) => {
        if (!cancelled)
          setHfState({ status: "error", error: error.message ?? "Fetch failed" });
      });
    return () => {
      cancelled = true;
    };
  }, [id, registryModel]);

  if (registryModel) return <RegistryView model={registryModel} />;

  if (hfState.status === "loading") {
    return (
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-white/10" />
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_360px]">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (hfState.status === "error") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-xl font-bold text-white">
          Couldn&apos;t load this model
        </h1>
        <p className="mt-2 text-sm text-slate-500">{hfState.error}</p>
        <Link
          to="/explore"
          className="mt-8 inline-block rounded-full border border-white/10 bg-[#0E141B] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-200 transition hover:border-[#00FF9D]/40 hover:text-[#00FF9D]"
        >
          Back to marketplace
        </Link>
      </div>
    );
  }

  if (hfState.status === "ready") return <HfModelDetail model={hfState.model} />;

  return <NotFound id={id} />;
}