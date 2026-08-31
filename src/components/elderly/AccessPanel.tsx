"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Reveal from "@/components/ui/Reveal";
import { apiFetch, NETWORK_ERROR_MESSAGE } from "@/lib/apiFetch";
import type { ElderlyAccessRole, ElderlyAccessStatus } from "@/types";

interface AccessRow {
  id: string;
  role: ElderlyAccessRole;
  status: ElderlyAccessStatus;
  email: string | null;
  created_at: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function InviteModal({
  elderlyId,
  onClose,
  onInvited,
}: {
  elderlyId: string;
  onClose: () => void;
  onInvited: (row: AccessRow) => void;
}) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email.trim()) {
      setError("Introduce un email");
      return;
    }
    setSending(true);
    setError(null);

    const response = await apiFetch(`/api/elderly/${elderlyId}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });

    setSending(false);

    if (!response) {
      setError(NETWORK_ERROR_MESSAGE);
      return;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setError(data?.error ?? "No se pudo enviar la invitación");
      return;
    }

    if (!data?.access) {
      setError("No se pudo enviar la invitación");
      return;
    }

    onInvited(data.access);
  }

  return (
    <Modal onClose={onClose} labelledBy="invite-modal-title">
      <h2 id="invite-modal-title" className="text-lg font-semibold text-text-primary">
        Invitar a alguien
      </h2>
      <div className="mt-4">
        <Input
          label="Email"
          name="invite-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="familiar@email.com"
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
          onClick={handleSubmit}
          disabled={sending}
          className="flex-1"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar invitación"
          )}
        </Button>
      </div>
    </Modal>
  );
}

export default function AccessPanel({ elderlyId }: { elderlyId: string }) {
  const [rows, setRows] = useState<AccessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      const response = await apiFetch(`/api/elderly/${elderlyId}/access`);
      if (cancelled) return;

      if (!response) {
        setLoadError(NETWORK_ERROR_MESSAGE);
        setLoading(false);
        return;
      }
      if (!response.ok) {
        setLoadError("No se pudo cargar la lista de acceso.");
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (cancelled) return;
      setRows(data.access ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [elderlyId]);

  async function handleDelete(accessId: string) {
    setDeletingId(accessId);
    setDeleteError(null);
    const response = await apiFetch(
      `/api/elderly/${elderlyId}/access?accessId=${accessId}`,
      { method: "DELETE" }
    );

    if (!response) {
      setDeleteError(NETWORK_ERROR_MESSAGE);
      setDeletingId(null);
      return;
    }
    if (response.ok) {
      setRows((current) => current.filter((row) => row.id !== accessId));
      setConfirmingId(null);
    } else {
      setDeleteError("No se pudo eliminar el acceso. Inténtalo de nuevo.");
    }
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <AlertCircle aria-hidden className="mx-auto h-8 w-8 text-alert-warning" strokeWidth={1.5} />
        <p className="mt-3 text-text-secondary">{loadError}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
          Personas con acceso
        </h2>
        <Button type="button" onClick={() => setShowInviteModal(true)}>
          + Invitar a alguien
        </Button>
      </div>

      {deleteError && (
        <p className="mt-3 text-sm text-alert-urgent" role="alert">
          {deleteError}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {rows.map((row, index) => (
          <Reveal key={row.id} delay={index * 60}>
          <div
            className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-soft"
          >
            <div>
              <p className="text-sm font-medium text-text-primary">
                {row.email ?? "Sin email"}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    row.role === "owner"
                      ? "bg-primary-light text-primary"
                      : "bg-secondary-light text-text-primary"
                  }`}
                >
                  {row.role === "owner" ? "Propietario" : "Colaborador"}
                </span>
                {row.status === "pending" && (
                  <span className="rounded-full bg-alert-warning-bg px-2.5 py-0.5 text-xs font-medium text-alert-warning">
                    Invitación pendiente
                  </span>
                )}
                <span className="text-xs text-text-muted">
                  Desde {formatDate(row.created_at)}
                </span>
              </div>
            </div>

            {row.role !== "owner" && (
              <div>
                {confirmingId === row.id ? (
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="text-text-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id)}
                      disabled={deletingId === row.id}
                      className="font-medium text-alert-urgent"
                    >
                      {deletingId === row.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Sí, eliminar"
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(row.id)}
                    aria-label="Eliminar acceso"
                    className="-m-3.5 rounded-lg p-3.5 text-text-muted transition-colors hover:bg-surface-alt hover:text-alert-urgent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
          </Reveal>
        ))}
      </div>

      {showInviteModal && (
        <InviteModal
          elderlyId={elderlyId}
          onClose={() => setShowInviteModal(false)}
          onInvited={(row) => {
            setRows((current) => [...current, row]);
            setShowInviteModal(false);
          }}
        />
      )}
    </div>
  );
}
