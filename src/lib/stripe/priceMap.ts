import type { PlanType } from "./plans";

export function getPriceIdForPlan(planType: PlanType): string {
  const priceIds: Record<PlanType, string | undefined> = {
    basic: process.env.STRIPE_PRICE_BASIC,
    care: process.env.STRIPE_PRICE_CARE,
    premium: process.env.STRIPE_PRICE_PREMIUM,
  };

  const priceId = priceIds[planType];
  if (!priceId) {
    throw new Error(`No hay price id configurado para el plan ${planType}`);
  }
  return priceId;
}

export function getPlanTypeForPriceId(priceId: string): PlanType | null {
  if (priceId === process.env.STRIPE_PRICE_BASIC) return "basic";
  if (priceId === process.env.STRIPE_PRICE_CARE) return "care";
  if (priceId === process.env.STRIPE_PRICE_PREMIUM) return "premium";
  return null;
}
