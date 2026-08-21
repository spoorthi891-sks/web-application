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
    { label: "Community likes", value: formatCompact(model.likes) },
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
            by {model.provider} · live from the Hugging Face Hub
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
          <a
            href={model.externalUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-300"
          >
            View on Hugging Face ↗
          </a>
          <Link
            to="/sandbox"
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-300"
          >
            Open in Sandbox
          </Link>
        </div>
      </header>

      <dl className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {specs.map(({ label, value }) => (
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

      <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-white/5 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-white">Documentation</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-400">
            {docs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          <p className="mt-5 border-t border-white/5 pt-4 text-xs text-slate-500">
            Full model card, eval results and usage examples live on the{" "}
            <a
              href={model.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-300 transition-colors hover:text-cyan-200"
            >
              Hugging Face repository ↗
            </a>
          </p>
        </section>

        <section className="rounded-2xl border border-white/5 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-white">Versions</h2>
          <ol className="mt-5 space-y-6">
            {versions.map(({ date, title, body }, index) => (
              <li key={title} className="relative pl-6">
                {index < versions.length - 1 && (
                  <span className="absolute left-[7px] top-4 h-full w-px bg-white/10" />
                )}
                <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-cyan-400/70 bg-slate-950" />
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="mt-0.5 text-xs text-slate-500">{body}</p>
                <p className="mt-1 text-xs font-medium text-cyan-300">
                  {date ? formatDate(date) : "Current"}
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
  );
}
