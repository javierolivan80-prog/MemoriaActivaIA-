"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { apiFetch, NETWORK_ERROR_MESSAGE } from "@/lib/apiFetch";

export default function AttachFamilyPlanButton({
  elderlyId,
}: {
  elderlyId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    const response = await apiFetch(
      `/api/elderly/${elderlyId}/attach-family-plan`,
      { method: "POST" }
    );

    if (!response) {
      setLoading(false);
      setError(NETWORK_ERROR_MESSAGE);
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setLoading(false);
      setError(data?.error ?? "No se pudo añadir al plan familiar.");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-base font-medium text-primary transition-colors hover:text-primary-hover disabled:pointer-events-none disabled:text-text-muted"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Añadiendo...
          </>
        ) : (
          "Añadir a mi plan familiar"
        )}
      </button>
      {error && (
        <p className="mt-1 text-sm text-alert-urgent" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
