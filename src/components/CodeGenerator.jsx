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
    <section className="overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold text-white">
            Integration snippet
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {model.name} · {model.provider}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-slate-950/60 p-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                language === lang
                  ? "bg-cyan-400/15 text-cyan-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </header>

      <div className="relative">
        <pre className="overflow-x-auto p-5 text-xs leading-relaxed text-emerald-300/90">
          <code>{snippet}</code>
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-4 top-4 rounded-md border border-white/10 bg-slate-950/80 px-2.5 py-1 text-xs text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </section>
  );
}
