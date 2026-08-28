"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";

export default function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const response = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await response.json();

    if (response.ok && data.url) {
      window.location.assign(data.url);
      return;
    }

    setLoading(false);
  }

  return (
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
  );
}
