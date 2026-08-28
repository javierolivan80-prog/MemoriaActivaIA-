import type { CallsPerDay, MinutesPerCall, PlanType } from "@/types";

export type { PlanType };

export interface PlanDefinition {
  planType: PlanType;
  name: string;
  priceEur: number;
  callsPerDay: CallsPerDay;
  minutesPerCall: MinutesPerCall;
  description: string;
  features: string[];
}

export const PLANS: Record<PlanType, PlanDefinition> = {
  esencial: {
    planType: "esencial",
    name: "Esencial",
    priceEur: 30.99,
    callsPerDay: 1,
    minutesPerCall: 4,
    description: "1 llamada al día de 4 minutos",
    features: [
      "1 llamada diaria personalizada",
      "Resumen después de cada llamada",
      "Alertas si algo importante ocurre",
      "Cancela cuando quieras",
    ],
  },
  completo: {
    planType: "completo",
    name: "Completo",
    priceEur: 61.99,
    callsPerDay: 2,
    minutesPerCall: 4,
    description: "2 llamadas al día de 4 minutos cada una",
    features: [
      "2 llamadas diarias personalizadas",
      "Resumen después de cada llamada",
      "Alertas si algo importante ocurre",
      "Cancela cuando quieras",
      "Prioridad en soporte",
    ],
  },
};

export const PLAN_ORDER: PlanType[] = ["esencial", "completo"];
