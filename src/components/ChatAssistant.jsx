import { useEffect, useRef, useState } from "react";
import { MODELS } from "../data/modelsRegistry.js";
import { findMatches } from "../utils/matchmakerAlgo.js";
import { formatUSD, priceLabel } from "../utils/costCalculator.js";
import { normalizeIntent, parseIntentLocally } from "../utils/chatIntent.js";

const QUICK_REPLIES = [
  "I need cheap OCR for invoices under $0.01",
  "Best LLM under $0.005 for accuracy",
  "Fastest audio transcription model",
  "Accurate code generation assistant",
];

function buildReply(intent) {
  const matches = findMatches(intent, MODELS);

  if (matches.length === 0) {
    return (
      "Nothing in our registry fits those limits yet. Try raising the " +
      "budget or dropping a constraint and I will match models again."
    );
  }

  const understood = [
    intent.category ? `category ${intent.category}` : null,
    intent.maxBudget != null ? `budget ≤ ${formatUSD(intent.maxBudget)}` : null,
    `${intent.priority} priority`,
  ]
    .filter(Boolean)
    .join(" · ");

  const ranked = matches
    .slice(0, 3)
    .map((entry, index) => {
      const model = entry.model;
      return (
        `${index + 1}. ${model.name} by ${model.provider}\n` +
        `   ${priceLabel(model)} · ${model.latencyMs} ms latency · ` +
        `benchmark score ${model.benchmarkScore}`
      );
    })
    .join("\n");

  return (
    `Understood — ${understood}.\n\n${ranked}\n\n` +
    `Open a model page for full specs, or send these to Compare for a ` +
    `side-by-side table.`
  );
}

async function resolveIntent(message) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) throw new Error("intent service unavailable");
    const data = await response.json();
    return normalizeIntent(data.intent);
  } catch {
    return parseIntentLocally(message);
  }
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      <span className="size-2 animate-pulse rounded-full bg-[#00FF9D]" />
      <span className="size-2 animate-pulse rounded-full bg-[#00FF9D]/70 [animation-delay:150ms]" />
      <span className="size-2 animate-pulse rounded-full bg-[#00FF9D]/40 [animation-delay:300ms]" />
      <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">
        Matching models
      </span>
    </div>
  );
}

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, busy, open]);

  useEffect(() => {
    if (!open) return undefined;
    function handleKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  async function sendMessage(rawText) {
    const text = String(rawText ?? "").trim();
    if (!text || busy) return;

    setInput("");
    setMessages((current) => [...current, { role: "user", content: text }]);
    setBusy(true);

    try {
      const intent = await resolveIntent(text);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: buildReply(intent) },
      ]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Highrise model advisor"
        className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-[#00FF9D] text-[#080C0E] shadow-[0_8px_30px_rgba(0,255,157,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,255,157,0.5)]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex h-[min(70vh,520px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0E141B]/95 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
            Highrise Assistant
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-300">
            <span className="size-1.5 rounded-full bg-[#00FF9D]" />
            Model advisor online
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close assistant"
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <p className="mx-auto max-w-[85%] rounded-xl border border-white/5 bg-[#131B24] px-3 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-slate-500">
          Tell me your use case · budget · speed vs accuracy
        </p>

        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#00FF9D]/90 px-3 py-2 text-sm text-[#080C0E]"
                : "mr-auto max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-white/10 bg-[#131B24] px-3 py-2 text-sm leading-relaxed text-slate-200"
            }
          >
            {message.content}
          </div>
        ))}

        {busy && <TypingIndicator />}
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => sendMessage(reply)}
              className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-400 transition hover:border-[#00FF9D]/40 hover:text-[#00FF9D]"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(input);
        }}
        className="flex items-center gap-2 border-t border-white/10 p-3"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Describe what you need…"
          aria-label="Message the model advisor"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#080C0E] px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-[#00FF9D]/40"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send message"
          className="shrink-0 rounded-xl bg-[#00FF9D] p-2 text-[#080C0E] transition disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:brightness-110"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </button>
      </form>
    </div>
  );
}
