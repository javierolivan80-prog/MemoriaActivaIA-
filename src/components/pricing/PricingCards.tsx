"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { inputClasses } from "@/components/ui/Input";
import { buttonBaseClasses, buttonVariantClasses } from "@/components/ui/Button";
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
            className="block text-sm font-medium text-text-primary"
          >
            ¿Para quién es el plan?
          </label>
          <select
            id="elderly-select"
            value={elderlyId}
            onChange={(event) => setElderlyId(event.target.value)}
            className={inputClasses}
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
        <p className="mb-6 text-center text-base text-alert-urgent">{error}</p>
      )}

      <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
        {PLAN_ORDER.map((planType) => {
          const plan = PLANS[planType];
          const isPopular = planType === "completo";

          return (
            <div
              key={planType}
              className={`relative flex flex-col rounded-2xl bg-surface p-8 shadow-soft ${
                isPopular ? "border-2 border-primary" : "border border-border"
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-white">
                  Más elegido
                </span>
              )}
              <h2 className="text-2xl font-semibold text-text-primary">
                {plan.name}
              </h2>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-text-primary">
                  {plan.priceEur.toFixed(2).replace(".", ",")}€
                </span>
                <span className="text-base text-text-muted">/mes</span>
              </p>
              <p className="mt-3 text-base text-text-secondary">
                {plan.description}
              </p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      className="mt-0.5 h-5 w-5 shrink-0 text-secondary"
                      strokeWidth={2}
                    />
                    <span className="text-base text-text-secondary">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleChoosePlan(planType)}
                disabled={loadingPlan !== null}
                className={`${buttonBaseClasses} ${
                  isPopular
                    ? buttonVariantClasses.primary
                    : buttonVariantClasses.secondary
                } mt-8 w-full`}
              >
                {loadingPlan === planType ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirigiendo...
                  </>
                ) : (
                  `Elegir ${plan.name}`
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mx-auto mt-10 max-w-md text-center text-sm text-text-muted">
        Los precios incluyen IVA. Puedes cancelar la suscripción en cualquier
        momento desde tu panel.
      </p>
    </div>
  );
}
