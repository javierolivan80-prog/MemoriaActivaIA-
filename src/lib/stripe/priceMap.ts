import type { PlanType } from "./plans";

export function getPriceIdForPlan(planType: PlanType): string {
  const priceIds: Record<PlanType, string | undefined> = {
    esencial: process.env.STRIPE_PRICE_ESENCIAL,
    completo: process.env.STRIPE_PRICE_COMPLETO,
  };

  const priceId = priceIds[planType];
  if (!priceId) {
    throw new Error(`No hay price id configurado para el plan ${planType}`);
  }
  return priceId;
}

export function getPlanTypeForPriceId(priceId: string): PlanType | null {
  if (priceId === process.env.STRIPE_PRICE_ESENCIAL) return "esencial";
  if (priceId === process.env.STRIPE_PRICE_COMPLETO) return "completo";
  return null;
}
