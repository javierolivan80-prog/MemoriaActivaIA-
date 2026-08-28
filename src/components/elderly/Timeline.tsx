"use client";

import { useEffect, useState } from "react";
import { Clock, Loader2, PhoneCall } from "lucide-react";
import Button from "@/components/ui/Button";
interface SessionWithSummary {
  id: string;
  started_at: string;
  duration_seconds: number | null;
  call_summaries: {
    summary: string;
    mood_detected: string | null;
    topics_discussed: string[];
  }[];
}

const MOOD_STYLES: Record<string, { dot: string; label: string; emoji: string }> = {
  positivo: { dot: "bg-secondary", label: "Buen ánimo", emoji: "😊" },
  neutral: { dot: "bg-alert-warning", label: "Ánimo neutral", emoji: "😐" },
  negativo: { dot: "bg-alert-warning", label: "Algo bajo de ánimo", emoji: "😕" },
  preocupante: { dot: "bg-alert-urgent", label: "Preocupado/a", emoji: "😟" },
};

const DEFAULT_MOOD_STYLE = {
  dot: "bg-text-muted",
  label: "Sin analizar",
  emoji: "—",
};

function formatSessionDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const timeStr = date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, now)) return `Hoy, ${timeStr}`;
  if (isSameDay(date, yesterday)) return `Ayer, ${timeStr}`;

  const dateStr = date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
  });
  return `${dateStr}, ${timeStr}`;
}

function formatDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

function SessionCard({ session }: { session: SessionWithSummary }) {
  const [expanded, setExpanded] = useState(false);
  const summary = session.call_summaries[0];
  const moodStyle = summary?.mood_detected
    ? (MOOD_STYLES[summary.mood_detected] ?? DEFAULT_MOOD_STYLE)
    : DEFAULT_MOOD_STYLE;
  const duration = formatDuration(session.duration_seconds);

  return (
    <div className="relative pl-10">
      <span
        className={`absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-surface ${moodStyle.dot}`}
      />
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-text-primary">
            {formatSessionDate(session.started_at)}
          </span>
          {duration && (
            <span className="inline-flex items-center gap-1.5 text-sm text-text-muted">
              <Clock className="h-3.5 w-3.5" />
              {duration}
            </span>
          )}
        </div>

        <p className="mt-2 text-sm text-text-secondary">
          <span aria-hidden>{moodStyle.emoji}</span> {moodStyle.label}
        </p>

        {summary ? (
          <>
            <p
              className={`mt-3 text-base leading-relaxed text-text-primary ${
                expanded ? "" : "line-clamp-3"
              }`}
            >
              {summary.summary}
            </p>
            {summary.summary.length > 160 && (
              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                className="mt-1 text-sm font-medium text-primary"
              >
                {expanded ? "Ver menos" : "Ver más"}
              </button>
            )}

            {summary.topics_discussed.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {summary.topics_discussed.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full bg-secondary-light px-2.5 py-0.5 text-xs text-secondary"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="mt-3 text-base text-text-muted">
            Aún no hay resumen disponible para esta llamada.
          </p>
        )}
      </div>
    </div>
  );
}

const PAGE_SIZE = 10;

export default function Timeline({ elderlyId }: { elderlyId: string }) {
  const [sessions, setSessions] = useState<SessionWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      const response = await fetch(
        `/api/elderly/${elderlyId}/sessions?limit=${PAGE_SIZE}&offset=0`
      );
      const data = await response.json();
      if (cancelled) return;
      setSessions(data.sessions ?? []);
      setHasMore(Boolean(data.hasMore));
      setLoading(false);
    }

    loadInitial();
    return () => {
      cancelled = true;
    };
  }, [elderlyId]);

  async function handleLoadMore() {
    setLoadingMore(true);
    const response = await fetch(
      `/api/elderly/${elderlyId}/sessions?limit=${PAGE_SIZE}&offset=${sessions.length}`
    );
    const data = await response.json();
    setSessions((current) => [...current, ...(data.sessions ?? [])]);
    setHasMore(Boolean(data.hasMore));
    setLoadingMore(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-12 text-center">
        <PhoneCall
          className="mx-auto h-12 w-12 text-text-muted"
          strokeWidth={1.5}
        />
        <p className="mt-4 text-lg text-text-secondary">
          Aún no ha recibido ninguna llamada
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="relative space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-px before:bg-border">
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="secondary"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              "Cargar más"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
