const SYSTEM_PROMPT = `You are the intent parser for Highrise, an enterprise AI model marketplace. Use the conversation context to understand the user's LATEST message (it may reference earlier turns, like "something cheaper"). Reply ONLY with a JSON object with exactly these keys:
"category" — one of: LLM, Code Generation, Embeddings, Vision, OCR, Audio Transcription, Image Generation, Safety & Moderation, Translation — or null if not determinable;
"maxBudget" — positive number for the maximum acceptable unit price mentioned in the latest message, or null if not mentioned;
"priority" — "speed" if the user cares about latency/fast responses, "accuracy" if they care about quality/score, otherwise "balanced";
"note" — one short friendly sentence acknowledging their request (max 12 words), e.g. "OCR on a tight budget — got it."`;

function readRawBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => resolve(raw));
    req.on("error", () => resolve(""));
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server missing GROQ_API_KEY" });
    return;
  }

  let body;
  try {
    body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
  } catch {
    const raw = await readRawBody(req);
    try {
      body = JSON.parse(raw);
    } catch {
      body = {};
    }
  }

  const message = String(body?.message ?? "").slice(0, 600);
  if (!message.trim()) {
    res.status(400).json({ error: "Missing message" });
    return;
  }

  const history = (Array.isArray(body?.history) ? body.history : [])
    .filter((turn) => turn && typeof turn.content === "string")
    .slice(-6)
    .map((turn) => ({
      role: turn.role === "assistant" ? "assistant" : "user",
      content: turn.content.slice(0, 240),
    }));

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3.6-27b",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history,
          { role: "user", content: message },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 800,
        reasoning_effort: "none",
      }),
    });

    if (!response.ok) {
      res.status(502).json({ ok: false, error: "Upstream request failed", status: response.status });
      return;
    }

    const payload = await response.json();
    const parsed = JSON.parse(payload.choices?.[0]?.message?.content ?? "{}");
    res.status(200).json({
      ok: true,
      intent: {
        category: parsed.category ?? null,
        maxBudget: parsed.maxBudget ?? null,
        priority: parsed.priority ?? "balanced",
      },
      note: typeof parsed.note === "string" ? parsed.note.slice(0, 140) : "",
    });
  } catch (error) {
    res.status(502).json({ ok: false, error: "Intent extraction failed" });
  }
}
