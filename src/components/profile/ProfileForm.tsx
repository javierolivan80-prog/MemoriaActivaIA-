"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "manual" | "ai";

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

interface ParsedProfile {
  name: string;
  age: number | null;
  phone_number: string | null;
  family_info: string;
  interests: string[];
  hobbies: string[];
  routines: string[];
  favorite_topics: string[];
  sensitive_topics: string[];
}

export default function ProfileForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("manual");

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [age, setAge] = useState("");
  const [family, setFamily] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [routines, setRoutines] = useState("");
  const [favoriteTopics, setFavoriteTopics] = useState("");
  const [sensitiveTopics, setSensitiveTopics] = useState("");

  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiApplied, setAiApplied] = useState(false);

  async function handleProcessWithAI() {
    setError(null);
    setProcessing(true);

    const response = await fetch("/api/onboarding/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });

    const data = await response.json();
    setProcessing(false);

    if (!response.ok) {
      setError(data.error ?? "No se pudo procesar el texto.");
      return;
    }

    const parsed = data as ParsedProfile;

    if (parsed.name) setName(parsed.name);
    if (parsed.age !== null && parsed.age !== undefined) {
      setAge(String(parsed.age));
    }
    if (parsed.phone_number) setPhoneNumber(parsed.phone_number);
    if (parsed.family_info) setFamily(parsed.family_info);
    setHobbies([...parsed.interests, ...parsed.hobbies].join(", "));
    setRoutines(parsed.routines.join(", "));
    setFavoriteTopics(parsed.favorite_topics.join(", "));
    setSensitiveTopics(parsed.sensitive_topics.join(", "));
    setAiApplied(true);
    setMode("manual");
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      setError("Tu sesión ha caducado. Inicia sesión de nuevo.");
      return;
    }

    const interestsAndHobbies = splitList(hobbies);

    const { error: insertError } = await supabase.from("elderly_profiles").insert({
      user_id: user.id,
      name,
      phone_number: phoneNumber,
      age: age ? Number(age) : null,
      family_info: { description: family },
      interests: interestsAndHobbies,
      hobbies: interestsAndHobbies,
      routines: splitList(routines),
      favorite_topics: splitList(favoriteTopics),
      sensitive_topics: splitList(sensitiveTopics),
    });

    setSaving(false);

    if (insertError) {
      setError("No se pudo guardar el perfil. Inténtalo de nuevo.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex-1 rounded-md px-4 py-2 text-base font-medium transition ${
            mode === "manual"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600"
          }`}
        >
          Formulario manual
        </button>
        <button
          type="button"
          onClick={() => setMode("ai")}
          className={`flex-1 rounded-md px-4 py-2 text-base font-medium transition ${
            mode === "ai" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
          }`}
        >
          Contarnos con IA
        </button>
      </div>

      {mode === "ai" && (
        <div className="space-y-4 rounded-xl border border-gray-200 p-6">
          <div>
            <label
              htmlFor="ai-name"
              className="block text-lg font-medium text-gray-900"
            >
              Nombre
            </label>
            <input
              id="ai-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="Nombre de tu familiar"
            />
          </div>

          <div>
            <label
              htmlFor="transcript"
              className="block text-lg font-medium text-gray-900"
            >
              Cuéntanos cómo es {name || "tu familiar"}
            </label>
            <textarea
              id="transcript"
              rows={8}
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="Le encanta la jardinería, vive sola desde..., llama todos los domingos a sus nietos..."
            />
          </div>

          {error && <p className="text-base text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleProcessWithAI}
            disabled={processing || !transcript.trim()}
            className="w-full rounded-lg bg-gray-900 px-4 py-3 text-lg font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {processing ? "Procesando..." : "Procesar con IA"}
          </button>
        </div>
      )}

      {mode === "manual" && (
        <form onSubmit={handleSave} className="space-y-6">
          {aiApplied && (
            <p className="rounded-lg bg-green-50 px-4 py-3 text-base text-green-700">
              Hemos rellenado el formulario con lo que nos has contado. Revisa
              y completa lo que falte.
            </p>
          )}

          <div>
            <label
              htmlFor="name"
              className="block text-lg font-medium text-gray-900"
            >
              Nombre
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-lg font-medium text-gray-900"
              >
                Teléfono
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
            <div>
              <label
                htmlFor="age"
                className="block text-lg font-medium text-gray-900"
              >
                Edad
              </label>
              <input
                id="age"
                type="number"
                min={0}
                max={120}
                value={age}
                onChange={(event) => setAge(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="family"
              className="block text-lg font-medium text-gray-900"
            >
              Familia
            </label>
            <textarea
              id="family"
              rows={2}
              value={family}
              onChange={(event) => setFamily(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="Cónyuge, hijos, nietos..."
            />
          </div>

          <div>
            <label
              htmlFor="hobbies"
              className="block text-lg font-medium text-gray-900"
            >
              Intereses y hobbies
            </label>
            <input
              id="hobbies"
              type="text"
              value={hobbies}
              onChange={(event) => setHobbies(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="Separados por comas: jardinería, cocina, fútbol"
            />
          </div>

          <div>
            <label
              htmlFor="routines"
              className="block text-lg font-medium text-gray-900"
            >
              Rutina
            </label>
            <input
              id="routines"
              type="text"
              value={routines}
              onChange={(event) => setRoutines(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="Separados por comas: se levanta a las 8, paseo por la tarde"
            />
          </div>

          <div>
            <label
              htmlFor="favorite-topics"
              className="block text-lg font-medium text-gray-900"
            >
              Temas favoritos
            </label>
            <input
              id="favorite-topics"
              type="text"
              value={favoriteTopics}
              onChange={(event) => setFavoriteTopics(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="Separados por comas: nietos, fútbol, recetas"
            />
          </div>

          <div>
            <label
              htmlFor="sensitive-topics"
              className="block text-lg font-medium text-gray-900"
            >
              Temas sensibles
            </label>
            <input
              id="sensitive-topics"
              type="text"
              value={sensitiveTopics}
              onChange={(event) => setSensitiveTopics(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="Separados por comas: fallecimiento de su marido, dinero"
            />
          </div>

          {error && <p className="text-base text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-gray-900 px-4 py-3 text-lg font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar perfil"}
          </button>
        </form>
      )}
    </div>
  );
}
