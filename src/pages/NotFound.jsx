import { Link, useLocation } from "react-router-dom";

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080C0E]">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[#00FF9D]/[0.05] blur-[140px]" />

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-semibold tracking-widest text-[#00FF9D] uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
          ERROR 404 · ROUTE NOT PROVISIONED
        </div>

        <p
          aria-hidden="true"
          className="mt-8 select-none font-mono text-[7rem] font-black leading-none tracking-tighter text-transparent sm:text-[10rem] [-webkit-text-stroke:2px_rgba(0,255,157,0.35)]"
        >
          404
        </p>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          This route isn&apos;t in the{" "}
          <span className="text-[#00FF9D]">registry</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          No model, page, or endpoint is provisioned at{" "}
          <code className="rounded-md border border-white/[0.08] bg-[#0E141B] px-1.5 py-0.5 font-mono text-xs text-[#00FF9D]/80 break-all">
            {location.pathname}
          </code>
          .
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="rounded-full bg-[#00FF9D] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all hover:bg-[#10B981] hover:shadow-[0_0_28px_rgba(0,255,157,0.5)] active:scale-[0.98]"
          >
            Back to home
          </Link>
          <Link
            to="/explore"
            className="rounded-full border border-white/10 bg-[#0E141B] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-200 transition hover:border-[#00FF9D]/40 hover:text-[#00FF9D] active:scale-[0.98]"
          >
            Explore models
          </Link>
        </div>

        <p className="mt-12 font-mono text-[10px] uppercase tracking-widest text-slate-600">
          STATUS · 404 · SLA UNAFFECTED
        </p>
      </div>
    </div>
  );
}
