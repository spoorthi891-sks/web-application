export function isRequestPriced(model) {
  return model.pricingPerRequest != null;
}

export function estimateCost(model, units = 0) {
  if (isRequestPriced(model)) {
    return units * model.pricingPerRequest;
  }
  return (units / 1000) * model.pricingPer1kTokens;
}

export function priceLabel(model) {
  return isRequestPriced(model)
    ? `${formatUSD(model.pricingPerRequest)} / request`
    : `${formatUSD(model.pricingPer1kTokens)} / 1K tokens`;
}

export function estimateMonthlyCost(
  model,
  { monthlyRequests = 0, avgTokensPerRequest = 0 } = {},
) {
  if (isRequestPriced(model)) {
    return monthlyRequests * model.pricingPerRequest;
  }
  const monthlyTokens = monthlyRequests * avgTokensPerRequest;
  return (monthlyTokens / 1000) * model.pricingPer1kTokens;
}

export function compareMonthlyCosts(models, traffic = {}) {
  return models
    .map((model) => ({
      model,
      monthlyCost: estimateMonthlyCost(model, traffic),
    }))
    .sort((a, b) => a.monthlyCost - b.monthlyCost);
}

export function formatUSD(value) {
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value === 0) return "$0";
  const magnitude = Math.floor(Math.log10(Math.abs(value)));
  const digits = Math.min(8, Math.max(2, 2 - magnitude));
  return `$${parseFloat(value.toFixed(digits))}`;
}

export function formatTokenCount(tokens) {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return String(tokens);
}
