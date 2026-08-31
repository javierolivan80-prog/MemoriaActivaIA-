"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ChevronLeft, Loader2, Pencil, Send, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input, { fieldClasses } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { apiFetch, NETWORK_ERROR_MESSAGE } from "@/lib/apiFetch";
import type { FamilyChatMessage, FamilyChatThread } from "@/types";

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

function makeTempId(): string {
  return `temp-${Date.now()}`;
}

function formatThreadDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();
  if (isSameDay) {
    return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function NewThreadModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!title.trim()) {
      setError("Ponle un nombre al chat");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await onCreate(title.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el chat");
      setCreating(false);
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="new-thread-modal-title">
      <h2 id="new-thread-modal-title" className="text-lg font-semibold text-text-primary">
        Nuevo chat
      </h2>
      <div className="mt-4">
        <Input
          label="¿Sobre qué queréis hablar?"
          name="thread-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ej: Dudas de salud"
          autoFocus
        />
      </div>
      {error && (
        <div className="mt-3 rounded-xl bg-alert-urgent-bg p-3 text-sm text-alert-urgent">
          {error}
        </div>
      )}
      <div className="mt-5 flex gap-3">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="flex-1"
        >
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            "Crear chat"
          )}
        </Button>
      </div>
    </Modal>
  );
}

