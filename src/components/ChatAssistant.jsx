import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MODELS } from "../data/modelsRegistry.js";
import { findMatches } from "../utils/matchmakerAlgo.js";
import { formatUSD, priceLabel } from "../utils/costCalculator.js";
import {
  isSmallTalk,
  mergeIntents,
  normalizeIntent,
  parseIntentLocally,
} from "../utils/chatIntent.js";

const QUICK_REPLIES = [
  "I need cheap OCR for invoices under $0.01",
  "Best LLM under $0.005 for accuracy",
  "Fastest audio transcription model",
  "Accurate code generation assistant",
];

const HELP_TEXT =
  "I'm your model advisor — I match what you're building to our model registry.\n\nTell me:\n• the use case (OCR, chatbot, transcription…)\n• a budget (e.g. \"under $0.005\")\n• whether speed or accuracy matters more\n\nThen refine with things like \"something cheaper\" or \"faster options\".";

function describeIntent(intent) {
  return [
    intent.category ? `category ${intent.category}` : null,
    intent.maxBudget != null ? `budget ≤ ${formatUSD(intent.maxBudget)}` : null,
    `${intent.priority} priority`,
  ]
    .filter(Boolean)
    .join(" · ");
}

async function resolveIntent(message, history) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    });
    if (!response.ok) throw new Error("intent service unavailable");
    const data = await response.json();
    return {
      intent: normalizeIntent(data.intent),
      note: typeof data.note === "string" ? data.note : "",
    };
  } catch {
    return { intent: parseIntentLocally(message), note: "" };
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

function ModelCard({ model, best }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#080C0E] px-3 py-2 transition hover:border-[#00FF9D]/30">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-slate-100">
          {best && <span className="text-[#00FF9D]">★ </span>}
          {model.name}
          <span className="font-normal text-slate-500"> · {model.provider}</span>
        </p>
        <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wide text-slate-400">
          {priceLabel(model)} · {model.latencyMs}ms · score{" "}
          <span className="text-[#00FF9D]/80">{model.benchmarkScore}</span>
        </p>
      </div>
      <Link
        to={`/models/${encodeURIComponent(model.id)}`}
        onClick={() => window.dispatchEvent(new CustomEvent("close-chat-assistant"))}
        className="shrink-0 rounded-lg border border-[#00FF9D]/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[#00FF9D] transition-all hover:bg-[#00FF9D]/10 active:scale-95"
      >
        View
      </Link>
    </div>
  );
}

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const lastIntentRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, busy, open]);

  useEffect(() => {
    function closePanel() {
      setOpen(false);
    }
    window.addEventListener("close-chat-assistant", closePanel);
    return () => window.removeEventListener("close-chat-assistant", closePanel);
  }, []);

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
    setMessages((current) => [...current, { role: "user", text }]);
    setBusy(true);

    const history = messages
      .filter((m) => (m.role === "user" ? m.text : m.intro))
      .slice(-4)
      .map((m) => ({
        role: m.role,
        content: (m.role === "user" ? m.text : m.intro).slice(0, 200),
      }));

    try {
      if (isSmallTalk(text) && !lastIntentRef.current) {
        setMessages((current) => [
          ...current,
          { role: "assistant", intro: HELP_TEXT },
        ]);
        return;
      }

      const { intent: rawIntent, note } = await resolveIntent(text, history);
      const intent = lastIntentRef.current
        ? mergeIntents(lastIntentRef.current, rawIntent, text)
        : rawIntent;
      lastIntentRef.current = intent;

      const matches = findMatches(intent, MODELS);

      if (matches.length === 0) {
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            intro:
              "Nothing fits those limits yet — try raising your budget or dropping a constraint.",
          },
        ]);
        return;
      }

      const intro = note
        ? `${note} Showing the best ${describeIntent(intent)}.`
        : `Understood — ${describeIntent(intent)}. Top picks:`;

      setMessages((current) => [
        ...current,
        { role: "assistant", intro, matches, intent },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function followUp(label, intent, matches) {
    if (label === "__compare__") {
      setOpen(false);
      navigate("/compare", {
        state: { models: matches.slice(0, 3).map((entry) => entry.model.id) },
      });
      return;
    }
    sendMessage(label);
  }

  function renderChips(message, index) {
    if (message.role !== "assistant") return null;
    const isLast = index === messages.length - 1;
    const chips = ["Something cheaper", "Faster options", "More accuracy"];
    return (
      <div className={`flex flex-wrap gap-1.5 ${isLast ? "" : "hidden"} mt-2`}>
        {message.matches?.length >= 2 && (
          <button
            type="button"
            onClick={() => followUp("__compare__", message.intent, message.matches)}
            className="rounded-full bg-[#00FF9D]/15 px-2.5 py-1 text-[11px] font-medium text-[#00FF9D] transition-all hover:bg-[#00FF9D]/25 active:scale-[0.98] cursor-pointer"
          >
            Compare these picks →
          </button>
        )}
        {isLast &&
          chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => followUp(chip, message.intent)}
              className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-400 transition-all hover:border-[#00FF9D]/40 hover:text-[#00FF9D] active:scale-[0.98] cursor-pointer"
            >
              {chip}
            </button>
          ))}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Highrise model advisor"
        className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-[#00FF9D] text-[#080C0E] shadow-[0_8px_30px_rgba(0,255,157,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,255,157,0.5)] active:scale-[0.95] cursor-pointer"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex h-[min(74vh,560px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0E141B]/95 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur animate-chat-panel">
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
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200 active:scale-90 cursor-pointer"
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
          <div key={index}>
            <div
              className={
                message.role === "user"
                  ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#00FF9D]/90 px-3 py-2 text-sm text-[#080C0E]"
                  : "mr-auto max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-white/10 bg-[#131B24] px-3 py-2 text-sm leading-relaxed text-slate-200"
              }
            >
              {message.role === "user" ? message.text : message.intro}
            </div>

            {message.matches?.map((entry, cardIndex) => (
              <div key={entry.model.id} className="mt-1.5 mr-auto max-w-[92%]">
                <ModelCard model={entry.model} best={cardIndex === 0} />
              </div>
            ))}

            {renderChips(message, index)}
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
              className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-400 transition-all hover:border-[#00FF9D]/40 hover:text-[#00FF9D] active:scale-[0.98] cursor-pointer"
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
          className="shrink-0 rounded-xl bg-[#00FF9D] p-2 text-[#080C0E] transition-all disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:brightness-110 enabled:active:scale-95 cursor-pointer"
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
