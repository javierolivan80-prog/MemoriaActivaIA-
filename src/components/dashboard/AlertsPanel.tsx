"use client";

import { useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import Button from "@/components/ui/Button";

export interface AlertItem {
  id: string;
  elderly_name: string;
  message: string;
  alert_level: 1 | 2 | 3;
  created_at: string;
}

const LEVEL_STYLES: Record<
  1 | 2 | 3,
  { border: string; bg: string; icon: string; label: string }
> = {
  3: {
    border: "border-l-alert-urgent",
    bg: "bg-alert-urgent-bg",
    icon: "text-alert-urgent",
    label: "Urgencia",
  },
  2: {
    border: "border-l-alert-warning",
    bg: "bg-alert-warning-bg",
    icon: "text-alert-warning",
    label: "Atención",
  },
  1: {
    border: "border-l-alert-info",
    bg: "bg-alert-info-bg",
    icon: "text-alert-info",
    label: "Info",
  },
};

const LEVEL_ICONS = {
  3: AlertTriangle,
  2: AlertCircle,
  1: Info,
} as const;

function formatRelativeTime(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "ahora mismo";
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} ${days === 1 ? "día" : "días"}`;

  return new Date(value).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
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
        <h2 className="text-xl font-semibold text-text-primary">
          Alertas recientes
        </h2>
        {alerts.length > 0 && (
          <span className="rounded-full bg-alert-urgent px-3 py-1 text-sm font-medium text-white">
            {alerts.length}{" "}
            {alerts.length === 1 ? "alerta nueva" : "alertas nuevas"}
          </span>
        )}
      </div>

      {alerts.length === 0 && (
        <div className="mt-4 rounded-2xl bg-secondary-light p-8 text-center">
          <CheckCircle
            className="mx-auto h-8 w-8 text-secondary"
            strokeWidth={1.75}
          />
          <p className="mt-3 text-base text-text-primary">
            Todo en orden, sin alertas pendientes
          </p>
        </div>
      )}

      {alerts.length > 0 && (
        <ul className="mt-4 space-y-3">
          {alerts.map((alert) => {
            const styles = LEVEL_STYLES[alert.alert_level];
            const LevelIcon = LEVEL_ICONS[alert.alert_level];
            return (
              <li
                key={alert.id}
                className={`flex items-start gap-4 rounded-2xl border-l-4 p-5 shadow-soft ${styles.border} ${styles.bg}`}
              >
                <LevelIcon
                  className={`mt-0.5 h-5 w-5 shrink-0 ${styles.icon}`}
                  strokeWidth={1.75}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-base font-medium text-text-primary">
                      {alert.elderly_name}
                    </span>
                    <span className="text-sm text-text-muted">
                      {formatRelativeTime(alert.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-base text-text-secondary">
                    {alert.message}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => handleMarkAsRead(alert.id)}
                  disabled={dismissingId === alert.id}
                  className="shrink-0 px-3 py-2 text-sm"
                >
                  {dismissingId === alert.id ? "..." : "Marcar como leída"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
