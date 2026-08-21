import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchTrendingModels } from "../utils/hfHub.js";
import ModelCard from "../components/ModelCard.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";

const QUICK_TAGS = ["chat", "reasoning", "code", "conversational", "quantized"];

const VALUE_PROPS = [
  {
    step: "01",
    title: "Intelligent matchmaker",
    body: "Set a budget, pick speed or accuracy, and get ranked recommendations scored against the full registry.",
  },
  {
    step: "02",
    title: "Transparent pricing",
    body: "Per-token and per-request pricing with monthly cost projections, so finance signs off before engineering ships.",
  },
  {
    step: "03",
    title: "Compliance-first",
    body: "Every model carries its privacy posture — GDPR, HIPAA, SOC 2 — filterable across the entire marketplace.",
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [trending, setTrending] = useState([]);
  const [status, setStatus] = useState("loading");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    fetchTrendingModels()
      .then((data) => {
        if (cancelled) return;
        setTrending(data.slice(0, 3));
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const providerCount = new Set(trending.map((model) => model.provider)).size;

  const stats = [
    { value: trending.length ? String(trending.length) : "—", label: "Trending models" },
    { value: providerCount ? String(providerCount) : "—", label: "Verified providers" },
    { value: "99.95%", label: "Platform uptime" },
    { value: "<400ms", label: "Median latency" },
  ];

  function handleSearch(event) {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    navigate(trimmed ? `/explore?q=${encodeURIComponent(trimmed)}` : "/explore");
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_35%,transparent_75%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

      <section className="relative mx-auto max-w-7xl px-6 pt-24 pb-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-1.5 text-xs font-medium text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-neon-emerald" />
          Enterprise AI Marketplace
        </span>

        <h1 className="mx-auto mt-8 max-w-3xl text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
          Ship AI features on{" "}
          <span className="bg-linear-to-r from-neon-blue to-neon-emerald bg-clip-text text-transparent">
            enterprise-grade
          </span>{" "}
          models
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
          Describe your workload and Highrise matches you with vetted foundation
          models — compare pricing, latency, and compliance in one place.
        </p>

        <form
          onSubmit={handleSearch}
          className="mx-auto mt-10 flex max-w-xl items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-2 shadow-[0_0_48px_-12px_rgba(34,211,238,0.25)] transition focus-within:border-cyan-400/50"
        >
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Describe your workload — e.g. transcribe support calls"
            aria-label="Search models"
            className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-500"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-linear-to-r from-neon-blue to-neon-emerald px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            Find models
          </button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-slate-500">Popular:</span>
          {QUICK_TAGS.map((tag) => (
            <Link
              key={tag}
              to={`/explore?q=${encodeURIComponent(tag)}`}
              className="rounded-full border border-white/10 px-3 py-1 text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-300"
            >
              {tag}
            </Link>
          ))}
        </div>

        <dl className="mx-auto mt-20 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/5 bg-white/5 sm:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="flex flex-col bg-slate-950/80 px-4 py-6">
              <dd className="text-2xl font-bold text-white">{value}</dd>
              <dt className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                {label}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Trending models
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Hottest open-weights models on the Hugging Face Hub right now.
            </p>
          </div>
          <Link
            to="/explore"
            className="shrink-0 text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-200"
          >
            View all →
          </Link>
        </div>
        {status === "loading" && (
          <div className="grid gap-6 md:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}
        {status === "error" && (
          <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
            <p className="text-sm font-medium text-slate-300">
              Couldn&apos;t reach the Hugging Face Hub right now.
            </p>
            <Link
              to="/explore"
              className="mt-3 inline-block text-xs font-medium text-cyan-300 transition-colors hover:text-cyan-200"
            >
              Browse the marketplace →
            </Link>
          </div>
        )}
        {status === "ready" && (
          <div className="grid gap-6 md:grid-cols-3">
            {trending.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        )}
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pt-8 pb-28">
        <div className="grid gap-6 md:grid-cols-3">
          {VALUE_PROPS.map(({ step, title, body }) => (
            <article
              key={step}
              className="rounded-2xl border border-white/5 bg-slate-900/60 p-7 transition hover:border-cyan-400/30"
            >
              <span className="text-xs font-bold tracking-widest text-cyan-400/70">
                {step}
              </span>
              <h2 className="mt-3 text-lg font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {body}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