function ThreadList({
  elderlyName,
  threads,
  loading,
  loadError,
  activeThreadId,
  onSelect,
  onCreate,
}: {
  elderlyName: string;
  threads: FamilyChatThread[];
  loading: boolean;
  loadError: string | null;
  activeThreadId: string | null;
  onSelect: (id: string) => void;
  onCreate: (title: string) => Promise<void>;
}) {
  const [showNewModal, setShowNewModal] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <Button type="button" onClick={() => setShowNewModal(true)} className="w-full">
        + Nuevo chat
      </Button>

      <div className="mt-4 flex-1 space-y-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        )}

        {!loading && loadError && (
          <div className="mt-4 flex items-start gap-2 text-sm text-alert-urgent">
            <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
            {loadError}
          </div>
        )}

        {!loading && !loadError && threads.length === 0 && (
          <p className="mt-4 text-sm text-text-secondary">
            Crea tu primer chat para empezar a preguntar sobre {elderlyName}
          </p>
        )}

        {threads.map((thread, index) => (
          <button
            key={thread.id}
            type="button"
            onClick={() => onSelect(thread.id)}
            style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
            className={`step-fade w-full rounded-xl px-3 py-2.5 text-left transition-[background-color,transform] duration-150 hover:-translate-y-0.5 ${
              thread.id === activeThreadId
                ? "bg-primary-light"
                : "hover:bg-surface-alt"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium text-text-primary">
                {thread.title}
              </span>
              <span className="shrink-0 text-xs text-text-muted">
                {formatThreadDate(thread.updated_at)}
              </span>
            </div>
            {thread.last_message_preview && (
              <p className="mt-0.5 truncate text-xs text-text-secondary">
                {thread.last_message_preview}
              </p>
            )}
          </button>
        ))}
      </div>

      {showNewModal && (
        <NewThreadModal
          onClose={() => setShowNewModal(false)}
          onCreate={async (title) => {
            await onCreate(title);
            setShowNewModal(false);
          }}
        />
      )}
    </div>
  );
}

function ThreadConversation({
  elderlyId,
  thread,
  onBack,
  onRenamed,
  onDeleted,
  onMessageSent,
}: {
  elderlyId: string;
  thread: FamilyChatThread;
  onBack: () => void;
  onRenamed: (title: string) => void;
  onDeleted: () => void;
  onMessageSent: (preview: string) => void;
}) {
  const [messages, setMessages] = useState<FamilyChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(thread.title);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      const response = await apiFetch(
        `/api/elderly/${elderlyId}/chat?threadId=${thread.id}`
      );
      if (cancelled) return;

      if (!response) {
        setLoadError(NETWORK_ERROR_MESSAGE);
        setLoading(false);
        return;
      }
      if (!response.ok) {
        setLoadError("No se pudo cargar la conversación.");
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (cancelled) return;
      setMessages(data.messages ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [elderlyId, thread.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setError(null);
    setInput("");
    const tempId = makeTempId();
    setMessages((current) => [
      ...current,
      {
        id: tempId,
        elderly_id: elderlyId,
        thread_id: thread.id,
        user_id: null,
        role: "user",
        content: trimmed,
        created_at: new Date().toISOString(),
      },
    ]);
    setSending(true);

    const response = await apiFetch(`/api/elderly/${elderlyId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: thread.id, message: trimmed }),
    });

    setSending(false);

    if (!response) {
      setMessages((current) => current.filter((m) => m.id !== tempId));
      setError(NETWORK_ERROR_MESSAGE);
      setInput(trimmed);
      return;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.message) {
      // The message never actually sent — pull the optimistic bubble back
      // out rather than leaving it in the log looking delivered, and give
      // the family member their text back so they don't have to retype it.
      setMessages((current) => current.filter((m) => m.id !== tempId));
      setError(data?.error ?? "No se pudo enviar el mensaje");
      setInput(trimmed);
      return;
    }

    setMessages((current) => [...current, data.message]);
    onMessageSent(data.message.content);
  }

  async function handleRename() {
    const title = titleDraft.trim();
    if (!title || title === thread.title) {
      setRenaming(false);
      return;
    }
    const response = await apiFetch(
      `/api/elderly/${elderlyId}/chat-threads/${thread.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      }
    );

    setRenaming(false);

    if (!response) {
      setTitleDraft(thread.title);
      setError(NETWORK_ERROR_MESSAGE);
      return;
    }
    if (response.ok) {
      onRenamed(title);
    } else {
      setTitleDraft(thread.title);
      setError("No se pudo renombrar el chat. Inténtalo de nuevo.");
    }
  }

  async function handleDelete() {
    const response = await apiFetch(
      `/api/elderly/${elderlyId}/chat-threads/${thread.id}`,
      { method: "DELETE" }
    );

    if (!response) {
      setConfirmingDelete(false);
      setError(NETWORK_ERROR_MESSAGE);
      return;
    }
    if (response.ok) {
      onDeleted();
    } else {
      setConfirmingDelete(false);
      setError("No se pudo eliminar el chat. Inténtalo de nuevo.");
    }
  }

  return (
    <div className="step-fade flex h-[65vh] flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="Ver chats"
            className="-m-2 shrink-0 rounded-lg p-3 text-text-secondary hover:bg-surface-alt md:hidden"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          {renaming ? (
            <input
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleRename()}
              onBlur={handleRename}
              autoFocus
              className="w-full rounded-xl border border-primary px-2 py-1 text-base font-semibold text-text-primary focus:outline-none"
            />
          ) : (
            <h2 className="truncate text-base font-semibold text-text-primary">
              {thread.title}
            </h2>
          )}
        </div>

        {!renaming && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setRenaming(true)}
              aria-label="Renombrar chat"
              className="-m-2 rounded-lg p-3.5 text-text-muted transition-[transform,background-color,color] duration-200 hover:-translate-y-0.5 hover:scale-110 hover:bg-surface-alt hover:text-text-primary"
            >
              <Pencil className="h-4 w-4" />
            </button>
            {confirmingDelete ? (
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="text-text-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="font-medium text-alert-urgent"
                >
                  Sí, eliminar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                aria-label="Eliminar chat"
                className="-m-2 rounded-lg p-3.5 text-text-muted transition-[transform,background-color,color] duration-200 hover:-translate-y-0.5 hover:scale-110 hover:bg-surface-alt hover:text-alert-urgent"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
        </div>
      ) : loadError ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <AlertCircle aria-hidden className="h-8 w-8 text-alert-warning" strokeWidth={1.5} />
          <p className="mt-3 text-text-secondary">{loadError}</p>
        </div>
      ) : (
        <div
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Mensajes de la conversación"
          className="flex-1 space-y-3 overflow-y-auto px-1 py-3"
        >
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSend(suggestion)}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="step-fade rounded-full border border-primary bg-primary-light px-4 py-2 text-sm font-medium text-primary transition-transform duration-150 hover:-translate-y-0.5"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={message.id}
              style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
              className={`animate-message-in flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
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
      )}

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
          className={`flex-1 ${fieldClasses}`}
        />
        <button
          type="button"
          onClick={() => handleSend(input)}
          disabled={sending || !input.trim()}
          aria-label="Enviar mensaje"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:pointer-events-none disabled:translate-y-0 disabled:bg-surface-alt disabled:text-text-muted"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default function Chat({
  elderlyId,
  elderlyName,
}: {
  elderlyId: string;
  elderlyName: string;
}) {
  const [threads, setThreads] = useState<FamilyChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [showListOnMobile, setShowListOnMobile] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      const response = await apiFetch(`/api/elderly/${elderlyId}/chat-threads`);
      if (cancelled) return;

      if (!response) {
        setLoadError(NETWORK_ERROR_MESSAGE);
        setLoading(false);
        return;
      }
      if (!response.ok) {
        setLoadError("No se pudieron cargar los chats.");
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (cancelled) return;
      setThreads(data.threads ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [elderlyId]);

  async function handleCreateThread(title: string) {
    const response = await apiFetch(`/api/elderly/${elderlyId}/chat-threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!response) throw new Error(NETWORK_ERROR_MESSAGE);
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.thread) {
      throw new Error(data?.error ?? "No se pudo crear el chat");
    }
    setThreads((current) => [data.thread, ...current]);
    setActiveThreadId(data.thread.id);
    setShowListOnMobile(false);
  }

  function handleSelectThread(id: string) {
    setActiveThreadId(id);
    setShowListOnMobile(false);
  }

  function handleRenamed(title: string) {
    setThreads((current) =>
      current.map((t) => (t.id === activeThreadId ? { ...t, title } : t))
    );
  }

  function handleDeleted() {
    setThreads((current) => current.filter((t) => t.id !== activeThreadId));
    setActiveThreadId(null);
    setShowListOnMobile(true);
  }

  function handleMessageSent(preview: string) {
    setThreads((current) => {
      const updated = current.map((t) =>
        t.id === activeThreadId
          ? { ...t, last_message_preview: preview, updated_at: new Date().toISOString() }
          : t
      );
      return updated.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
  }

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;

  return (
    <div className="flex gap-6">
      <div
        className={`w-full shrink-0 md:block md:w-[280px] ${
          showListOnMobile ? "block" : "hidden"
        }`}
      >
        <ThreadList
          elderlyName={elderlyName}
          threads={threads}
          loading={loading}
          loadError={loadError}
          activeThreadId={activeThreadId}
          onSelect={handleSelectThread}
          onCreate={handleCreateThread}
        />
      </div>

      <div className={`min-w-0 flex-1 ${showListOnMobile ? "hidden md:block" : "block"}`}>
        {activeThread ? (
          <ThreadConversation
            key={activeThread.id}
            elderlyId={elderlyId}
            thread={activeThread}
            onBack={() => setShowListOnMobile(true)}
            onRenamed={handleRenamed}
            onDeleted={handleDeleted}
            onMessageSent={handleMessageSent}
          />
        ) : (
          <div className="flex h-[65vh] flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="text-text-secondary">
              Selecciona un chat o crea uno nuevo para empezar a preguntar
              sobre {elderlyName}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
