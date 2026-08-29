"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { apiFetch, NETWORK_ERROR_MESSAGE } from "@/lib/apiFetch";

export default function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    const response = await apiFetch("/api/stripe/portal", { method: "POST" });

    if (!response) {
      setLoading(false);
      setError(NETWORK_ERROR_MESSAGE);
      return;
    }

    const data = await response.json().catch(() => null);

    if (response.ok && data?.url) {
      window.location.assign(data.url);
      return;
    }

    setLoading(false);
    setError(data?.error ?? "No se pudo abrir el portal de facturación.");
  }

  return (
    <div>
      <Button
        variant="secondary"
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Abriendo...
          </>
        ) : (
          "Gestionar suscripción"
        )}
      </Button>
      {error && (
        <p className="mt-1.5 text-sm text-alert-urgent" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
