import { useEffect, useRef, useState } from "react";
import { signIn } from "../utils/auth.js";

export default function AuthModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current?.focus();
    function handleKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const emailValid = /.+@.+\..+/.test(email);
  const nameValid = name.trim().length > 1;
  const formValid = emailValid && nameValid;

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (!formValid) return;
    signIn({ email, name });
    onClose();
  }

  const fieldClass = (valid) =>
    `w-full rounded-xl border bg-[#080C0E] px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-[#00FF9D]/50 focus:shadow-[0_0_20px_-4px_rgba(0,255,157,0.3)] ${
      submitted && !valid ? "border-rose-500/60" : "border-white/[0.1]"
    }`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign in to Highrise"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0E141B]/95 p-8 shadow-2xl backdrop-blur-xl animate-modal-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-[#00FF9D]/[0.08] blur-[80px]" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close sign in dialog"
          className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:border-white/30 hover:text-white active:scale-90 cursor-pointer"
        >
          ✕
        </button>

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#00FF9D]">
            WORKSPACE ACCESS
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white">
            Sign in to get your API key
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            Create a workspace, deploy models, and manage keys — all in one place.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label
                htmlFor="auth-email"
                className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400"
              >
                Work email address
              </label>
              <input
                ref={emailRef}
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="eng-lead@enterprise.com"
                autoComplete="email"
                className={fieldClass(emailValid)}
              />
              {submitted && !emailValid && (
                <p className="mt-1.5 font-mono text-[10px] text-rose-400">
                  Enter a valid email address
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="auth-name"
                className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400"
              >
                Full name
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ada Lovelace"
                autoComplete="name"
                className={fieldClass(nameValid)}
              />
              {submitted && !nameValid && (
                <p className="mt-1.5 font-mono text-[10px] text-rose-400">
                  Enter your full name
                </p>
              )}
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#00FF9D] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all hover:bg-[#10B981] hover:shadow-[0_0_28px_rgba(0,255,157,0.5)] active:scale-[0.98] cursor-pointer"
            >
              Create workspace →
            </button>
            <p className="text-center font-mono text-[10px] text-slate-500">
              DEMO AUTHENTICATION · DATA STAYS IN YOUR BROWSER ONLY
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
