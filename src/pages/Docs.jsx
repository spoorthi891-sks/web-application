import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "authentication", label: "Authentication" },
  { id: "run-inference", label: "Run inference" },
  { id: "streaming", label: "Streaming" },
  { id: "response-schema", label: "Response schema" },
  { id: "errors", label: "Errors" },
  { id: "rate-limits", label: "Rate limits & plans" },
];

const BASE_URL_SNIPPET = `https://api.highrise.dev/v1`;

const AUTH_SNIPPET = [
  "# Your key is provisioned after checkout — store it as an env var.",
  "export HIGHRISE_KEY=\"highrise_sk_0f3a9c…\"  # never commit this",
  "",
  "# Every request must carry it:",
  'curl https://api.highrise.dev/v1/run \\',
  '  -H "Authorization: Bearer $HIGHRISE_KEY"',
].join("\n");

const CURL_RUN = [
  "curl -N https://api.highrise.dev/v1/run \\",
  '  -H "Authorization: Bearer $HIGHRISE_KEY" \\',
  '  -H "Content-Type: application/json" \\',
  `  -d '{ "model": "atlas-70b", "input": "Summarize this contract", "stream": true }'`,
].join("\n");

const PYTHON_RUN = [
  "from highrise import Client",
  "",
  'client = Client(api_key=os.environ["HIGHRISE_KEY"])',
  "",
  "stream = client.run(",
  '    model="atlas-70b",',
  '    input="Summarize this contract",',
  "    stream=True,",
  ")",
  "",
  "for event in stream:",
  '    print(event.delta, end="")',
].join("\n");

const NODE_RUN = [
  'import { Highrise } from "@highrise/sdk";',
  "",
  "const client = new Highrise({",
  "  apiKey: process.env.HIGHRISE_KEY,",
  "});",
  "",
  "const stream = await client.run({",
  '  model: "atlas-70b",',
  '  input: "Summarize this contract",',
  "  stream: true,",
  "});",
  "",
  "for await (const event of stream) {",
  "  process.stdout.write(event.delta);",
  "}",
].join("\n");

const STREAM_EVENTS = [
  "event: inference.delta",
  'data: {"object":"inference.event","delta":"Here"}',
  "",
  "event: inference.delta",
  'data: {"object":"inference.event","delta":" is what"}',
  "",
  "event: inference.done",
  'data: {"object":"inference.response","id":"atlas-70b-a31f04","usage":{"input_tokens":18,"output_tokens":214},"timing":{"time_to_first_byte_ms":352}}',
].join("\n");

const RESPONSE_EXAMPLE = [
  "{",
  '  "id": "atlas-70b-a31f04",',
  '  "object": "inference.response",',
  '  "created": 1771900000,',
  '  "model": "atlas-70b",',
  '  "provider": "Nimbus Labs",',
  '  "output": {',
  '    "summary": "Here is what I found regarding the contract…"',
  "  },",
  '  "usage": { "input_tokens": 18, "output_tokens": 214 },',
  '  "timing": { "time_to_first_byte_ms": 352 }',
  "}",
].join("\n");

const ERROR_EXAMPLE = [
  "{",
  '  "error": {',
  '    "code": "model_not_found",',
  '    "message": "No registered model matches id \u0027gpt-9\u0027.",',
  '    "request_id": "req_c41a88e2"',
  "  }",
  "}",
].join("\n");

function CodeBlock({ title, code }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] shadow-inner">
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#131B24] px-4 py-2">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">
          <span className="h-2 w-2 rounded-full bg-rose-500/60" />
          <span className="h-2 w-2 rounded-full bg-amber-400/60" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/60" />
          <span className="ml-2">{title}</span>
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={`font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
            copied ? "text-[#00FF9D]" : "text-slate-500 hover:text-[#00FF9D]"
          }`}
        >
          {copied ? "COPIED ✓" : "COPY"}
        </button>
      </div>
      <pre className="overflow-x-auto bg-[#05080A] p-4 font-mono text-xs leading-relaxed text-[#00FF9D]">
        {code}
      </pre>
    </div>
  );
}

