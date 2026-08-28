"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
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
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const hobbiesList = splitList(hobbiesText);

    const response = await fetch(`/api/elderly/${profile.id}`, {
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

    if (!response.ok) {
      setError("No se pudo guardar el perfil. Inténtalo de nuevo.");
      return;
    }

    router.push(`/elderly/${profile.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-5">
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
      <Textarea
        label="Temas sensibles"
        name="sensitive"
        rows={3}
        value={sensitiveTopicsText}
        onChange={(event) => setSensitiveTopicsText(event.target.value)}
        hint="Separados por comas"
      />

      {error && (
        <div className="rounded-xl bg-alert-urgent-bg p-4 text-sm text-alert-urgent">
          {error}
        </div>
      )}

      <div className="flex gap-3">
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
          disabled={saving || !name.trim()}
          className="flex-1"
        >
          {saving ? (
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
