import { CATEGORIES } from "../data/modelsRegistry.js";

const PRIORITIES = ["speed", "balanced", "accuracy"];

const CATEGORY_KEYWORDS = [
  ["ocr", "OCR"],
  ["invoice", "OCR"],
  ["receipt", "OCR"],
  ["scan document", "OCR"],
  ["handwriting", "OCR"],
  ["transcri", "Audio Transcription"],
  ["speech to text", "Audio Transcription"],
  ["podcast", "Audio Transcription"],
  ["audio", "Audio Transcription"],
  ["voice memo", "Audio Transcription"],
  ["text-to-image", "Image Generation"],
  ["generate image", "Image Generation"],
  ["image generation", "Image Generation"],
  ["logo design", "Image Generation"],
  ["artwork", "Image Generation"],
  ["vision", "Vision"],
  ["image tagging", "Vision"],
  ["caption", "Vision"],
  ["photo", "Vision"],
  ["embed", "Embeddings"],
  ["vector", "Embeddings"],
  ["semantic search", "Embeddings"],
  ["rag pipeline", "Embeddings"],
  ["moderation", "Safety & Moderation"],
  ["toxicity", "Safety & Moderation"],
  ["nsfw", "Safety & Moderation"],
  ["content safety", "Safety & Moderation"],
  ["translat", "Translation"],
  ["localization", "Translation"],
  ["multilingual", "Translation"],
  ["code", "Code Generation"],
  ["program", "Code Generation"],
  ["developer copilot", "Code Generation"],
  ["refactor", "Code Generation"],
  ["chatbot", "LLM"],
  ["assistant", "LLM"],
  ["summariz", "LLM"],
  ["writing", "LLM"],
  ["reasoning", "LLM"],
  ["llm", "LLM"],
];

export function normalizeIntent(raw = {}) {
  const wanted = String(raw?.category ?? "").toLowerCase();
  const category =
    CATEGORIES.find((item) => item.toLowerCase() === wanted) || null;
  const budgetNumber = Number(raw?.maxBudget);
  const maxBudget =
    Number.isFinite(budgetNumber) && budgetNumber > 0 ? budgetNumber : null;
  const priority = PRIORITIES.includes(raw?.priority)
    ? raw.priority
    : "balanced";
  return { category, maxBudget, priority };
}

export function parseIntentLocally(message = "") {
  const text = message.toLowerCase();

  let category = null;
  for (const [needle, mapped] of CATEGORY_KEYWORDS) {
    if (text.includes(needle)) {
      category = mapped;
      break;
    }
  }

  let maxBudget = null;
  const dollarMatch = text.match(/\$\s*([0-9]+(?:\.[0-9]+)?)/);
  const wordMatch = text.match(
    /(?:under|below|max|maximum|less than|cheaper than)\s+\$?\s*([0-9]+(?:\.[0-9]+)?)/,
  );
  if (dollarMatch) maxBudget = Number(dollarMatch[1]);
  else if (wordMatch) maxBudget = Number(wordMatch[1]);

  let priority = "balanced";
  if (/fast|quick|snappy|low[- ]latency|real[- ]time/.test(text)) {
    priority = "speed";
  } else if (/accura|quality|precise|smart|best score/.test(text)) {
    priority = "accuracy";
  }

  return normalizeIntent({ category, maxBudget, priority });
}
