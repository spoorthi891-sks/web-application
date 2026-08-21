import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MODELS } from "../data/modelsRegistry.js";
import { fetchHfModelDetail } from "../utils/hfHub.js";
import {
  estimateCost,
  formatUSD,
  isRequestPriced,
} from "../utils/costCalculator.js";

const CHUNK_INTERVAL_MS = 14;
const CHUNK_SIZE = 10;

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "to", "of", "in", "on", "for", "with",
  "this", "that", "these", "those", "please", "can", "could", "would",
  "should", "will", "shall", "may", "might", "must", "do", "does", "did",
  "have", "has", "had", "was", "were", "been", "being", "is", "are", "am",
  "be", "as", "at", "by", "from", "into", "about", "over", "under", "then",
  "them", "they", "their", "there", "here", "what", "which", "who", "whom",
  "how", "why", "when", "where", "while", "during", "before", "after",
  "above", "below", "between", "through", "against", "some", "any", "all",
  "each", "every", "both", "few", "more", "most", "other", "such", "only",
  "own", "same", "so", "than", "too", "very", "just", "also", "not", "but",
  "get", "got", "give", "given", "take", "taken", "make", "made", "want",
  "need", "like", "help", "using", "used", "write", "written", "create",
]);

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function extractKeywords(prompt) {
  const words = prompt.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? [];
  return [...new Set(words.filter((word) => !STOP_WORDS.has(word)))].slice(0, 5);
}

function excerpt(prompt, maxLength = 90) {
  const flat = prompt.trim().replace(/\s+/g, " ");
  if (!flat) return "";
  return flat.length > maxLength ? `${flat.slice(0, maxLength)}…` : flat;
}

function titleCaseWords(keywords) {
  return keywords.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1),
  );
}

