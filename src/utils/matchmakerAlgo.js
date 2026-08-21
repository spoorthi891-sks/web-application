import { MODELS } from "../data/modelsRegistry.js";
import { isRequestPriced } from "./costCalculator.js";

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "for",
  "with",
  "and",
  "or",
  "to",
  "of",
  "in",
  "on",
  "i",
  "we",
  "need",
  "want",
  "my",
  "our",
  "some",
  "best",
  "good",
]);

const PRIORITY_WEIGHTS = {
  speed: { latency: 0.8, benchmark: 0.2 },
  accuracy: { latency: 0.2, benchmark: 0.8 },
  balanced: { latency: 0.5, benchmark: 0.5 },
};

function tokenize(query) {
  return (query.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(
    (term) => !STOP_WORDS.has(term),
  );
}

function scoreModel(terms, model) {
  const haystack =
    `${model.name} ${model.provider} ${model.category} ${model.description}`.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (model.tags.some((tag) => tag.toLowerCase().includes(term))) score += 3;
    if (model.category.toLowerCase().includes(term)) score += 2;
    if (haystack.includes(term)) score += 1;
  }
  return score;
}

export function recommendModels(query, models = MODELS, { limit = 3 } = {}) {
  const terms = tokenize(query);
  if (terms.length === 0) return [];
  return models
    .map((model) => ({ model, score: scoreModel(terms, model) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.model.latencyMs - b.model.latencyMs)
    .slice(0, limit)
    .map(({ model }) => model);
}

export function unitPrice(model) {
  return isRequestPriced(model)
    ? model.pricingPerRequest
    : model.pricingPer1kTokens;
}

function normalize(value, min, max) {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

export function findMatches(preferences = {}, models = MODELS) {
  const { category = "", maxBudget = null, priority = "balanced" } = preferences;

  let candidates = models.filter(
    (model) => !category || category === "All" || model.category === category,
  );

  if (maxBudget != null) {
    candidates = candidates.filter((model) => {
      const price = unitPrice(model);
      return price != null && price <= maxBudget;
    });
  }

  if (candidates.length === 0) return [];

  const benchMin = Math.min(...candidates.map((m) => m.benchmarkScore));
  const benchMax = Math.max(...candidates.map((m) => m.benchmarkScore));
  const latMin = Math.min(...candidates.map((m) => m.latencyMs));
  const latMax = Math.max(...candidates.map((m) => m.latencyMs));

  const weights = PRIORITY_WEIGHTS[priority] ?? PRIORITY_WEIGHTS.balanced;

  return candidates
    .map((model) => {
      const speedScore = 1 - normalize(model.latencyMs, latMin, latMax);
      const qualityScore = normalize(model.benchmarkScore, benchMin, benchMax);
      return {
        model,
        score: weights.latency * speedScore + weights.benchmark * qualityScore,
      };
    })
    .sort((a, b) => b.score - a.score || a.model.latencyMs - b.model.latencyMs);
}

export function recommendOne(preferences = {}, models = MODELS) {
  return findMatches(preferences, models)[0]?.model ?? null;
}
