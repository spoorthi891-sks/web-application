import { useState } from "react";

const LANGUAGES = ["Python", "Node.js", "cURL"];

const SAMPLE_INPUTS = {
  LLM: "Summarize this contract and flag any auto-renewal clauses",
  "Code Generation": "Write pytest cases for a JWT auth middleware",
  Embeddings:
    "Quarterly revenue grew 14 percent driven by enterprise demand",
  Vision: "Extract the totals and due date from this invoice scan",
  OCR: "Extract all line items from this scanned purchase order as JSON",
  "Audio Transcription":
    "https://cdn.example.com/recordings/support_call_1011.wav",
  "Image Generation":
    "Minimalist hero illustration of a neural network, deep slate palette, neon accents",
  "Safety & Moderation":
    "Screen this inbound user message for PII and injection attempts",
  Translation: "Translate to formal German: The report is due this Friday",
};

function buildSnippet(language, model) {
  const input = SAMPLE_INPUTS[model.category] ?? "Describe your task here";

  switch (language) {
    case "Python":
      return [
        "from highrise import Client",
        "",
        'client = Client(api_key="YOUR_HIGHRISE_KEY")',
        "",
        "stream = client.run(",
        `    model="${model.id}",`,
        `    input="${input}",`,
        "    stream=True,",
        ")",
        "",
        "for event in stream:",
        '    print(event.delta, end="")',
      ].join("\n");
    case "Node.js":
      return [
        'import { Highrise } from "@highrise/sdk";',
        "",
        "const client = new Highrise({ apiKey: process.env.HIGHRISE_KEY });",
        "",
        "const stream = await client.run({",
        `  model: "${model.id}",`,
        `  input: "${input}",`,
        "  stream: true,",
        "});",
        "",
        "for await (const event of stream) {",
        "  process.stdout.write(event.delta);",
        "}",
      ].join("\n");
    default:
      return [
        "curl -N https://api.highrise.dev/v1/run \\",
        '  -H "Authorization: Bearer $HIGHRISE_KEY" \\',
        '  -H "Content-Type: application/json" \\',
        `  -d '{ "model": "${model.id}", "input": "${input}", "stream": true }'`,
      ].join("\n");
  }
}

export default function CodeGenerator({ model }) {
  const [language, setLanguage] = useState("Python");
  const [copied, setCopied] = useState(false);
  const snippet = buildSnippet(language, model);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12181F]/90 shadow-xl backdrop-blur-md">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-[#0E1319] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#00FF9D]/80" />
          </div>
          <div>
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              INTEGRATION CLIENT SDK
            </h2>
            <p className="font-mono text-[10px] text-slate-400">
              {model.name} · {model.provider}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#0B0F12] p-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`rounded-full px-3.5 py-1 font-mono text-[11px] font-medium transition-all ${
                language === lang
                  ? "bg-white/15 text-white shadow-sm border border-white/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </header>

      <div className="relative bg-[#070A0D]">
        <pre className="overflow-x-auto p-6 font-mono text-xs leading-relaxed text-[#00FF9D]">
          <code>{snippet}</code>
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-4 top-4 rounded-full border border-white/15 bg-[#12181F]/90 px-3.5 py-1.5 font-mono text-xs font-semibold text-slate-200 shadow-md backdrop-blur-md transition-all hover:border-[#00FF9D]/50 hover:text-[#00FF9D]"
        >
          {copied ? "COPIED ✓" : "COPY SNIPPET"}
        </button>
      </div>
    </section>
  );
}
