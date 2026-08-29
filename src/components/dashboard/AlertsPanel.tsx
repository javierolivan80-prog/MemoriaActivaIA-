"use client";

import { useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Info, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { prefersReducedMotion } from "@/lib/motion";

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
  const [leavingId, setLeavingId] = useState<string | null>(null);

  async function handleMarkAsRead(id: string) {
    setDismissingId(id);

    const response = await fetch(`/api/alerts/${id}/read`, {
      method: "PATCH",
    });

    setDismissingId(null);

    if (!response.ok) return;

    setLeavingId(id);
    window.setTimeout(
      () => {
        setAlerts((current) => current.filter((alert) => alert.id !== id));
        setLeavingId(null);
      },
      prefersReducedMotion() ? 0 : 380
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-text-primary">
          Alertas recientes
        </h2>
        {alerts.length > 0 && (
          <span
            aria-live="polite"
            aria-atomic="true"
            className="animate-pop-in rounded-full bg-alert-urgent px-3 py-1 text-sm font-medium text-white"
          >
            {alerts.length}{" "}
            {alerts.length === 1 ? "alerta nueva" : "alertas nuevas"}
          </span>
        )}
      </div>

      {alerts.length === 0 && (
        <Reveal className="mt-4 rounded-2xl bg-secondary-light p-8 text-center">
          <CheckCircle
            className="animate-pop-in mx-auto h-8 w-8 text-secondary"
            strokeWidth={1.75}
          />
          <p className="mt-3 text-base text-text-primary">
            Todo en orden, sin alertas pendientes
          </p>
        </Reveal>
      )}

      {alerts.length > 0 && (
        <ul className="mt-4 space-y-3">
          {alerts.map((alert, index) => {
            const styles = LEVEL_STYLES[alert.alert_level];
            const LevelIcon = LEVEL_ICONS[alert.alert_level];
            const isLeaving = leavingId === alert.id;
            return (
              <li
                key={alert.id}
                style={{ animationDelay: `${index * 70}ms` }}
                className={`step-fade flex items-start gap-4 overflow-hidden rounded-2xl border-l-4 p-5 shadow-soft transition-[opacity,transform,max-height,padding,margin] duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${styles.border} ${styles.bg} ${
                  isLeaving
                    ? "max-h-0 -translate-x-2 scale-[0.98] p-0 opacity-0"
                    : "max-h-96 opacity-100"
                }`}
              >
                {isLeaving ? (
                  <CheckCircle
                    className="animate-pop-in mt-0.5 h-5 w-5 shrink-0 text-secondary"
                    strokeWidth={1.75}
                  />
                ) : (
                  <LevelIcon
                    className={`mt-0.5 h-5 w-5 shrink-0 ${styles.icon}`}
                    strokeWidth={1.75}
                  />
                )}

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
                  disabled={dismissingId === alert.id || isLeaving}
                  className="shrink-0 px-3 py-2 text-sm"
                >
                  {dismissingId === alert.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Marcar como leída"
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
