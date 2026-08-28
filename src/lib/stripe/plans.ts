import type { PlanType } from "@/types";

export type { PlanType };

export interface PlanDefinition {
  planType: PlanType;
  name: string;
  priceEur: number;
  callsPerDay: 1 | 2 | 3;
  minutesPerCall: 5 | 10 | 15;
  description: string;
}

export const PLANS: Record<PlanType, PlanDefinition> = {
  basic: {
    planType: "basic",
    name: "Basic",
    priceEur: 14.99,
    callsPerDay: 1,
    minutesPerCall: 5,
    description: "1 llamada al día de 5 minutos.",
  },
  care: {
    planType: "care",
    name: "Care",
    priceEur: 24.99,
    callsPerDay: 2,
    minutesPerCall: 10,
    description: "2 llamadas al día de 10 minutos.",
  },
  premium: {
    planType: "premium",
    name: "Premium",
    priceEur: 39.99,
    callsPerDay: 3,
    minutesPerCall: 15,
    description: "3 llamadas al día de 15 minutos.",
  },
};

export const PLAN_ORDER: PlanType[] = ["basic", "care", "premium"];
