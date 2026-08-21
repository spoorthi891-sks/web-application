const HF_API_URL = "https://huggingface.co/api/models";
const REQUEST_TIMEOUT_MS = 10000;

const PIPELINE_CATEGORIES = {
  "text-generation": "LLM",
  "text2text-generation": "LLM",
  conversational: "LLM",
  summarization: "LLM",
  "fill-mask": "LLM",
  "feature-extraction": "Embeddings",
  "sentence-similarity": "Embeddings",
  "automatic-speech-recognition": "Audio Transcription",
  "text-to-image": "Image Generation",
  "image-text-to-text": "Vision",
  "image-classification": "Vision",
  "object-detection": "Vision",
  translation: "Translation",
  "token-classification": "Safety & Moderation",
  "text-classification": "Safety & Moderation",
};

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
});

const PIPELINE_BASE_PRICE_PER_1K = {
  "text-generation": 0.004,
  "text2text-generation": 0.002,
  conversational: 0.0035,
  summarization: 0.002,
  "fill-mask": 0.001,
  "feature-extraction": 0.0002,
  "sentence-similarity": 0.0002,
  "automatic-speech-recognition": 0.008,
  "text-to-image": 0.02,
  "image-text-to-text": 0.0075,
  "image-classification": 0.003,
  "object-detection": 0.003,
  translation: 0.0015,
  "token-classification": 0.0008,
  "text-classification": 0.0008,
};

export function estimateHostingPrice(hfModel, pipeline = "text-generation") {
  const base = PIPELINE_BASE_PRICE_PER_1K[pipeline] ?? 0.003;
  const demand = Math.sqrt(hfModel.downloads ?? 0) / 250;
  const likesBoost = Math.min(2, Math.log10((hfModel.likes ?? 0) + 10) / 2);
  const raw = base * (0.25 + demand + likesBoost / 4);
  return Math.max(0.0005, Math.round(raw * 2000) / 2000);
}

export function formatCompact(value) {
  return compactFormatter.format(value ?? 0);
}

function prettifyLicense(license) {
  return license
    .split("-")
    .map((part) =>
      /^[a-z]/.test(part) ? part[0].toUpperCase() + part.slice(1) : part,
    )
    .join(" ");
}

export function mapHfModel(hfModel) {
  const [author, ...rest] = hfModel.id.split("/");
  const name = rest.join("/") || author;
  const licenseTag = (hfModel.tags ?? []).find((tag) =>
    tag.startsWith("license:"),
  );
  const license = licenseTag ? prettifyLicense(licenseTag.slice(8)) : "Open weights";
  const pipeline = hfModel.pipeline_tag ?? "text-generation";

  return {
    id: hfModel.id,
    name,
    category: PIPELINE_CATEGORIES[pipeline] ?? "LLM",
    provider: author,
    description: `Open-weights ${pipeline} model${
      hfModel.library_name ? ` built on ${hfModel.library_name}` : ""
    }. ${formatCompact(hfModel.downloads)} monthly downloads and ${formatCompact(
      hfModel.likes,
    )} community likes on the Hugging Face Hub.`,
    pricingPer1kTokens: estimateHostingPrice(hfModel, pipeline),
    pricingPerRequest: null,
    latencyMs: null,
    privacyRating: `${license} · Open weights`,
    benchmarkScore: null,
    tags: (hfModel.tags ?? [])
      .filter((tag) => !tag.includes(":"))
      .slice(0, 6),
    downloads: hfModel.downloads ?? 0,
    likes: hfModel.likes ?? 0,
    externalUrl: `https://huggingface.co/${hfModel.id}`,
  };
}

const TRENDING_PIPELINES = [
  "text-generation",
  "text-to-image",
  "automatic-speech-recognition",
  "feature-extraction",
  "image-text-to-text",
  "translation",
  "text-classification",
];

async function fetchPipelinePage(pipeline, perPipeline) {
  const url = `${HF_API_URL}?pipeline_tag=${encodeURIComponent(
    pipeline,
  )}&sort=trendingScore&direction=-1&limit=${perPipeline}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Hugging Face Hub responded with ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Unexpected response shape from Hugging Face Hub");
    }
    return data.map(mapHfModel);
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request to Hugging Face Hub timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchTrendingModels({ limit = 30, perPipeline = 6 } = {}) {
  const settled = await Promise.allSettled(
    TRENDING_PIPELINES.map((pipeline) =>
      fetchPipelinePage(pipeline, perPipeline),
    ),
  );

  const models = settled
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value);

  if (models.length === 0) {
    throw new Error(
      "Could not reach the Hugging Face Hub. Check your connection and try again.",
    );
  }

  const seen = new Set();
  const unique = [];
  for (const model of models) {
    if (!seen.has(model.id)) {
      seen.add(model.id);
      unique.push(model);
    }
  }

  // Interleave round-robin across categories so the catalog leads with variety
  const buckets = new Map();
  for (const model of unique) {
    const bucket = buckets.get(model.category) ?? [];
    bucket.push(model);
    buckets.set(model.category, bucket);
  }
  const interleaved = [];
  let added = true;
  while (interleaved.length < unique.length && added) {
    added = false;
    for (const bucket of buckets.values()) {
      if (bucket.length > 0) {
        interleaved.push(bucket.shift());
        added = true;
      }
    }
  }

  return interleaved.slice(0, limit);
}

function extractBaseModels(tags = []) {
  return tags
    .filter((tag) => tag.startsWith("base_model:") && !tag.includes("quantized"))
    .map((tag) => tag.slice("base_model:".length));
}

export async function fetchHfModelDetail(id) {
  const url = `${HF_API_URL}/${id}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(
        response.status === 404
          ? "This model does not exist on the Hugging Face Hub"
          : `Hugging Face Hub responded with ${response.status}`,
      );
    }
    const data = await response.json();
    const pipeline = data.pipeline_tag ?? "text-generation";
    return {
      ...mapHfModel(data),
      pipeline,
      libraryName: data.library_name ?? null,
      gated: Boolean(data.gated),
      createdAt: data.createdAt ?? null,
      lastModified: data.lastModified ?? null,
      filesCount: Array.isArray(data.siblings) ? data.siblings.length : null,
      baseModels: extractBaseModels(data.tags),
      licenseRaw: (data.tags ?? []).find((tag) => tag.startsWith("license:"))?.slice(8) ?? null,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request to Hugging Face Hub timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
