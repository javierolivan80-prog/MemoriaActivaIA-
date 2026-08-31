"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Reveal from "@/components/ui/Reveal";
import { prefersReducedMotion } from "@/lib/motion";
import { apiFetch, NETWORK_ERROR_MESSAGE } from "@/lib/apiFetch";
import { isValidSpanishPhone } from "@/lib/validation";
import type { ElderlyProfile } from "@/types";

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function EditProfileForm({
  profile,
}: {
  profile: ElderlyProfile;
}) {
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(String(profile.age ?? ""));
  const [phone, setPhone] = useState(profile.phone_number);
  const [active, setActive] = useState(profile.active);
  const [familyText, setFamilyText] = useState(
    typeof profile.family_info.description === "string"
      ? profile.family_info.description
      : ""
  );
  const [hobbiesText, setHobbiesText] = useState(profile.hobbies.join(", "));
  const [routinesText, setRoutinesText] = useState(
    profile.routines.join(", ")
  );
  const [favoriteTopicsText, setFavoriteTopicsText] = useState(
    profile.favorite_topics.join(", ")
  );
  const [sensitiveTopicsText, setSensitiveTopicsText] = useState(
    profile.sensitive_topics.join(", ")
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!isValidSpanishPhone(phone)) {
      setError("El teléfono no parece un número español válido.");
      return;
    }

    setSaving(true);
    setError(null);

    const hobbiesList = splitList(hobbiesText);

    const response = await apiFetch(`/api/elderly/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        age: age ? Number(age) : null,
        phone_number: phone.replace(/\s+/g, ""),
        active,
        family_info: { ...profile.family_info, description: familyText },
        interests: hobbiesList,
        hobbies: hobbiesList,
        routines: splitList(routinesText),
        favorite_topics: splitList(favoriteTopicsText),
        sensitive_topics: splitList(sensitiveTopicsText),
      }),
    });

    setSaving(false);

    if (!response) {
      setError(NETWORK_ERROR_MESSAGE);
      return;
    }

    if (!response.ok) {
      setError("No se pudo guardar el perfil. Inténtalo de nuevo.");
      return;
    }

    setSaved(true);
    await new Promise((resolve) =>
      setTimeout(resolve, prefersReducedMotion() ? 0 : 600)
    );

    router.push(`/elderly/${profile.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-12">
      <Reveal>
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
          Datos básicos
        </h2>
        <div className="mt-5 space-y-5">
          <Input
            label="Nombre completo"
            name="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            label="Edad"
            name="age"
            type="number"
            min={40}
            max={120}
            value={age}
            onChange={(event) => setAge(event.target.value)}
          />
          <Input
            label="Teléfono"
            name="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            hint="Número español: empieza por 6, 7, 8 o 9"
            error={
              phone.trim() && !isValidSpanishPhone(phone)
                ? "Ese número no parece válido. Debe ser un móvil español de 9 dígitos."
                : undefined
            }
          />

          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Perfil activo (recibe llamadas)
          </label>
        </div>
      </Reveal>

      <Reveal delay={60}>
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
          Cómo es {profile.name.split(" ")[0]}
        </h2>
        <div className="mt-5 space-y-5">
          <Textarea
            label="Familia"
            name="family"
            rows={2}
            value={familyText}
            onChange={(event) => setFamilyText(event.target.value)}
          />
          <Input
            label="Intereses y hobbies"
            name="hobbies"
            value={hobbiesText}
            onChange={(event) => setHobbiesText(event.target.value)}
            hint="Separados por comas"
          />
          <Input
            label="Rutina"
            name="routines"
            value={routinesText}
            onChange={(event) => setRoutinesText(event.target.value)}
            hint="Separados por comas"
          />
          <Input
            label="Temas favoritos"
            name="favorite-topics"
            value={favoriteTopicsText}
            onChange={(event) => setFavoriteTopicsText(event.target.value)}
            hint="Separados por comas"
          />
        </div>
      </Reveal>

      <Reveal delay={120}>
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Privacidad</h2>
        <div className="mt-5">
          <Textarea
            label="Temas sensibles"
            name="sensitive"
            rows={3}
            value={sensitiveTopicsText}
            onChange={(event) => setSensitiveTopicsText(event.target.value)}
            hint="Separados por comas"
          />
        </div>
      </Reveal>

      {error && (
        <div className="rounded-xl bg-alert-urgent-bg p-4 text-sm text-alert-urgent">
          {error}
        </div>
      )}

      <div className="flex gap-3 border-t border-border pt-8">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/elderly/${profile.id}`)}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving || saved || !name.trim() || !isValidSpanishPhone(phone)}
          className="flex-1"
        >
          {saved ? (
            <>
              <CheckCircle className="animate-pop-in h-4 w-4" />
              Guardado
            </>
          ) : saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </div>
  );
}
