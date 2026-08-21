import { Link } from "react-router-dom";
import { isRequestPriced, priceLabel } from "../utils/costCalculator.js";

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
});

const CATEGORY_BADGES = {
  LLM: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  "Code Generation": "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  Embeddings: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  Vision: "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-300",
  OCR: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  "Audio Transcription": "border-amber-400/30 bg-amber-400/10 text-amber-300",
  "Image Generation": "border-rose-400/30 bg-rose-400/10 text-rose-300",
  "Safety & Moderation": "border-red-400/30 bg-red-400/10 text-red-300",
  Translation: "border-indigo-400/30 bg-indigo-400/10 text-indigo-300",
};

export default function ModelCard({ model }) {
  const badge =
    CATEGORY_BADGES[model.category] ??
    "border-white/10 bg-white/5 text-slate-300";
  const isFree = !isRequestPriced(model) && model.pricingPer1kTokens === 0;

  return (
    <Link
      to={`/models/${encodeURIComponent(model.id)}`}
      className="group flex flex-col rounded-2xl border border-white/5 bg-slate-900/60 p-6 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-400/40 hover:shadow-[0_0_36px_-10px_rgba(34,211,238,0.35)]"
    >
      <div className="mb-4 flex items-center justify-between">
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badge}`}
        >
          {model.category}
        </span>
        <span className="text-xs font-medium text-emerald-300">
          {model.benchmarkScore != null
            ? `${model.benchmarkScore} benchmark`
            : `${compactFormatter.format(model.likes)} likes`}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-cyan-300">
        {model.name}
      </h3>
      <p className="mt-0.5 text-xs uppercase tracking-wider text-slate-500">
        {model.provider}
      </p>

      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-400">
        {model.description}
      </p>

      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs text-slate-500">
          {isFree ? (
            <span className="font-semibold text-slate-300">
              Free · open weights
            </span>
          ) : (
            <span>
              From{" "}
              <span className="font-semibold text-slate-300">
                {priceLabel(model)}
              </span>
            </span>
          )}
          <span>
            {model.latencyMs != null
              ? `${model.latencyMs} ms`
              : `${compactFormatter.format(model.downloads)} downloads`}
          </span>
        </div>
      </div>
      </Link>
    );
}
