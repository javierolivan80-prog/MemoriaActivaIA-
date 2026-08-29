"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { inputClasses } from "@/components/ui/Input";
import { buttonBaseClasses, buttonVariantClasses } from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { apiFetch, NETWORK_ERROR_MESSAGE } from "@/lib/apiFetch";
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

    const response = await apiFetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planType, elderlyId }),
    });

    if (!response) {
      setLoadingPlan(null);
      setError(NETWORK_ERROR_MESSAGE);
      return;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.url) {
      setLoadingPlan(null);
      setError(data?.error ?? "No se pudo iniciar el pago. Inténtalo de nuevo.");
      return;
    }

    window.location.assign(data.url);
  }

  return (
    <div>
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h1 className="font-serif text-4xl leading-tight text-text-primary">
            Elige cómo acompañarle
          </h1>
          <p className="mt-4 max-w-sm text-lg text-text-secondary">
            Cambia o cancela cuando quieras, sin permanencia. Los dos planes
            incluyen resumen y alertas después de cada llamada — la
            diferencia está en cuántas veces al día llamamos.
          </p>

          {profiles.length > 1 && (
            <div className="mt-8 max-w-xs">
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
            <p className="mt-6 text-base text-alert-urgent">{error}</p>
          )}
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          {PLAN_ORDER.map((planType, index) => {
            const plan = PLANS[planType];
            const isPopular = planType === "completo";

            return (
              <Reveal
                key={planType}
                delay={index * 90}
                className={isPopular ? "" : "sm:mt-10"}
              >
                <div
                  className={`relative flex h-full flex-col rounded-2xl bg-surface p-8 shadow-soft transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-soft-md ${
                    isPopular
                      ? "border-2 border-primary shadow-soft-md"
                      : "border border-border"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-white">
                      Más elegido
                    </span>
                  )}
                  <h2 className="font-serif text-2xl text-text-primary">
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
              </Reveal>
            );
          })}
        </div>
      </div>

      <p className="mx-auto mt-16 max-w-md text-center text-sm text-text-muted">
        Los precios incluyen IVA. Puedes cancelar la suscripción en cualquier
        momento desde tu panel.
      </p>
    </div>
  );
}
