import { Link } from "react-router-dom";
import { isRequestPriced, priceLabel } from "../utils/costCalculator.js";

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
});

const CATEGORY_BADGES = {
  LLM: "border-emerald-500/30 bg-emerald-500/10 text-[#00FF9D]",
  "Code Generation": "border-teal-500/30 bg-teal-500/10 text-teal-300",
  Embeddings: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  Vision: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  OCR: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  "Audio Transcription": "border-amber-500/30 bg-amber-500/10 text-amber-300",
  "Image Generation": "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300",
  "Safety & Moderation": "border-rose-500/30 bg-rose-500/10 text-rose-300",
  Translation: "border-sky-500/30 bg-sky-500/10 text-sky-300",
};

export default function ModelCard({ model }) {
  const badge =
    CATEGORY_BADGES[model.category] ??
    "border-white/10 bg-white/5 text-slate-300";
  const isFree = !isRequestPriced(model) && model.pricingPer1kTokens === 0;

  return (
    <Link
      to={`/models/${encodeURIComponent(model.id)}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E141B]/95 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#00FF9D]/40 hover:bg-[#131B24] hover:shadow-[0_12px_36px_-8px_rgba(0,255,157,0.18)]"
    >
      {/* Top subtle highlight gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00FF9D]/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div>
        <div className="mb-4 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${badge}`}
          >
            <span className="h-1 w-1 rounded-full bg-current" />
            {model.category}
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#00FF9D]">
            {model.benchmarkScore != null ? (
              <>
                <span className="text-[10px] uppercase text-slate-500 font-sans">SCORE</span>
                {model.benchmarkScore}
              </>
            ) : (
              `${compactFormatter.format(model.likes)} likes`
            )}
          </span>
        </div>

        <h3 className="text-lg font-bold tracking-tight text-white transition-colors group-hover:text-[#00FF9D]">
          {model.name}
        </h3>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-slate-500">
          {model.provider}
        </p>

        <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-400">
          {model.description}
        </p>
      </div>

      <div className="mt-6 pt-4">
        <div className="flex items-center justify-between border-t border-white/[0.07] pt-3.5 font-mono text-xs text-slate-400">
          {isFree ? (
            <span className="font-semibold text-[#00FF9D]">
              FREE · OPEN WEIGHTS
            </span>
          ) : (
            <span className="text-slate-300">
              FROM <span className="font-semibold text-white">{priceLabel(model)}</span>
            </span>
          )}
          <span className="text-slate-400">
            {model.latencyMs != null
              ? `${model.latencyMs} ms`
              : `${compactFormatter.format(model.downloads)} dl`}
          </span>
        </div>
      </div>
    </Link>
  );
}
