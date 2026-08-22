const SYSTEM_PROMPT = `You extract intent for an AI model marketplace assistant. Reply ONLY with a JSON object with exactly these keys:
"category" — one of: LLM, Code Generation, Embeddings, Vision, OCR, Audio Transcription, Image Generation, Safety & Moderation, Translation — or null if unclear;
"maxBudget" — a positive number for the maximum acceptable unit price mentioned, or null;
"priority" — "speed" if the user cares about latency/fast responses, "accuracy" if they care about quality/score, otherwise "balanced".`;

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

  let message = "";
  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    message = String(body?.message ?? "").slice(0, 600);
  } catch (parseError) {
    res.status(400).json({ ok: false, error: "Invalid request body" });
    return;
  }
  if (!message.trim()) {
    res.status(400).json({ error: "Missing message" });
    return;
  }

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
          { role: "user", content: message },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 800,
        reasoning_effort: "none",
      }),
    });

    if (!response.ok) {
      res.status(502).json({ error: "Upstream request failed", status: response.status });
      return;
    }

    const payload = await response.json();
    const intent = JSON.parse(payload.choices?.[0]?.message?.content ?? "{}");
    res.status(200).json({ ok: true, intent });
  } catch (error) {
    res.status(502).json({ ok: false, error: "Intent extraction failed" });
  }
}
