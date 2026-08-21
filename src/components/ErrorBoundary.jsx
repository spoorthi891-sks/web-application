import { Component } from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Highrise runtime fault:", error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (
      this.state.error &&
      this.props.location?.pathname !== prevProps.location?.pathname
    ) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    return (
      <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-[#080C0E] px-6">
        <div className="pointer-events-none absolute top-10 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-rose-500/[0.05] blur-[140px]" />

        <div className="relative max-w-lg text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 font-mono text-[10px] font-semibold tracking-widest uppercase text-rose-300">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
            RUNTIME FAULT ISOLATED
          </div>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            This view hit a{" "}
            <span className="text-rose-400"> snag</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            The rest of Highrise is still operational — your session and keys are
            untouched. Recover below or head back to the marketplace.
          </p>

          <pre className="mt-6 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#0E141B]/90 p-4 text-left font-mono text-[11px] leading-relaxed text-rose-300/80">
            {error.message || String(error)}
          </pre>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="rounded-full bg-[#00FF9D] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all hover:bg-[#10B981]"
            >
              Back to marketplace
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full border border-white/10 bg-[#0E141B] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-200 transition hover:border-[#00FF9D]/40 hover:text-[#00FF9D] cursor-pointer"
            >
              Reload view
            </button>
          </div>
        </div>
      </div>
    );
  }
}
