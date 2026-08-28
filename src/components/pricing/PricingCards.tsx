"use client";

import { useState } from "react";
import { PLAN_ORDER, PLANS } from "@/lib/stripe/plans";
import type { ElderlyProfile, PlanType } from "@/types";

export default function PricingCards({
  profiles,
  initialElderlyId,
}: {
  profiles: ElderlyProfile[];
  initialElderlyId: string | null;
}) {
  const [elderlyId, setElderlyId] = useState(
    initialElderlyId && profiles.some((p) => p.id === initialElderlyId)
      ? initialElderlyId
      : profiles[0].id
  );
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChoosePlan(planType: PlanType) {
    setError(null);
    setLoadingPlan(planType);

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planType, elderlyId }),
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      setLoadingPlan(null);
      setError(data.error ?? "No se pudo iniciar el pago. Inténtalo de nuevo.");
      return;
    }

    window.location.assign(data.url);
  }

  return (
    <div className="mt-10">
      {profiles.length > 1 && (
        <div className="mx-auto mb-10 max-w-sm">
          <label
            htmlFor="elderly-select"
            className="block text-base font-medium text-gray-900"
          >
            ¿Para quién es el plan?
          </label>
          <select
            id="elderly-select"
            value={elderlyId}
            onChange={(event) => setElderlyId(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-lg focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p className="mb-6 text-center text-base text-red-600">{error}</p>
      )}

      <div className="grid gap-6 sm:grid-cols-3">
        {PLAN_ORDER.map((planType) => {
          const plan = PLANS[planType];
          const isPopular = planType === "care";

          return (
            <div
              key={planType}
              className={`flex flex-col rounded-2xl border bg-white p-8 shadow-sm ${
                isPopular ? "border-gray-900 ring-1 ring-gray-900" : "border-gray-200"
              }`}
            >
              {isPopular && (
                <span className="mb-4 inline-block w-fit rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
                  Más elegido
                </span>
              )}
              <h2 className="text-xl font-semibold text-gray-900">
                {plan.name}
              </h2>
              <p className="mt-4">
                <span className="text-4xl font-semibold tracking-tight text-gray-900">
                  {plan.priceEur.toFixed(2)}€
                </span>
                <span className="text-base text-gray-500"> /mes</span>
              </p>
              <p className="mt-3 text-base text-gray-600">{plan.description}</p>

              <button
                onClick={() => handleChoosePlan(planType)}
                disabled={loadingPlan !== null}
                className={`mt-8 rounded-lg px-4 py-3 text-lg font-medium transition disabled:opacity-50 ${
                  isPopular
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "border border-gray-300 text-gray-900 hover:bg-gray-50"
                }`}
              >
                {loadingPlan === planType ? "Redirigiendo..." : "Elegir plan"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
