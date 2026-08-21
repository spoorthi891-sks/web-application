export const MODELS = [
  {
    id: "atlas-70b",
    name: "Atlas-70B",
    category: "LLM",
    provider: "Nimbus Labs",
    description:
      "Flagship instruction-tuned language model built for enterprise reasoning, retrieval-augmented generation, and reliable multi-step tool calling at scale.",
    pricingPer1kTokens: 0.0045,
    pricingPerRequest: null,
    latencyMs: 340,
    privacyRating: "GDPR compliant · SOC 2 Type II",
    benchmarkScore: 92.4,
    tags: ["chat", "rag", "tools", "reasoning"],
  },
  {
    id: "nova-mini",
    name: "Nova Mini",
    category: "LLM",
    provider: "Nimbus Labs",
    description:
      "Lightweight, high-throughput language model tuned for classification, entity extraction, and routing workloads where cost and speed outweigh depth.",
    pricingPer1kTokens: 0.0006,
    pricingPerRequest: null,
    latencyMs: 120,
    privacyRating: "GDPR compliant · zero data retention",
    benchmarkScore: 84.1,
    tags: ["chat", "classification", "extraction", "high-volume"],
  },
  {
    id: "forge-coder-34b",
    name: "Forge Coder 34B",
    category: "Code Generation",
    provider: "Forge ML",
    description:
      "Code-specialized model trained on permissively licensed repositories. Excels at fill-in-middle completion, refactoring, and test synthesis for mainstream stacks.",
    pricingPer1kTokens: 0.0016,
    pricingPerRequest: null,
    latencyMs: 280,
    privacyRating: "SOC 2 Type II · IP indemnity included",
    benchmarkScore: 89.7,
    tags: ["code", "completion", "refactoring", "tests"],
  },
  {
    id: "sage-embed-v3",
    name: "Sage Embed v3",
    category: "Embeddings",
    provider: "VectorWorks",
    description:
      "High-throughput embedding model producing 1536-dimension vectors with state-of-the-art retrieval quality for semantic search, clustering, and recommendations.",
    pricingPer1kTokens: 0.00002,
    pricingPerRequest: null,
    latencyMs: 45,
    privacyRating: "GDPR compliant · EU data residency",
    benchmarkScore: 96.2,
    tags: ["embeddings", "semantic-search", "clustering", "reranking"],
  },
  {
    id: "iris-vision-pro",
    name: "Iris Vision Pro",
    category: "Vision",
    provider: "Nimbus Labs",
    description:
      "Multimodal vision-language model for document parsing, chart understanding, and image-grounded question answering across mixed-format enterprise content.",
    pricingPer1kTokens: 0.0075,
    pricingPerRequest: null,
    latencyMs: 520,
    privacyRating: "HIPAA ready · GDPR compliant",
    benchmarkScore: 94.0,
    tags: ["vision", "multimodal", "documents", "chart-qa"],
  },
  {
    id: "lexiscript-ocr",
    name: "LexiScript OCR",
    category: "OCR",
    provider: "Cortical Systems",
    description:
      "Layout-aware text extraction for scanned contracts, invoices, and forms. Handles handwriting, tables, and 120+ languages with structured JSON output.",
    pricingPer1kTokens: null,
    pricingPerRequest: 0.004,
    latencyMs: 850,
    privacyRating: "GDPR compliant · on-prem deployment available",
    benchmarkScore: 91.5,
    tags: ["ocr", "handwriting", "tables", "multilingual"],
  },
  {
    id: "echo-transcribe-rt",
    name: "Echo Transcribe RT",
    category: "Audio Transcription",
    provider: "Sonare",
    description:
      "Streaming speech-to-text with speaker diarization and word-level timestamps, optimized for call centers, meeting notes, and real-time captioning.",
    pricingPer1kTokens: null,
    pricingPerRequest: 0.012,
    latencyMs: 300,
    privacyRating: "HIPAA ready · PCI DSS certified",
    benchmarkScore: 95.8,
    tags: ["speech-to-text", "streaming", "diarization", "captions"],
  },
  {
    id: "canvas-diffusion-xl",
    name: "Canvas Diffusion XL",
    category: "Image Generation",
    provider: "Prisma AI",
    description:
      "Production-grade diffusion model for brand-safe marketing imagery and product visualization, with style locking, inpainting, and native 2K output.",
    pricingPer1kTokens: null,
    pricingPerRequest: 0.04,
    latencyMs: 3200,
    privacyRating: "GDPR compliant · C2PA content provenance",
    benchmarkScore: 88.9,
    tags: ["text-to-image", "marketing", "product-shots", "inpainting"],
  },
  {
    id: "sentinel-guard",
    name: "Sentinel Guard",
    category: "Safety & Moderation",
    provider: "Aegis AI",
    description:
      "Real-time input and output guardrails: PII detection, toxicity scoring, and prompt-injection defense designed to sit in front of any LLM endpoint.",
    pricingPer1kTokens: 0.0004,
    pricingPerRequest: null,
    latencyMs: 60,
    privacyRating: "GDPR compliant · ISO 27001 certified",
    benchmarkScore: 93.6,
    tags: ["moderation", "pii-detection", "prompt-injection", "compliance"],
  },
  {
    id: "meridian-translate",
    name: "Meridian Translate",
    category: "Translation",
    provider: "LinguaCore",
    description:
      "Neural machine translation across 128 languages with glossary enforcement, formality control, and terminology consistency for regulated industries.",
    pricingPer1kTokens: 0.0011,
    pricingPerRequest: null,
    latencyMs: 210,
    privacyRating: "GDPR compliant · EU data residency",
    benchmarkScore: 90.3,
    tags: ["translation", "localization", "glossary", "multilingual"],
  },
];

export function getModelById(id) {
  return MODELS.find((model) => model.id === id);
}

export const CATEGORIES = [...new Set(MODELS.map((model) => model.category))];

export const PROVIDERS = [...new Set(MODELS.map((model) => model.provider))];
