"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, PhoneCall, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Reveal from "@/components/ui/Reveal";
import type { CalendarDay, CalendarSession } from "@/app/api/elderly/[id]/calendar/route";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

const MOOD_META: Record<string, { dot: string; label: string }> = {
  positivo: { dot: "bg-secondary", label: "Buen ánimo" },
  neutral: { dot: "bg-alert-warning", label: "Ánimo neutral" },
  negativo: { dot: "bg-alert-warning", label: "Algo bajo de ánimo" },
  preocupante: { dot: "bg-alert-urgent", label: "Preocupado/a" },
};

const DEFAULT_MOOD_META = { dot: "bg-text-muted", label: "Sin analizar" };

function dotColorForDay(day: CalendarDay): string {
  if ((day.maxAlertLevel ?? 0) >= 2) return "bg-alert-urgent";
  const moods = day.sessions.map((s) => s.mood ?? "");
  if (moods.includes("preocupante")) return "bg-alert-urgent";
  if (moods.includes("negativo") || moods.includes("neutral")) return "bg-alert-warning";
  if (moods.includes("positivo")) return "bg-secondary";
  return "bg-text-muted";
}

function formatMonthParam(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function formatFullDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}

interface DayCell {
  date: Date;
  inCurrentMonth: boolean;
  key: string;
}

function buildGrid(year: number, month: number): DayCell[] {
  const firstOfMonth = new Date(year, month, 1);
  // getDay(): 0=Sunday..6=Saturday; convert to Monday-first offset.
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayOffset);

  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    cells.push({ date, inCurrentMonth: date.getMonth() === month, key });
  }
  return cells;
}

function DayDetailModal({
  day,
  elderlyName,
  onClose,
}: {
  day: CalendarDay;
  elderlyName: string;
  onClose: () => void;
}) {
  return (
    <Modal
      onClose={onClose}
      labelledBy="day-detail-modal-title"
      contentClassName="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 shadow-soft"
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 id="day-detail-modal-title" className="font-serif text-2xl capitalize text-text-primary">
            {formatFullDate(day.date)}
          </h2>
          <p className="text-sm text-text-secondary">
            Cómo estuvo {elderlyName} este día
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="-m-3 rounded-lg p-3 text-text-muted transition-colors hover:bg-surface-alt hover:text-text-primary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {(day.maxAlertLevel ?? 0) > 0 && (
        <div className="mt-4 rounded-xl bg-alert-urgent-bg p-4 text-sm text-alert-urgent">
          Se generó una alerta ese día (nivel {day.maxAlertLevel}).
        </div>
      )}

      <div className="mt-4 space-y-4">
        {day.sessions.map((session: CalendarSession, index: number) => {
          const mood = session.mood ? MOOD_META[session.mood] ?? DEFAULT_MOOD_META : DEFAULT_MOOD_META;
          const duration = formatDuration(session.duration_seconds);
          return (
            <Reveal key={session.id} delay={index * 60}>
            <div
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-text-primary">
                  {formatTime(session.started_at)}
                </span>
                {duration && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-text-muted">
                    <Clock className="h-3.5 w-3.5" />
                    {duration}
                  </span>
                )}
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-text-secondary">
                <span className={`h-2 w-2 rounded-full ${mood.dot}`} aria-hidden />
                {mood.label}
              </p>
              {session.summary ? (
                <p className="mt-3 text-base leading-relaxed text-text-primary">
                  {session.summary}
                </p>
              ) : (
                <p className="mt-3 text-base text-text-muted">
                  Aún no hay resumen disponible para esta llamada.
                </p>
              )}
              {session.topics_discussed.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {session.topics_discussed.map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full bg-secondary-light px-2.5 py-0.5 text-xs text-secondary"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
            </Reveal>
          );
        })}
      </div>
    </Modal>
  );
}

export default function CallCalendar({
  elderlyId,
  elderlyName,
}: {
  elderlyId: string;
  elderlyName: string;
}) {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [days, setDays] = useState<Record<string, CalendarDay>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const response = await fetch(
        `/api/elderly/${elderlyId}/calendar?month=${formatMonthParam(year, month)}`
      );
      const data = await response.json();
      if (cancelled) return;
      const map: Record<string, CalendarDay> = {};
      for (const day of data.days ?? []) {
        map[day.date] = day;
      }
      setDays(map);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [elderlyId, year, month]);

  function goToPreviousMonth() {
    setSelectedDay(null);
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    setSelectedDay(null);
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function handleDayClick(cell: DayCell) {
    const day = days[cell.key];
    if (!day || day.sessions.length === 0) {
      setHint(cell.key);
      setTimeout(() => setHint((current) => (current === cell.key ? null : current)), 1500);
      return;
    }
    setSelectedDay(day);
  }

  const grid = useMemo(() => buildGrid(year, month), [year, month]);
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goToPreviousMonth}
          aria-label="Mes anterior"
          className="rounded-lg p-3 text-text-secondary hover:bg-surface-alt"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="font-serif text-xl text-text-primary">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          type="button"
          onClick={goToNextMonth}
          aria-label="Mes siguiente"
          className="rounded-lg p-3 text-text-secondary hover:bg-surface-alt"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-text-muted">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className={`mt-1 grid grid-cols-7 gap-1 ${loading ? "opacity-50" : ""}`}>
        {grid.map((cell) => {
          const day = days[cell.key];
          const hasSessions = Boolean(day && day.sessions.length > 0);
          const isToday = cell.key === todayKey;
          const dotColor = day ? dotColorForDay(day) : null;

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => handleDayClick(cell)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors duration-150 ${
                cell.inCurrentMonth ? "text-text-primary" : "text-text-muted/50"
              } ${isToday ? "bg-primary-light font-semibold" : hasSessions ? "hover:bg-surface-alt" : ""}`}
            >
              <span>{cell.date.getDate()}</span>
              {hasSessions && (
                <span className="mt-1 flex gap-0.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                  {day.sessions.length > 1 && (
                    <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                  )}
                </span>
              )}
              {hint === cell.key && (
                <span className="absolute -bottom-6 z-10 rounded-lg bg-text-primary px-2 py-1 text-xs whitespace-nowrap text-white">
                  Sin llamada este día
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-secondary" aria-hidden />
          Buen ánimo
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-alert-warning" aria-hidden />
          Ánimo neutral
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-alert-urgent" aria-hidden />
          Requiere atención
        </span>
      </div>

      {!loading && Object.keys(days).length === 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-8 text-center">
          <PhoneCall className="mx-auto h-10 w-10 text-text-muted" strokeWidth={1.5} />
          <p className="mt-3 text-text-secondary">
            No hay llamadas registradas este mes
          </p>
        </div>
      )}

      {selectedDay && (
        <DayDetailModal
          day={selectedDay}
          elderlyName={elderlyName}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
