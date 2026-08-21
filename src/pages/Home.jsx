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
    icon: (
      <svg className="h-6 w-6 text-[#00FF9D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Transparent pricing",
    body: "Per-token and per-request pricing with monthly cost projections, so finance signs off before engineering ships.",
    icon: (
      <svg className="h-6 w-6 text-[#00FF9D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Compliance-first",
    body: "Every model carries its privacy posture — GDPR, HIPAA, SOC 2 — filterable across the entire marketplace.",
    icon: (
      <svg className="h-6 w-6 text-[#00FF9D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

const PIPELINE_NODES = [
  {
    id: "ingestion",
    label: "01. Workload Ingestion",
    tag: "STREAM INGEST",
    title: "Dynamic Token Routing & Prompt Normalization",
    desc: "Inbound requests are dynamically routed across FP8 and BF16 hardware clusters with automatic schema verification and prompt caching.",
    metrics: [{ k: "Throughput", v: "14.2k req/s" }, { k: "Cold Start", v: "0 ms" }, { k: "Cache Hit Rate", v: "84.6%" }],
  },
  {
    id: "orchestration",
    label: "02. Enclave Execution",
    tag: "ISOLATION LAYER",
    title: "Zero-Retention Confidential Compute Enclaves",
    desc: "Weights run in hardware-attested enclaves (AMD SEV-SNP / NVIDIA H100 CC). Memory buffers are wiped per transaction with cryptographic provenance.",
    metrics: [{ k: "Attestation", v: "Hardware-Rooted" }, { k: "Data Retention", v: "0 Bytes" }, { k: "Compliance", v: "HIPAA / SOC 2" }],
  },
  {
    id: "inference",
    label: "03. Quantized Inference",
    tag: "CORE ACCELERATION",
    title: "Sub-400ms High-Concurrency Token Generation",
    desc: "Optimized tensor-parallel kernels deliver deterministic low latency even under burst conditions with granular per-request token telemetry.",
    metrics: [{ k: "Median TTFB", v: "142 ms" }, { k: "Tokens / Sec", v: "185 tok/s" }, { k: "SLA Guarantee", v: "99.95%" }],
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [trending, setTrending] = useState([]);
  const [status, setStatus] = useState("loading");
  const [activeNode, setActiveNode] = useState(0);
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
    { value: trending.length ? String(trending.length) : "120+", label: "Trending models" },
    { value: providerCount ? String(providerCount) : "45+", label: "Verified providers" },
    { value: "99.95%", label: "Platform uptime" },
    { value: "<400ms", label: "Median latency" },
  ];

  function handleSearch(event) {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    navigate(trimmed ? `/explore?q=${encodeURIComponent(trimmed)}` : "/explore");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080C0E]">
      {/* Subtle Background Grid and Ambient Glows */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_10%,black_30%,transparent_80%)]" />
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[#00FF9D]/[0.06] blur-[140px]" />
      <div className="pointer-events-none absolute top-1/2 -right-40 h-[350px] w-[500px] rounded-full bg-[#10B981]/[0.04] blur-[150px]" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-24 pb-16 text-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-[#00FF9D] shadow-[0_0_15px_rgba(0,255,157,0.15)] transition-transform hover:scale-105">
          <span className="h-2 w-2 rounded-full bg-[#00FF9D] shadow-[0_0_8px_#00FF9D] animate-pulse" />
          ENTERPRISE AI MARKETPLACE
        </div>

        {/* Hero Title */}
        <h1 className="mx-auto mt-8 max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-[1.15]">
          Deploy and <span className="text-[#00FF9D]">scale</span>{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-[#00FF9D] via-emerald-300 to-teal-200">
            foundation models
          </span>{" "}
          with enterprise speed
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
          Describe your engineering workload. Highrise benchmarks vetted foundation
          models — compare latency, compliance, and transparent token pricing in one unified control plane.
        </p>

        {/* High-tech Search Bar */}
        <form
          onSubmit={handleSearch}
          className="group mx-auto mt-10 flex max-w-2xl items-center gap-2 rounded-full border border-white/[0.1] bg-[#0E141B]/90 p-2 shadow-[0_0_40px_-10px_rgba(0,255,157,0.12)] backdrop-blur-xl transition-all duration-300 focus-within:border-[#00FF9D]/50 focus-within:shadow-[0_0_50px_-10px_rgba(0,255,157,0.25)]"
        >
          <div className="pl-3 text-slate-500">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Describe your workload — e.g. code generation, contract analysis, reasoning"
            aria-label="Search models"
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-[#00FF9D] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all duration-200 hover:bg-[#10B981] hover:shadow-[0_0_28px_rgba(0,255,157,0.5)] active:scale-95"
          >
            Find models
          </button>
        </form>

        {/* Quick Filter Tags */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">POPULAR:</span>
          {QUICK_TAGS.map((tag) => (
            <Link
              key={tag}
              to={`/explore?q=${encodeURIComponent(tag)}`}
              className="rounded-full border border-white/[0.08] bg-[#0E141B]/70 px-3.5 py-1 text-slate-400 transition-all duration-200 hover:border-[#00FF9D]/40 hover:bg-[#131B24] hover:text-[#00FF9D]"
            >
              {tag}
            </Link>
          ))}
        </div>

        {/* Stats Grid */}
        <dl className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.05] shadow-2xl sm:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="flex flex-col bg-[#0E141B]/95 px-6 py-6 text-left transition-colors hover:bg-[#131B24]">
              <dd className="font-mono text-3xl font-bold tracking-tight text-white">{value}</dd>
              <dt className="mt-1 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                {label}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Unique Technical Architecture Pipeline Section (Deep Dark & High-Tech) */}
      <section className="relative mx-auto max-w-7xl px-6 py-14">
        <div className="text-center">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-[#00FF9D]">
            INFRASTRUCTURE TOPOLOGY
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Deterministic inference at <span className="text-[#00FF9D]">silicon scale</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-xs text-slate-400 sm:text-sm">
            Explore how Highrise orchestrates requests across multi-tenant hardware clusters.
          </p>
        </div>

        {/* Interactive Pipeline Node Controller */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E141B]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Top Node Track Selector */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PIPELINE_NODES.map((node, index) => {
              const active = activeNode === index;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setActiveNode(index)}
                  className={`group relative flex items-center justify-between rounded-xl border p-4 text-left transition-all duration-300 ${
                    active
                      ? "border-[#00FF9D]/60 bg-[#00FF9D]/[0.06] shadow-[0_0_24px_-6px_rgba(0,255,157,0.25)] ring-1 ring-[#00FF9D]/30"
                      : "border-white/[0.07] bg-[#080C0E]/70 hover:border-white/20 hover:bg-[#131B24]"
                  }`}
                >
                  <div>
                    <span className="font-mono text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                      {node.tag}
                    </span>
                    <h3 className={`mt-1 font-mono text-xs font-bold transition-colors ${active ? "text-[#00FF9D]" : "text-slate-300 group-hover:text-white"}`}>
                      {node.label}
                    </h3>
                  </div>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold transition-all ${
                      active
                        ? "border-[#00FF9D] bg-[#00FF9D] text-[#080C0E] shadow-[0_0_8px_#00FF9D]"
                        : "border-white/20 bg-transparent text-slate-500"
                    }`}
                  >
                    →
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Node Detail Display */}
          <div className="mt-6 rounded-xl border border-white/[0.06] bg-[#080C0E]/90 p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-bold text-[#00FF9D] uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9D]" />
                  {PIPELINE_NODES[activeNode].tag} ACTIVE
                </span>
                <h3 className="mt-4 text-xl font-bold tracking-tight text-white sm:text-2xl">
                  {PIPELINE_NODES[activeNode].title}
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-slate-400 sm:text-sm">
                  {PIPELINE_NODES[activeNode].desc}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <Link
                    to="/explore"
                    className="inline-flex items-center gap-2 rounded-full bg-[#00FF9D] px-5 py-2 text-xs font-bold text-[#080C0E] shadow-[0_0_15px_rgba(0,255,157,0.3)] transition-all hover:bg-[#10B981]"
                  >
                    Deploy models on this stack →
                  </Link>
                </div>
              </div>

              {/* Live Metric Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 lg:w-72 shrink-0">
                {PIPELINE_NODES[activeNode].metrics.map((m) => (
                  <div key={m.k} className="rounded-xl border border-white/[0.06] bg-[#0E141B] p-4 shadow-sm">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{m.k}</span>
                    <p className="mt-1 font-mono text-sm font-bold text-[#00FF9D]">{m.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Models Section */}
      <section className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-[#00FF9D]">
              LIVE REGISTRY
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Trending <span className="text-[#00FF9D]">models</span>
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Open-weights models with high developer momentum, live from Hugging Face.
            </p>
          </div>
          <Link
            to="/explore"
            className="group flex items-center gap-1 font-mono text-xs font-semibold text-[#00FF9D] transition-colors hover:text-emerald-300"
          >
            VIEW ALL MODELS
            <span className="transition-transform group-hover:translate-x-1">→</span>
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
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#0E141B]/50 p-12 text-center">
            <p className="text-sm font-medium text-slate-300">
              Couldn&apos;t reach the Hugging Face Hub right now.
            </p>
            <Link
              to="/explore"
              className="mt-3 inline-block font-mono text-xs font-medium text-[#00FF9D] hover:underline"
            >
              Browse local registry →
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

      {/* Value Props / Pillars Section (ZeBeyond 3-card layout) */}
      <section className="relative mx-auto max-w-7xl px-6 pt-6 pb-28">
        <div className="text-center mb-10">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-[#00FF9D]">
            ENGINEERING VALUE
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Built for infrastructure and ML platform teams
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {VALUE_PROPS.map(({ step, title, body, icon }) => (
            <article
              key={step}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E141B]/90 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#00FF9D]/40 hover:bg-[#131B24] hover:shadow-[0_12px_36px_-8px_rgba(0,255,157,0.15)]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-[#080C0E] shadow-inner group-hover:border-[#00FF9D]/30 transition-colors">
                    {icon}
                  </div>
                  <span className="font-mono text-xs font-bold tracking-widest text-[#00FF9D]/80">
                    {step}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-bold text-white transition-colors group-hover:text-[#00FF9D]">
                  {title}
                </h3>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-400">
                  {body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
