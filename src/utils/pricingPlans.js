import { estimateMonthlyCost } from "./costCalculator.js";

export const PLANS = [
  {
    id: "pay-as-you-go",
    name: "Pay-as-you-go",
    tagline: "No commitment, scale freely",
    platformFee: 0,
    usageDiscount: 0,
    perks: ["List-price per token", "Community support", "Cancel anytime"],
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "For teams shipping to production",
    platformFee: 499,
    usageDiscount: 0.2,
    perks: ["20% off all usage", "Priority support", "99.9% uptime SLA"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Custom scale, compliance & controls",
    platformFee: 2499,
    usageDiscount: 0.35,
    perks: [
      "35% off all usage",
      "Dedicated success engineer",
      "VPC / on-prem deployment",
      "Custom DPA & audit rights",
    ],
  },
];

export function getPlanById(id) {
  return PLANS.find((plan) => plan.id === id) ?? PLANS[0];
}

export function calculatePlanCost(plan, model, traffic = {}) {
  const usage = estimateMonthlyCost(model, traffic);
  const discountedUsage = usage * (1 - plan.usageDiscount);
  return {
    usage,
    discountedUsage,
    platformFee: plan.platformFee,
    savings: usage - discountedUsage,
    total: discountedUsage + plan.platformFee,
  };
}
