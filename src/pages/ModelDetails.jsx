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
        The model <code className="text-cyan-300">{id}</code> is not in the
        registry or on the Hugging Face Hub.
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

function RegistryView({ model }) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Link
        to="/explore"
        className="text-sm text-slate-400 transition-colors hover:text-cyan-300"
      >
        ← Back to marketplace
      </Link>

      <header className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-300">
            {model.category}
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
            {model.name}
          </h1>
          <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
            by {model.provider}
          </p>
          <p className="mt-4 max-w-2xl leading-relaxed text-slate-400">
            {model.description}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {model.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-400"
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" })}
            className="rounded-xl bg-linear-to-r from-neon-blue to-neon-emerald px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            Deploy to production
          </button>
          <Link
            to="/sandbox"
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-300"
          >
            Open in Sandbox
          </Link>
        </div>
      </header>

      <dl className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Latency (median)", value: `${model.latencyMs} ms` },
          { label: "Benchmark score", value: model.benchmarkScore.toFixed(1) },
          { label: "Pricing", value: priceLabel(model) },
          { label: "Privacy", value: model.privacyRating },
          { label: "Provider", value: model.provider },
          { label: "Category", value: model.category },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-white/5 bg-slate-900/60 p-4"
          >
            <dt className="text-xs uppercase tracking-wider text-slate-500">
              {label}
            </dt>
            <dd className="mt-1.5 text-sm font-semibold text-white">{value}</dd>
          </div>
        ))}
      </dl>

      <div id="plans" />
      <PricingSection model={model} />

      <div className="mt-10">
        <CodeGenerator model={model} />
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
          className="mt-8 inline-block rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-300"
        >
          Back to marketplace
        </Link>
      </div>
    );
  }

  if (hfState.status === "ready") return <HfModelDetail model={hfState.model} />;

  return <NotFound id={id} />;
}