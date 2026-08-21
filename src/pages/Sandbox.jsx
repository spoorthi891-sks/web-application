import { useEffect, useMemo, useRef, useState } from "react";
import { MODELS } from "../data/modelsRegistry.js";
import {
  estimateCost,
  formatUSD,
  isRequestPriced,
} from "../utils/costCalculator.js";

const CHUNK_INTERVAL_MS = 14;
const CHUNK_SIZE = 10;

function buildMockResponse(model, prompt, ttfbMs) {
  const inputTokens = Math.max(1, Math.ceil(prompt.trim().length / 4));
  const created = Math.floor(Date.now() / 1000);
  const requestId = `${model.id}-${Math.random().toString(16).slice(2, 8)}`;

  const payloads = {
    LLM: () => ({
      summary:
        "The agreement renews automatically for successive 12-month terms unless cancelled 60 days in advance. Liability is capped at fees paid in the preceding 12 months, and either party may terminate for material breach after a 30-day cure period.",
      clauses_flagged: [
        {
          type: "auto-renewal",
          severity: "medium",
          excerpt: "renews automatically for successive 12-month terms",
        },
        {
          type: "liability-cap",
          severity: "low",
          excerpt: "capped at fees paid in the preceding 12 months",
        },
      ],
      confidence: 0.94,
    }),
    "Code Generation": () => ({
      language: "python",
      framework: "pytest",
      code: 'def test_expired_token_rejects_request():\n    token = make_token(expired=True)\n    response = client.get("/api/secure", headers={"Authorization": f"Bearer {token}"})\n    assert response.status_code == 401\n    assert response.json()["detail"] == "token_expired"',
      explanation:
        "Verifies that expired bearer tokens are rejected with HTTP 401.",
    }),
    Embeddings: () => ({
      dimensions: 1536,
      normalized: true,
      vector_preview: [0.0213, -0.1187, 0.441, 0.0934, -0.2765, 0.1502],
      nearest_neighbours: [
        { doc_id: "DOC-8841", cosine_similarity: 0.94 },
        { doc_id: "DOC-1207", cosine_similarity: 0.91 },
        { doc_id: "DOC-3325", cosine_similarity: 0.88 },
      ],
    }),
    Vision: () => ({
      document_type: "invoice",
      fields: {
        vendor: "Nimbus Supplies Ltd.",
        invoice_total: "$4,812.00",
        due_date: "2026-09-18",
      },
      line_items_detected: 14,
      average_field_confidence: 0.97,
    }),
    OCR: () => ({
      pages_processed: 3,
      handwriting_detected: false,
      fields: {
        invoice_number: "INV-48213",
        vendor: "Cortical Systems",
        total: "$1,284.50",
        currency: "USD",
      },
    }),
    "Audio Transcription": () => ({
      duration_seconds: 19.4,
      speakers_detected: 2,
      segments: [
        {
          start: 2.0,
          speaker: "agent",
          text: "Thank you for calling Highrise support.",
        },
        {
          start: 5.1,
          speaker: "caller",
          text: "Hi, I need help rotating an API key.",
        },
        {
          start: 11.3,
          speaker: "agent",
          text: "Absolutely, I can generate a new key for you now.",
        },
      ],
    }),
    "Image Generation": () => ({
      width: 2048,
      height: 2048,
      diffusion_steps: 41,
      prompt_adherence: 0.92,
      style_lock: "brand-neon",
      seed: 88421397,
      variations_endpoint: "/v1/images/variations",
    }),
    "Safety & Moderation": () => ({
      recommended_action: "allow_with_redaction",
      critical_flags: [],
      pii_entities_redacted: ["EMAIL", "PHONE_NUMBER"],
      prompt_injection_risk: 0.03,
      toxicity_score: 0.01,
    }),
    Translation: () => ({
      source_language: "en",
      target_language: "de",
      translation: "Der Bericht muss bis Freitag eingereicht werden.",
      formality: "formal",
      quality_estimate: 0.982,
    }),
  };

  const output = payloads[model.category]
    ? payloads[model.category]()
    : {
        message:
          "Mock inference complete. Wire this panel to a real Highrise inference endpoint for live output.",
      };
  const outputTokens = Math.ceil(JSON.stringify(output).length / 4);

  return JSON.stringify(
    {
      id: requestId,
      object: "inference.response",
      created,
      model: model.id,
      provider: model.provider,
      output,
      usage: isRequestPriced(model)
        ? { requests: 1 }
        : { input_tokens: inputTokens, output_tokens: outputTokens },
      timing: { time_to_first_byte_ms: ttfbMs },
    },
    null,
    2,
  );
}

