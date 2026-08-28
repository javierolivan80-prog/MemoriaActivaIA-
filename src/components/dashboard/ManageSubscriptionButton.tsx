"use client";

import { useState } from "react";

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
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? "Abriendo..." : "Gestionar suscripción"}
    </button>
  );
}
