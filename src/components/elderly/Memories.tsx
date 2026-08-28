"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Trash2, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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

    const response = await fetch(`/api/elderly/${elderlyId}/photos`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();

    setUploading(false);

    if (!response.ok) {
      setError(data.error ?? "No se pudo subir la foto");
      return;
    }

    onUploaded(data.photo);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            Añadir foto
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-text-muted"
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
      </div>
    </div>
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-surface p-4 shadow-soft"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-text-muted"
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
        <p className="mt-4 text-base text-text-primary">{photo.caption}</p>
        {photo.people_in_photo && (
          <p className="mt-1 text-sm text-text-secondary">
            {photo.people_in_photo}
          </p>
        )}
      </div>
    </div>
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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const response = await fetch(`/api/elderly/${elderlyId}/photos`);
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
    const response = await fetch(
      `/api/elderly/${elderlyId}/photos/${photoId}`,
      { method: "DELETE" }
    );
    if (response.ok) {
      setPhotos((current) => current.filter((photo) => photo.id !== photoId));
    }
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
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
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl"
              onClick={() => setLightboxPhoto(photo)}
            >
              {photo.signed_url && (
                <img
                  src={photo.signed_url}
                  alt={photo.caption}
                  className="h-full w-full object-cover"
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
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                >
                  {deletingId === photo.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
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