function ParamTable({ rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
      <table className="w-full min-w-[560px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-white/[0.08] bg-[#10171F]">
            {["Parameter", "Type", "Required", "Description"].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ name, type, required, description }) => (
            <tr
              key={name}
              className="border-t border-white/[0.06] transition-colors hover:bg-white/[0.02] first:border-t-0"
            >
              <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-[#00FF9D]">
                {name}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-400">
                {type}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono uppercase text-slate-400">
                {required}
              </td>
              <td className="px-4 py-3 leading-relaxed text-slate-300">
                {description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocSection({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-white/[0.06] pt-10 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-bold tracking-tight text-white">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
        {children}
      </div>
    </section>
  );
}

export default function Docs() {
  const { hash } = useLocation();

  // Deep links like /docs#errors should land on the section
  useEffect(() => {
    if (!hash) return undefined;
    const timer = setTimeout(() => {
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [hash]);

  return (
    <div className="relative min-h-screen bg-[#080C0E]">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
      <div className="pointer-events-none absolute top-10 right-1/4 h-[350px] w-[500px] rounded-full bg-[#00FF9D]/[0.04] blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-semibold tracking-widest text-[#00FF9D] uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
          DEVELOPER DOCUMENTATION · V1 STABLE
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          The Highrise <span className="text-[#00FF9D]">Inference API</span>
        </h1>
        <p className="mt-1.5 max-w-2xl text-xs text-slate-400 sm:text-sm">
          One authenticated endpoint in front of every model in the registry.
          Send an input, stream tokens back, pay per use — no GPU ops required.
        </p>

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[220px_1fr]">
          {/* Sidebar */}
          <nav
            aria-label="Documentation sections"
            className="top-24 lg:sticky lg:block"
          >
            <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              On this page
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 lg:flex-col lg:gap-y-1">
              {SECTIONS.map(({ id, label }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="block border-l-2 border-transparent py-1 pl-3 text-xs text-slate-400 transition-colors hover:border-[#00FF9D]/50 hover:text-white lg:text-[13px]"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6 hidden rounded-xl border border-white/[0.08] bg-[#0E141B]/95 p-4 lg:block">
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                Status
              </p>
              <p className="mt-1.5 flex items-center gap-2 font-mono text-[11px] text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9D] shadow-[0_0_8px_#00FF9D]" />
                Operational · us-east-1
              </p>
              <Link
                to="/sandbox"
                className="mt-3 inline-block font-mono text-[11px] font-semibold text-[#00FF9D] transition-colors hover:text-emerald-300"
              >
                Try it in the Sandbox →
              </Link>
            </div>
          </nav>

          {/* Content */}
          <article className="min-w-0 space-y-10">
            <DocSection id="overview" title="Overview">
              <p>
                The Highrise Inference API exposes every marketplace model —
                language, vision, audio, and moderation — through a single
                unified interface. You authenticate once, address a model by its
                registry id, and receive structured JSON or a token stream.
                Routing, scaling, and failover across providers like Nimbus Labs,
                Forge ML, and VectorWorks are handled by the platform.
              </p>
              <CodeBlock title="Base URL" code={BASE_URL_SNIPPET} />
              <ParamTable
                rows={[
                  {
                    name: "POST /v1/run",
                    type: "—",
                    required: "endpoint",
                    description:
                      "Run inference against any registered model. Supports streaming.",
                  },
                  {
                    name: "POST /v1/images/variations",
                    type: "—",
                    required: "endpoint",
                    description:
                      "Generate inpainted variations (image-generation models only).",
                  },
                ]}
              />
            </DocSection>

            <DocSection id="authentication" title="Authentication">
              <p>
                All requests are authenticated with a Bearer API key provisioned
                when you deploy a model through checkout. Keys are scoped to your
                workspace and begin with{" "}
                <code className="rounded bg-[#10171F] px-1.5 py-0.5 font-mono text-xs text-[#00FF9D]">
                  highrise_sk_
                </code>
                . Treat them like passwords — rotate immediately if leaked.
              </p>
              <CodeBlock title="Shell · auth" code={AUTH_SNIPPET} />
            </DocSection>

            <DocSection id="run-inference" title="Run inference">
              <p>
                <code className="rounded bg-[#10171F] px-1.5 py-0.5 font-mono text-xs text-[#00FF9D]">
                  POST /v1/run
                </code>{" "}
                is the only endpoint most integrations ever need. Address any
                model by id and pass your workload as the input.
              </p>
              <ParamTable
                rows={[
                  {
                    name: "model",
                    type: "string",
                    required: "yes",
                    description:
                      "Registry model id, e.g. atlas-70b or lexiscript-ocr.",
                  },
                  {
                    name: "input",
                    type: "string | object",
                    required: "yes",
                    description:
                      "Your prompt, document, or modality-specific payload.",
                  },
                  {
                    name: "stream",
                    type: "boolean",
                    required: "no",
                    description:
                      "Defaults to false. When true, deltas arrive as server-sent events.",
                  },
                ]}
              />
              <div className="grid gap-4 xl:grid-cols-2">
                <CodeBlock title="cURL · streaming run" code={CURL_RUN} />
                <CodeBlock title="Python · highrise SDK" code={PYTHON_RUN} />
              </div>
              <CodeBlock title="Node.js · @highrise/sdk" code={NODE_RUN} />
            </DocSection>

            <DocSection id="streaming" title="Streaming">
              <p>
                With <code className="rounded bg-[#10171F] px-1.5 py-0.5 font-mono text-xs text-[#00FF9D]">stream: true</code>{" "}
                the connection stays open and emits{" "}
                <span className="font-mono text-xs text-slate-200">inference.delta</span>{" "}
                events as tokens are produced, followed by one terminal{" "}
                <span className="font-mono text-xs text-slate-200">inference.done</span>{" "}
                event carrying usage and timing. The{" "}
                <span className="font-mono text-xs text-slate-200">-N</span> flag
                disables client-side buffering in cURL.
              </p>
              <CodeBlock title="Server-sent events" code={STREAM_EVENTS} />
            </DocSection>

            <DocSection id="response-schema" title="Response schema">
              <p>
                A non-streamed call returns a single{" "}
                <span className="font-mono text-xs text-slate-200">inference.response</span>{" "}
                object. The shape of <span className="font-mono text-xs text-slate-200">output</span> depends
                on the model category — LLMs return summaries and key points,
                OCR returns extracted fields, embeddings return vectors — while
                the envelope stays identical everywhere.
              </p>
              <CodeBlock title="200 OK · application/json" code={RESPONSE_EXAMPLE} />
              <ParamTable
                rows={[
                  {
                    name: "id",
                    type: "string",
                    required: "always",
                    description: "Unique id for this inference, useful in support tickets.",
                  },
                  {
                    name: "object",
                    type: "string",
                    required: "always",
                    description: 'Literal "inference.response".',
                  },
                  {
                    name: "created",
                    type: "integer",
                    required: "always",
                    description: "Unix timestamp (seconds) of completion.",
                  },
                  {
                    name: "usage.requests",
                    type: "integer",
                    required: "per-request models",
                    description: "Billable request count (OCR, transcription, image models).",
                  },
                  {
                    name: "usage.input_tokens / usage.output_tokens",
                    type: "integer",
                    required: "token models",
                    description: "Billable token counts for language and embedding models.",
                  },
                  {
                    name: "timing.time_to_first_byte_ms",
                    type: "integer",
                    required: "always",
                    description: "Median-adjusted latency before the first byte was streamed.",
                  },
                ]}
              />
            </DocSection>

            <DocSection id="errors" title="Errors">
              <p>
                Non-2xx responses share one envelope. Retry{" "}
                <span className="font-mono text-xs text-slate-200">429</span> and{" "}
                <span className="font-mono text-xs text-slate-200">5xx</span> with
                exponential backoff; everything else means the request itself needs fixing.
              </p>
              <CodeBlock title="4xx example" code={ERROR_EXAMPLE} />
              <ParamTable
                rows={[
                  { name: "400", type: "invalid_request", required: "fix request", description: "Malformed JSON or missing required parameter." },
                  { name: "401", type: "invalid_api_key", required: "fix auth", description: "Key missing, revoked, or malformed." },
                  { name: "404", type: "model_not_found", required: "fix id", description: "The model id is not in the registry." },
                  { name: "429", type: "rate_limit_exceeded", required: "backoff", description: "Plan RPM/TPM ceiling hit — retry after backoff." },
                  { name: "500", type: "inference_failed", required: "retry", description: "Upstream inference fault; safe to retry once." },
                  { name: "503", type: "capacity_exceeded", required: "backoff", description: "Regional GPU pool saturated — retry shortly." },
                ]}
              />
            </DocSection>

            <DocSection id="rate-limits" title="Rate limits & plans">
              <p>
                Limits apply per workspace key. Plan discounts from checkout are
                applied automatically to metered usage.
              </p>
              <ParamTable
                rows={[
                  { name: "Pay-as-you-go", type: "$0 /mo", required: "60 RPM", description: "List-price usage, community support, cancel anytime." },
                  { name: "Growth", type: "$499 /mo", required: "600 RPM", description: "20% off all usage, priority support, 99.9% uptime SLA." },
                  { name: "Enterprise", type: "$2,499 /mo", required: "custom", description: "35% off all usage, VPC/on-prem deployment, custom DPA." },
                ]}
              />
              <p className="text-xs text-slate-400">
                Ready to go? Pick a model in{" "}
                <Link to="/explore" className="font-semibold text-[#00FF9D] transition-colors hover:text-emerald-300">
                  Explore
                </Link>{" "}
                and your key is provisioned instantly at checkout.
              </p>
            </DocSection>
          </article>
        </div>
      </div>
    </div>
  );
}
