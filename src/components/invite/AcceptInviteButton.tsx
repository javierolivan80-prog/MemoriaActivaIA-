"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { apiFetch, NETWORK_ERROR_MESSAGE } from "@/lib/apiFetch";

export default function AcceptInviteButton({
  token,
  elderlyId,
}: {
  token: string;
  elderlyId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    setError(null);

    const response = await apiFetch(`/api/invite/${token}/accept`, {
      method: "POST",
    });

    if (!response) {
      setLoading(false);
      setError(NETWORK_ERROR_MESSAGE);
      return;
    }

    if (!response.ok) {
      setLoading(false);
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "No se pudo aceptar la invitación");
      return;
    }

    router.push(`/elderly/${elderlyId}`);
    router.refresh();
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl bg-alert-urgent-bg p-4 text-sm text-alert-urgent">
          {error}
        </div>
      )}
      <Button
        type="button"
        onClick={handleAccept}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Aceptando...
          </>
        ) : (
          "Aceptar"
        )}
      </Button>
    </div>
  );
}
