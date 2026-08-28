"use client";

import { useState } from "react";

export interface AlertItem {
  id: string;
  elderly_name: string;
  message: string;
  alert_level: 1 | 2 | 3;
  created_at: string;
}

const LEVEL_STYLES: Record<1 | 2 | 3, { container: string; badge: string }> = {
  3: {
    container: "border-red-200 bg-red-50",
    badge: "bg-red-100 text-red-700",
  },
  2: {
    container: "border-amber-200 bg-amber-50",
    badge: "bg-amber-100 text-amber-800",
  },
  1: {
    container: "border-blue-200 bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
  },
};

const LEVEL_LABELS: Record<1 | 2 | 3, string> = {
  3: "Urgencia",
  2: "Atención",
  1: "Info",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AlertsPanel({
  initialAlerts,
}: {
  initialAlerts: AlertItem[];
}) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  async function handleMarkAsRead(id: string) {
    setDismissingId(id);

    const response = await fetch(`/api/alerts/${id}/read`, {
      method: "PATCH",
    });

    setDismissingId(null);

    if (response.ok) {
      setAlerts((current) => current.filter((alert) => alert.id !== id));
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900">
          Alertas recientes
        </h2>
        {alerts.length > 0 && (
          <span className="rounded-full bg-gray-900 px-3 py-1 text-sm font-medium text-white">
            {alerts.length}{" "}
            {alerts.length === 1 ? "alerta nueva" : "alertas nuevas"}
          </span>
        )}
      </div>

      {alerts.length === 0 && (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-lg text-gray-600">
            Todo en orden, sin alertas pendientes.
          </p>
        </div>
      )}

      {alerts.length > 0 && (
        <ul className="mt-4 space-y-3">
          {alerts.map((alert) => {
            const styles = LEVEL_STYLES[alert.alert_level];
            return (
              <li
                key={alert.id}
                className={`rounded-2xl border p-5 ${styles.container}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {alert.alert_level === 3 && (
                      <span aria-hidden className="mt-0.5 text-xl">
                        ⚠️
                      </span>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles.badge}`}
                        >
                          {LEVEL_LABELS[alert.alert_level]}
                        </span>
                        <span className="text-base font-medium text-gray-900">
                          {alert.elderly_name}
                        </span>
                      </div>
                      <p className="mt-1.5 text-base text-gray-800">
                        {alert.message}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {formatDate(alert.created_at)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleMarkAsRead(alert.id)}
                    disabled={dismissingId === alert.id}
                    className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    {dismissingId === alert.id ? "..." : "Marcar como leída"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
