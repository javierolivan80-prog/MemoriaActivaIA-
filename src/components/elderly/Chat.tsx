"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import type { FamilyChatMessage } from "@/types";

const SUGGESTIONS = [
  "¿Cómo está esta semana?",
  "¿Ha mencionado algo de su salud?",
  "¿Cómo la noto de ánimo últimamente?",
  "Cuéntame algo bonito de la última llamada",
];

function TypingIndicator() {
  return (
    <div className="flex w-fit items-center gap-1 rounded-2xl bg-surface-alt px-4 py-3">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted" />
    </div>
  );
}

export default function Chat({ elderlyId }: { elderlyId: string }) {
  const [messages, setMessages] = useState<FamilyChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const response = await fetch(`/api/elderly/${elderlyId}/chat`);
      const data = await response.json();
      if (cancelled) return;
      setMessages(data.messages ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [elderlyId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setError(null);
    setInput("");
    setMessages((current) => [
      ...current,
      {
        id: `temp-${Date.now()}`,
        elderly_id: elderlyId,
        user_id: null,
        role: "user",
        content: trimmed,
        created_at: new Date().toISOString(),
      },
    ]);
    setSending(true);

    const response = await fetch(`/api/elderly/${elderlyId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed }),
    });
    const data = await response.json();

    setSending(false);

    if (!response.ok) {
      setError(data.error ?? "No se pudo enviar el mensaje");
      return;
    }

    setMessages((current) => [...current, data.message]);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="flex h-[60vh] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-1 py-2">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSend(suggestion)}
                className="rounded-full border border-primary bg-primary-light px-4 py-2 text-sm font-medium text-primary"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-base leading-relaxed ${
                message.role === "user"
                  ? "bg-primary text-white"
                  : "bg-surface-alt text-text-primary"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <TypingIndicator />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mt-2 rounded-xl bg-alert-urgent-bg p-3 text-sm text-alert-urgent">
          {error}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSend(input);
          }}
          placeholder="Escribe un mensaje..."
          className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={() => handleSend(input)}
          disabled={sending || !input.trim()}
          aria-label="Enviar mensaje"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
