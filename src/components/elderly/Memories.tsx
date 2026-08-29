"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AlertCircle, Image as ImageIcon, Loader2, Trash2, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Reveal from "@/components/ui/Reveal";
import { apiFetch, NETWORK_ERROR_MESSAGE } from "@/lib/apiFetch";
interface PhotoWithUrl {
  id: string;
  caption: string;
  people_in_photo: string | null;
  created_at: string;
  signed_url: string | null;
  can_delete: boolean;
}

function AddPhotoModal({
  elderlyId,
  onClose,
  onUploaded,
}: {
  elderlyId: string;
  onClose: () => void;
  onUploaded: (photo: PhotoWithUrl) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [people, setPeople] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleUpload() {
    if (!file) {
      setError("Selecciona una foto");
      return;
    }
    if (!caption.trim()) {
      setError("Cuéntanos qué se ve en la foto");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("caption", caption.trim());
    if (people.trim()) formData.append("people_in_photo", people.trim());

    const response = await apiFetch(`/api/elderly/${elderlyId}/photos`, {
      method: "POST",
      body: formData,
    });

    setUploading(false);

    if (!response) {
      setError(NETWORK_ERROR_MESSAGE);
      return;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setError(data?.error ?? "No se pudo subir la foto");
      return;
    }

    if (!data?.photo) {
      setError("No se pudo subir la foto");
      return;
    }

    onUploaded(data.photo);
  }

  return (
    <Modal
      onClose={onClose}
      labelledBy="add-photo-modal-title"
      contentClassName="w-full max-w-md rounded-2xl bg-surface p-6 shadow-soft"
    >
      <div className="flex items-center justify-between">
        <h2 id="add-photo-modal-title" className="font-serif text-2xl text-text-primary">
          Añadir foto
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="-m-3 rounded-lg p-3 text-text-muted transition-colors hover:bg-surface-alt hover:text-text-primary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {preview ? (
          <img
            src={preview}
            alt="Vista previa"
            className="aspect-square w-full rounded-xl object-cover"
          />
        ) : (
          <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-text-muted">
            <ImageIcon className="h-10 w-10" strokeWidth={1.5} />
            <span className="mt-2 text-sm">Elegir foto</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}

        {preview && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setPreview(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="text-sm font-medium text-primary"
          >
            Cambiar foto
          </button>
        )}

        <Input
          label="¿Qué se ve en la foto?"
          name="caption"
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="Ej: Comida familiar en Navidad"
        />

        <Input
          label="¿Quién aparece? (opcional)"
          name="people"
          value={people}
          onChange={(event) => setPeople(event.target.value)}
          placeholder="Ej: Carmen, sus nietos Ana y Luis"
        />

        {error && (
          <div className="rounded-xl bg-alert-urgent-bg p-3 text-sm text-alert-urgent">
            {error}
          </div>
        )}

        <Button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            "Subir foto"
          )}
        </Button>
      </div>
    </Modal>
  );
}

function Lightbox({
  photo,
  onClose,
}: {
  photo: PhotoWithUrl;
  onClose: () => void;
}) {
  return (
    <Modal
      onClose={onClose}
      backdrop="dark"
      labelledBy="lightbox-caption"
      contentClassName="w-full max-w-lg rounded-2xl bg-surface p-4 shadow-soft"
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="-m-3 rounded-lg p-3 text-text-muted transition-colors hover:bg-surface-alt hover:text-text-primary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {photo.signed_url && (
        <img
          src={photo.signed_url}
          alt={photo.caption}
          className="max-h-[60vh] w-full rounded-xl object-contain"
        />
      )}
      <p id="lightbox-caption" className="mt-4 text-base text-text-primary">
        {photo.caption}
      </p>
      {photo.people_in_photo && (
        <p className="mt-1 text-sm text-text-secondary">
          {photo.people_in_photo}
        </p>
      )}
    </Modal>
  );
}

export default function Memories({
  elderlyId,
  canAdd,
}: {
  elderlyId: string;
  canAdd: boolean;
}) {
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoWithUrl | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      const response = await apiFetch(`/api/elderly/${elderlyId}/photos`);
      if (cancelled) return;

      if (!response) {
        setLoadError(NETWORK_ERROR_MESSAGE);
        setLoading(false);
        return;
      }
      if (!response.ok) {
        setLoadError("No se pudieron cargar las fotos.");
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (cancelled) return;
      setPhotos(data.photos ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [elderlyId]);

  async function handleDelete(photoId: string) {
    setDeletingId(photoId);
    setDeleteError(null);
    const response = await apiFetch(
      `/api/elderly/${elderlyId}/photos/${photoId}`,
      { method: "DELETE" }
    );

    if (!response) {
      setDeleteError(NETWORK_ERROR_MESSAGE);
      setDeletingId(null);
      return;
    }
    if (response.ok) {
      setPhotos((current) => current.filter((photo) => photo.id !== photoId));
    } else {
      setDeleteError("No se pudo eliminar la foto. Inténtalo de nuevo.");
    }
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mt-6 grid animate-pulse grid-cols-2 gap-4 md:grid-cols-4"
      >
        <span className="sr-only">Cargando fotos...</span>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-square rounded-xl bg-surface-alt" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mt-6 rounded-2xl border border-border bg-surface p-12 text-center">
        <AlertCircle
          aria-hidden
          className="mx-auto h-10 w-10 text-alert-warning"
          strokeWidth={1.5}
        />
        <p className="mt-4 text-lg text-text-secondary">{loadError}</p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.location.reload()}
          className="mt-5"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div>
      {canAdd && (
        <div className="flex justify-end">
          <Button type="button" onClick={() => setShowAddModal(true)}>
            + Añadir foto
          </Button>
        </div>
      )}

      {deleteError && (
        <p className="mt-3 text-sm text-alert-urgent" role="alert">
          {deleteError}
        </p>
      )}

      {photos.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-12 text-center">
          <ImageIcon
            className="mx-auto h-12 w-12 text-text-muted"
            strokeWidth={1.5}
          />
          <p className="mt-4 text-lg text-text-secondary">
            Aún no hay fotos. Añade la primera para que la IA pueda hablar de
            vuestros recuerdos
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {photos.map((photo, index) => (
            <Reveal key={photo.id} delay={Math.min(index, 8) * 50}>
            <div
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl shadow-soft"
              onClick={() => setLightboxPhoto(photo)}
            >
              {photo.signed_url && (
                <Image
                  src={photo.signed_url}
                  alt={photo.caption}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/40" />
              {photo.can_delete && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDelete(photo.id);
                  }}
                  disabled={deletingId === photo.id}
                  aria-label="Eliminar foto"
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/50 p-3.5 text-white opacity-70 transition-opacity duration-200 hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
                >
                  {deletingId === photo.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            </Reveal>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddPhotoModal
          elderlyId={elderlyId}
          onClose={() => setShowAddModal(false)}
          onUploaded={(photo) => {
            setPhotos((current) => [photo, ...current]);
            setShowAddModal(false);
          }}
        />
      )}

      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          onClose={() => setLightboxPhoto(null)}
        />
      )}
    </div>
  );
}