const STATUS_STYLES = {
  idle: "border-white/10 bg-white/5 text-slate-400",
  connecting: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  streaming: "border-[#00FF9D]/40 bg-[#00FF9D]/10 text-[#00FF9D]",
  done: "border-emerald-400/30 bg-emerald-400/10 text-[#00FF9D]",
};

const STATUS_LABELS = {
  idle: "Ready",
  connecting: "Connecting...",
  streaming: "Inferring...",
  done: "200 OK",
};

export default function Sandbox() {
  const [modelId, setModelId] = useState(MODELS[0].id);
  const [prompt, setPrompt] = useState("");
  const [run, setRun] = useState({
    status: "idle",
    output: "",
    ttfbMs: null,
    totalMs: null,
  });
  const [elapsedMs, setElapsedMs] = useState(0);
  const timersRef = useRef([]);
  const elapsedRef = useRef(0);

  const model = MODELS.find((m) => m.id === modelId);
  const isRunning = run.status === "connecting" || run.status === "streaming";

  const inputTokens = Math.ceil(prompt.trim().length / 4);
  const outputTokens = Math.ceil(run.output.length / 4);

  function clearTimers() {
    timersRef.current.forEach((timerId) => clearTimeout(timerId));
    timersRef.current = [];
  }

  function schedule(timerFn, delay) {
    const timerId = setTimeout(timerFn, delay);
    timersRef.current.push(timerId);
  }

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (!isRunning) return undefined;
    const startedAt = performance.now() - elapsedRef.current;
    const tick = setInterval(() => {
      elapsedRef.current = Math.round(performance.now() - startedAt);
      setElapsedMs(elapsedRef.current);
    }, 24);
    return () => clearInterval(tick);
  }, [isRunning]);

  useEffect(() => {
    clearTimers();
    elapsedRef.current = 0;
    setElapsedMs(0);
    setRun({ status: "idle", output: "", ttfbMs: null, totalMs: null });
  }, [modelId]);

  const estimatedCost = useMemo(
    () =>
      estimateCost(
        model,
        isRequestPriced(model) ? 1 : inputTokens + outputTokens,
      ),
    [model, inputTokens, outputTokens],
  );

  const tokensPerSec =
    run.status === "done" &&
    run.totalMs != null &&
    run.ttfbMs != null &&
    run.totalMs > run.ttfbMs
      ? Math.round(outputTokens / ((run.totalMs - run.ttfbMs) / 1000))
      : null;

  function handleRun(event) {
    event.preventDefault();
    if (isRunning) {
      clearTimers();
      setRun((current) => ({ ...current, status: "idle" }));
      return;
    }
    if (!prompt.trim()) return;

    const ttfb = Math.round(model.latencyMs * (0.9 + Math.random() * 0.3));
    const responseText = buildMockResponse(model, prompt, ttfb);
    const chunks = [];
    for (let i = 0; i < responseText.length; i += CHUNK_SIZE) {
      chunks.push(responseText.slice(i, i + CHUNK_SIZE));
    }

    elapsedRef.current = 0;
    setElapsedMs(0);
    setRun({ status: "connecting", output: "", ttfbMs: null, totalMs: null });

    schedule(() => {
      setRun((current) => ({
        ...current,
        status: "streaming",
        ttfbMs: ttfb,
      }));

      let index = 0;
      function emitChunk() {
        index += 1;
        const done = index >= chunks.length;
        setRun((current) => ({
          ...current,
          output: chunks.slice(0, index).join(""),
          status: done ? "done" : "streaming",
          totalMs: done ? elapsedRef.current : null,
        }));
        if (!done) schedule(emitChunk, CHUNK_INTERVAL_MS);
      }
      emitChunk();
    }, ttfb);
  }

  const latencyValue =
    run.status === "done" && run.totalMs != null
      ? `${run.totalMs} ms`
      : isRunning
        ? `${elapsedMs} ms`
        : "--";

  const metrics = [
    { label: "Latency", value: latencyValue },
    {
      label: "Time to first byte",
      value: run.ttfbMs != null ? `${run.ttfbMs} ms` : "--",
    },
    {
      label: "Output tokens",
      value: run.output ? String(outputTokens) : "--",
    },
    {
      label: "Throughput",
      value: tokensPerSec != null ? `${tokensPerSec} tok/s` : "--",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#080C0E]">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-10 right-1/4 h-[350px] w-[500px] rounded-full bg-[#00FF9D]/[0.04] blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-semibold tracking-widest text-[#00FF9D] uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
          INTERACTIVE TEST RUNTIME
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Inference <span className="text-[#00FF9D]">Sandbox</span>
        </h1>
        <p className="mt-1.5 text-xs text-slate-400 sm:text-sm">
          Prototype and benchmark request streaming against any registered model with simulated hardware latency.
        </p>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-2">
          <form
            onSubmit={handleRun}
            className="space-y-5 rounded-2xl border border-white/[0.08] bg-[#0E141B]/95 p-6 sm:p-8 shadow-xl backdrop-blur-md"
          >
            <div>
              <label
                htmlFor="sandbox-model"
                className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400"
              >
                Target Foundation Model
              </label>
              <select
                id="sandbox-model"
                value={modelId}
                onChange={(event) => setModelId(event.target.value)}
                className="w-full rounded-xl border border-white/[0.1] bg-[#080C0E] px-4 py-2.5 font-mono text-xs text-slate-100 outline-none transition focus:border-[#00FF9D]/50 focus:shadow-[0_0_20px_-4px_rgba(0,255,157,0.3)]"
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.provider} ({m.latencyMs} ms)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="sandbox-prompt"
                className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400"
              >
                Workload Prompt Input
              </label>
              <textarea
                id="sandbox-prompt"
                rows={8}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Summarize this technical specification and flag any auto-renewal clauses..."
                className="w-full resize-y rounded-xl border border-white/[0.1] bg-[#080C0E] px-4 py-3 font-mono text-xs text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-[#00FF9D]/50 focus:shadow-[0_0_20px_-4px_rgba(0,255,157,0.3)]"
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-white/[0.07] pt-4">
              <p className="font-mono text-xs text-slate-400">
                EST. COST:{" "}
                <span className="font-bold text-[#00FF9D]">
                  {formatUSD(estimatedCost)}
                </span>{" "}
                <span className="text-[10px] text-slate-500">
                  {isRequestPriced(model)
                    ? "(per request)"
                    : `(~${inputTokens} in / ${outputTokens} out)`}
                </span>
              </p>
              <button
                type="submit"
                className={`rounded-full px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-40 cursor-pointer ${
                  isRunning
                    ? "border border-rose-500/50 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                    : "bg-[#00FF9D] text-[#080C0E] shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:bg-[#10B981] hover:shadow-[0_0_28px_rgba(0,255,157,0.5)] active:scale-95"
                }`}
                disabled={!isRunning && !prompt.trim()}
              >
                {isRunning ? "Stop Stream" : "Run Inference"}
              </button>
            </div>
          </form>

          <section className="rounded-2xl border border-white/[0.08] bg-[#0E141B]/95 p-6 sm:p-8 shadow-xl backdrop-blur-md">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-white">Stream Output</h2>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/[0.08] bg-[#080C0E] px-3 py-1 font-mono text-[10px] text-slate-400">
                  POST /v1/invoke
                </span>
                <span
                  className={`rounded-full border px-3 py-1 font-mono text-[10px] font-bold ${STATUS_STYLES[run.status]}`}
                >
                  {STATUS_LABELS[run.status]}
                </span>
              </div>
            </header>

            <div
              aria-live="polite"
              className="mt-5 min-h-[240px] rounded-xl border border-white/[0.06] bg-[#05080A] p-5 shadow-inner"
            >
              {run.output ? (
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[#00FF9D]">
                  {run.output}
                  {isRunning && (
                    <span className="animate-pulse text-white">▍</span>
                  )}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center pt-20 text-center text-xs font-mono text-slate-500">
                  {run.status === "connecting" ? (
                    <div className="flex items-center gap-2 text-amber-300">
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                      ESTABLISHING HIGH-SPEED ENCLAVE ROUTE...
                    </div>
                  ) : (
                    "ENTER A PROMPT AND CLICK 'RUN INFERENCE' TO STREAM RESPONSE DATA"
                  )}
                </div>
              )}
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.06] sm:grid-cols-4">
              {metrics.map(({ label, value }) => (
                <div key={label} className="flex flex-col bg-[#080C0E] px-4 py-3">
                  <dd className="font-mono text-sm font-bold text-white">{value}</dd>
                  <dt className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    {label}
                  </dt>
                </div>
              ))}
            </dl>

            <p className="mt-4 text-right font-mono text-[11px] text-slate-400">
              SIMULATED COST:{" "}
              <span className="font-bold text-[#00FF9D]">
                {formatUSD(estimatedCost)}
              </span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