function buildMockResponse(model, prompt, ttfbMs) {
  const inputTokens = Math.max(1, Math.ceil(prompt.trim().length / 4));
  const created = Math.floor(Date.now() / 1000);
  const requestId = `${model.id}-${hashString(prompt).toString(16).slice(0, 6)}`;
  const seed = hashString(`${model.id}:${prompt}`);
  const keywords = extractKeywords(prompt);
  const promptExcerpt = excerpt(prompt);
  const topic =
    titleCaseWords(keywords.slice(0, 3)).join(", ") || "the provided input";

  const inputEcho = {
    prompt_excerpt: promptExcerpt,
    detected_keywords: keywords,
  };

  const payloads = {
    LLM: () => {
      const lowerPrompt = prompt.toLowerCase();
      const legalSignals = ["contract", "agreement", "clause", "liability", "renewal", "termination", "terms"];
      const isLegal = legalSignals.some((signal) => lowerPrompt.includes(signal));
      return {
        task_interpretation: `Request parsed as ${
          isLegal ? "document review" : keywords.includes("code") || keywords.includes("bug")
            ? "technical assistance"
            : "open-domain question"
        } targeting: ${topic}.`,
        summary: isLegal
          ? `Reviewed the text around "${excerpt(prompt, 60)}". Key obligations identified across ${topic}: renewal terms, liability exposure, and exit conditions. No unlimited-liability clause found.`
          : `Here is what I found regarding ${topic}. The request "${excerpt(prompt, 60)}" breaks down into ${Math.max(2, keywords.length + 1)} sub-questions, which I resolved step by step using the ${model.name} reasoning stack.`,
        key_points: [
          ...keywords.slice(0, 3).map((keyword) => `Extracted and grounded the concept of "${keyword}" from your prompt.`),
          seed % 2 === 0
            ? "Cross-checked claims against retrieved context before answering."
            : "Applied chain-of-thought decomposition for multi-hop reasoning.",
        ],
        confidence: Number((0.86 + (seed % 120) / 1000).toFixed(2)),
        input_echo: inputEcho,
      };
    },
    "Code Generation": () => {
      const languageHints = {
        python: "python", js: "javascript", javascript: "javascript",
        typescript: "typescript", ts: "typescript", react: "tsx",
        java: "java", rust: "rust", go: "go", sql: "sql",
      };
      const lowerPrompt = prompt.toLowerCase();
      const language =
        Object.keys(languageHints).find((hint) => lowerPrompt.includes(hint)) ?? "python";
      const subject = (keywords[0] ?? "request").replace(/[^a-z0-9]+/g, "_");
      const secondSubject = (keywords[1] ?? "payload").replace(/[^a-z0-9]+/g, "_");
      return {
        language,
        framework: language === "python" ? "pytest" : language === "javascript" || language === "typescript" ? "vitest" : "stdlib",
        task_understood: `Generating ${language} code for: ${promptExcerpt}`,
        code:
          language === "javascript" || language === "typescript"
            ? `function process${subject.charAt(0).toUpperCase() + subject.slice(1)}(${secondSubject}) {\n  // derived from your prompt: "${excerpt(prompt, 48)}"\n  if (${secondSubject} == null) throw new Error("missing ${secondSubject}");\n  return { ok: true, handled: ${secondSubject} };\n}\n\ntest("${subject} handles happy path", () => {\n  expect(process${subject.charAt(0).toUpperCase() + subject.slice(1)}("sample")).toEqual({ ok: true, handled: "sample" });\n});`
            : `def test_${subject}_handles_happy_path():\n    """Generated for: ${excerpt(prompt, 64)}"""\n    result = handle_${subject}(${secondSubject}="sample")\n    assert result["ok"] is True\n\ndef test_${subject}_rejects_missing_${secondSubject}():\n    import pytest\n    with pytest.raises(ValueError):\n        handle_${subject}(${secondSubject}=None)`,
        explanation: `Implements the behaviour described in your prompt with input validation around ${topic}.`,
        input_echo: inputEcho,
      };
    },
    Embeddings: () => ({
      dimensions: 1536,
      normalized: true,
      embedded_text: excerpt(prompt, 120),
      vector_preview: Array.from({ length: 6 }, (_, index) =>
        Number((Math.sin(seed + index * 7919) * 0.45).toFixed(4)),
      ),
      nearest_neighbours: [
        { doc_id: `DOC-${(seed % 9000) + 1000}`, cosine_similarity: Number((0.88 + (seed % 90) / 1000).toFixed(2)) },
        { doc_id: `DOC-${((seed >> 3) % 9000) + 1000}`, cosine_similarity: Number((0.84 + (seed % 70) / 1000).toFixed(2)) },
        { doc_id: `DOC-${((seed >> 6) % 9000) + 1000}`, cosine_similarity: Number((0.81 + (seed % 50) / 1000).toFixed(2)) },
      ],
      note: `Vector space centred on semantic concepts: ${topic}.`,
      input_echo: inputEcho,
    }),
    Vision: () => {
      const lowerPrompt = prompt.toLowerCase();
      const docType =
        ["invoice", "receipt", "contract", "chart", "form", "id_card"].find((type) =>
          lowerPrompt.includes(type.replace("_", " ")) || lowerPrompt.includes(type),
        ) ?? "document";
      return {
        document_type: docType,
        fields: {
          vendor: `${titleCaseWords(keywords.slice(0, 2)).join(" ") || "Nimbus"} Supplies Ltd.`,
          detected_context: promptExcerpt,
          total_value: `$${(((seed % 80000) + 2000) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
          due_date: `2026-${String((seed % 12) + 1).padStart(2, "0")}-${String((seed % 27) + 1).padStart(2, "0")}`,
        },
        line_items_detected: (seed % 14) + 3,
        average_field_confidence: Number((0.93 + (seed % 60) / 1000).toFixed(2)),
        input_echo: inputEcho,
      };
    },
    OCR: () => ({
      pages_processed: (seed % 4) + 1,
      handwriting_detected: prompt.toLowerCase().includes("handwrit"),
      fields: {
        reference_number: `REF-${seed.toString(16).slice(0, 8).toUpperCase()}`,
        vendor: `${titleCaseWords(keywords.slice(0, 2)).join(" ") || "Cortical"} Systems`,
        total: `$${(((seed % 40000) + 1500) / 100).toFixed(2)}`,
        currency: "USD",
      },
      source_text_sample: excerpt(prompt, 80),
      input_echo: inputEcho,
    }),
    "Audio Transcription": () => ({
      duration_seconds: Number(((seed % 3000) / 100 + 5).toFixed(1)),
      speakers_detected: (seed % 2) + 2,
      segments: [
        {
          start: 2.0,
          speaker: "agent",
          text: "Thanks for contacting Highrise support, how can I help?",
        },
        {
          start: 5.4,
          speaker: "caller",
          text: excerpt(prompt, 110) || "I need help rotating an API key.",
        },
        {
          start: 11.3,
          speaker: "agent",
          text: `Understood — you mentioned ${topic}. Generating a new key for you now.`,
        },
      ],
      input_echo: inputEcho,
    }),
    "Image Generation": () => ({
      width: 2048,
      height: 2048,
      diffusion_steps: 30 + (seed % 20),
      prompt_adherence: Number((0.88 + (seed % 90) / 1000).toFixed(2)),
      interpreted_prompt: promptExcerpt,
      style_lock: keywords.find((word) => ["cyberpunk", "minimalist", "photorealistic", "watercolor", "isometric"].includes(word)) ?? "brand-neon",
      seed: seed % 100000000,
      variations_endpoint: "/v1/images/variations",
      input_echo: inputEcho,
    }),
    "Safety & Moderation": () => {
      const emailFound = /[\w.+-]+@[\w-]+\.[\w.]+/.test(prompt);
      const phoneFound = /(?:\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/.test(prompt);
      const redacted = [
        ...(emailFound ? ["EMAIL"] : []),
        ...(phoneFound ? ["PHONE_NUMBER"] : []),
      ];
      return {
        recommended_action: redacted.length > 0 ? "allow_with_redaction" : "allow",
        critical_flags: [],
        pii_entities_redacted: redacted,
        scan_summary: redacted.length > 0
          ? `Detected ${redacted.join(" and ")} inside your prompt and prepared safe replacements.`
          : "No PII, toxicity or injection patterns detected in the submitted prompt.",
        prompt_injection_risk: Number(((seed % 50) / 1000).toFixed(3)),
        toxicity_score: Number(((seed % 30) / 1000).toFixed(3)),
        input_echo: inputEcho,
      };
    },
    Translation: () => {
      const languageMap = { german: "de", french: "fr", spanish: "es", japanese: "ja", hindi: "hi", chinese: "zh" };
      const lowerPrompt = prompt.toLowerCase();
      const hint = Object.keys(languageMap).find((language) => lowerPrompt.includes(language));
      const targetLanguage = hint ? languageMap[hint] : "de";
      const names = { de: "German", fr: "French", es: "Spanish", ja: "Japanese", hi: "Hindi", zh: "Chinese" };
      return {
        source_language: "en",
        target_language: targetLanguage,
        translation: `[${targetLanguage.toUpperCase()}] ${excerpt(prompt, 140)}`,
        formality: lowerPrompt.includes("formal") ? "formal" : "informal",
        glossary_terms_applied: keywords.slice(0, 3),
        quality_estimate: Number((0.95 + (seed % 40) / 1000).toFixed(3)),
        note: `Routed through the ${names[targetLanguage]} production engine.`,
        input_echo: inputEcho,
      };
    },
  };

  const output = payloads[model.category]
    ? payloads[model.category]()
    : {
        message:
          "Mock inference complete. Wire this panel to a real Highrise inference endpoint for live output.",
        received_prompt: promptExcerpt,
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
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get("model");

  const [hfExtra, setHfExtra] = useState(null);

  useEffect(() => {
    if (!requestedId || MODELS.some((m) => m.id === requestedId)) {
      setHfExtra(null);
      return undefined;
    }
    let cancelled = false;
    setHfExtra(null);
    fetchHfModelDetail(requestedId)
      .then((detail) => {
        if (!cancelled) setHfExtra(detail);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [requestedId]);

  const catalog = useMemo(
    () => (hfExtra ? [hfExtra, ...MODELS] : MODELS),
    [hfExtra],
  );

  const [modelId, setModelId] = useState(
    catalog.some((m) => m.id === requestedId) ? requestedId : MODELS[0].id,
  );
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

  const model = catalog.find((m) => m.id === modelId) ?? catalog[0];
  const isRunning = run.status === "connecting" || run.status === "streaming";

  useEffect(() => {
    if (requestedId && catalog.some((m) => m.id === requestedId) && modelId !== requestedId) {
      setModelId(requestedId);
    }
  }, [catalog, requestedId]);

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

    const ttfb = Math.round((model.latencyMs ?? 450) * (0.9 + Math.random() * 0.3));
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
                {catalog.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.provider}
                    {m.latencyMs != null ? ` (${m.latencyMs} ms)` : ""}
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
