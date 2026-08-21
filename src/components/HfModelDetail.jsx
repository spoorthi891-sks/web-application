import { Link } from "react-router-dom";
import { formatCompact } from "../utils/hfHub.js";
import { priceLabel } from "../utils/costCalculator.js";
import PricingSection from "./PricingSection.jsx";
import CodeGenerator from "./CodeGenerator.jsx";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function HfModelDetail({ model }) {
  const specs = [
    { label: "Pipeline", value: model.pipeline },
    { label: "Library", value: model.libraryName ?? "—" },
    { label: "License", value: model.privacyRating.split("·")[0].trim() },
    { label: "Monthly downloads", value: formatCompact(model.downloads) },
    { label: "Community likes", value: formatCompact(model.likes), accent: true },
    { label: "Pricing", value: priceLabel(model) },
  ];

  const versions = [
    ...(model.createdAt
      ? [
          {
            date: model.createdAt,
            title: "Repository created",
            body: `Initial public release of ${model.name} on the Hugging Face Hub.`,
          },
        ]
      : []),
    ...(model.lastModified
      ? [
          {
            date: model.lastModified,
            title: "Latest revision published",
            body: `Most recent commit to the repository${
              model.filesCount ? ` · ${model.filesCount} files tracked` : ""
            }.`,
          },
        ]
      : []),
    ...(model.baseModels.length > 0
      ? [
          {
            date: null,
            title: "Derived from base checkpoint",
            body: `Fine-tuned or quantized from ${model.baseModels.join(", ")}.`,
          },
        ]
      : []),
    {
      date: null,
      title: model.gated ? "Gated access" : "Open access",
      body: model.gated
        ? "The author requires accepting terms before downloading the weights."
        : "Weights are freely downloadable under the repository license.",
    },
  ].sort((a, b) => (b.date ? Date.parse(b.date) : 0) - (a.date ? Date.parse(a.date) : 0));

  const docs = [
    `${model.name} is an open-weights ${model.pipeline} model published by ${model.provider} on the Hugging Face Hub.`,
    model.libraryName === "llama.cpp" || (model.tags ?? []).includes("gguf")
      ? "This repository ships GGUF quantized weights for CPU/GPU inference with llama.cpp-compatible runtimes."
      : `It runs with the \`${model.libraryName}\` library and exposes a standard ${model.pipeline} pipeline interface.`,
    model.baseModels.length > 0
      ? `Lineage: derived from ${model.baseModels.join(", ")}. Check the license before commercial use.`
      : `Released under the ${model.privacyRating.split("·")[0].trim()} license — review the license terms before production use.`,
    "On Highrise you can deploy this model as a managed endpoint: pick a plan below, check out, and invoke it through the unified Highrise API without managing GPUs yourself.",
  ];

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
              by <span className="text-slate-300 font-semibold">{model.provider}</span> · LIVE FROM HUGGING FACE HUB
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
            <a
              href={model.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/[0.1] bg-[#0E141B]/90 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-200 transition-all hover:border-[#00FF9D]/40 hover:text-[#00FF9D]"
            >
              View on Hugging Face ↗
            </a>
            <Link
              to={`/sandbox?model=${encodeURIComponent(model.id)}`}
              className="rounded-full bg-[#00FF9D] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all hover:bg-[#10B981] hover:shadow-[0_0_28px_rgba(0,255,157,0.5)] active:scale-95 cursor-pointer"
            >
              Open in Sandbox
            </Link>
          </div>
        </header>

        {/* Specs grid */}
        <dl className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
          {specs.map(({ label, value, accent }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/[0.08] bg-[#0E141B]/95 p-4 backdrop-blur-md shadow-md transition-colors hover:bg-[#131B24]"
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

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-2xl border border-white/[0.08] bg-[#0E141B]/95 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-white/[0.07] pb-3">
              <span className="h-2 w-2 rounded-full bg-[#00FF9D]" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-white">Documentation &amp; Usage</h2>
            </div>
            <div className="mt-4 space-y-3 text-xs sm:text-sm leading-relaxed text-slate-300">
              {docs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <p className="mt-6 border-t border-white/[0.07] pt-4 font-mono text-xs text-slate-500">
              Full model card, eval results and usage examples live on the{" "}
              <a
                href={model.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[#00FF9D] transition-colors hover:underline"
              >
                Hugging Face repository ↗
              </a>
            </p>
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-[#0E141B]/95 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-white/[0.07] pb-3">
              <span className="h-2 w-2 rounded-full bg-[#00FF9D]" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-white">Version History</h2>
            </div>
            <ol className="mt-5 space-y-6">
              {versions.map(({ date, title, body }, index) => (
                <li key={title} className="relative pl-6">
                  {index < versions.length - 1 && (
                    <span className="absolute left-[7px] top-4 h-full w-px bg-white/10" />
                  )}
                  <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-[#00FF9D] bg-[#080C0E] shadow-[0_0_8px_rgba(0,255,157,0.5)]" />
                  <h3 className="text-xs font-bold text-white">{title}</h3>
                  <p className="mt-0.5 text-[11px] text-slate-400 leading-relaxed">{body}</p>
                  <p className="mt-1 font-mono text-[10px] font-semibold text-[#00FF9D]">
                    {date ? formatDate(date) : "CURRENT RELEASE"}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <PricingSection model={model} />

        <div className="mt-10">
          <CodeGenerator model={model} />
        </div>
      </div>
    </div>
  );
}
