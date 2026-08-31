"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Pencil,
  Phone,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import ProgressBar from "@/components/ui/ProgressBar";
import { prefersReducedMotion } from "@/lib/motion";
import { isValidSpanishPhone } from "@/lib/validation";
import { apiFetch, NETWORK_ERROR_MESSAGE } from "@/lib/apiFetch";

const TOTAL_STEPS = 6;

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

interface ParsedProfile {
  family_info: string;
  interests: string[];
  hobbies: string[];
  routines: string[];
  favorite_topics: string[];
  sensitive_topics: string[];
}

async function parseTranscript(transcript: string) {
  const response = await apiFetch("/api/onboarding/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript }),
  });
  if (!response) {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? "No se pudo procesar el texto.");
  }
  return data as ParsedProfile;
}

export default function OnboardingWizard({
  hasCompletoPlan,
}: {
  hasCompletoPlan: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");

  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const [aiProcessed, setAiProcessed] = useState(false);
  const [familyText, setFamilyText] = useState("");
  const [hobbiesText, setHobbiesText] = useState("");
  const [routinesText, setRoutinesText] = useState("");
  const [favoriteTopicsText, setFavoriteTopicsText] = useState("");
  const [aiSensitiveTopics, setAiSensitiveTopics] = useState<string[]>([]);

  const [sensitiveNote, setSensitiveNote] = useState("");

  const [callTime1, setCallTime1] = useState("11:00");
  const [callTime2, setCallTime2] = useState("18:00");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = nickname.trim() || name.trim() || "tu familiar";

  const canContinue = {
    1: name.trim().length > 0,
    2: Number(age) >= 40 && Number(age) <= 120,
    3: isValidSpanishPhone(phone),
    4: transcript.trim().length > 0,
    5: true,
    6: true,
  }[step as 1 | 2 | 3 | 4 | 5 | 6];

  function goToStep(target: number) {
    setError(null);
    setDirection(target < step ? "back" : "forward");
    setStep(target);
  }

  function goNext() {
    goToStep(Math.min(step + 1, 7));
  }

  function goBack() {
    goToStep(Math.max(step - 1, 1));
  }

  async function handleProcessWithAI() {
    setError(null);
    setProcessing(true);
    try {
      const parsed = await parseTranscript(transcript);
      setFamilyText(parsed.family_info || "");
      setHobbiesText(
        [...(parsed.interests ?? []), ...(parsed.hobbies ?? [])].join(", ")
      );
      setRoutinesText((parsed.routines ?? []).join(", "));
      setFavoriteTopicsText((parsed.favorite_topics ?? []).join(", "));
      setAiSensitiveTopics(parsed.sensitive_topics ?? []);
      setAiProcessed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo procesar el texto.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    let finalFamily = familyText;
    let finalHobbies = hobbiesText;
    let finalRoutines = routinesText;
    let finalFavoriteTopics = favoriteTopicsText;
    let finalAiSensitive = aiSensitiveTopics;

    if (!aiProcessed && transcript.trim()) {
      try {
        const parsed = await parseTranscript(transcript);
        finalFamily = parsed.family_info || "";
        finalHobbies = [
          ...(parsed.interests ?? []),
          ...(parsed.hobbies ?? []),
        ].join(", ");
        finalRoutines = (parsed.routines ?? []).join(", ");
        finalFavoriteTopics = (parsed.favorite_topics ?? []).join(", ");
        finalAiSensitive = parsed.sensitive_topics ?? [];
      } catch {
        // If the AI is unavailable, fall back to the raw text as the family
        // description rather than losing what the user wrote.
        finalFamily = finalFamily || transcript;
      }
    }

    const combinedSensitiveTopics = [
      ...finalAiSensitive,
      ...(sensitiveNote.trim() ? [sensitiveNote.trim()] : []),
    ];

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      setError("Tu sesión ha caducado. Inicia sesión de nuevo.");
      return;
    }

    const hobbiesAndInterests = splitList(finalHobbies);
    const cleanedPhone = phone.replace(/\s+/g, "");

    const { data: createdProfile, error: insertError } = await supabase
      .from("elderly_profiles")
      .insert({
        user_id: user.id,
        name: name.trim(),
        phone_number: cleanedPhone,
        age: Number(age),
        family_info: {
          description: finalFamily,
          nickname: nickname.trim() || null,
        },
        interests: hobbiesAndInterests,
        hobbies: hobbiesAndInterests,
        routines: splitList(finalRoutines),
        favorite_topics: splitList(finalFavoriteTopics),
        sensitive_topics: combinedSensitiveTopics,
        preferred_call_time: `${callTime1}:00`,
      })
      .select("id")
      .single();

    setSaving(false);

    if (insertError || !createdProfile) {
      setError("No se pudo guardar el perfil. Inténtalo de nuevo.");
      return;
    }

    // Best-effort: if the family already has an active "familiar" plan
    // with room, this profile is covered immediately — no separate
    // "elige plan" step for the family member to remember later. A
    // family plan not existing (or being full) is the normal case, not
    // an error, so its failure is silently ignored here.
    await apiFetch(`/api/elderly/${createdProfile.id}/attach-family-plan`, {
      method: "POST",
    });

    setSaved(true);
    await new Promise((resolve) =>
      setTimeout(resolve, prefersReducedMotion() ? 0 : 650)
    );

    router.push("/dashboard?created=success");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <ProgressBar step={Math.min(step, TOTAL_STEPS)} totalSteps={TOTAL_STEPS} />

      <div className="mt-6 min-h-[2rem]">
        {step > 1 && (
          <button
            type="button"
            onClick={goBack}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Atrás
          </button>
        )}
      </div>

      <div
        key={step}
        className="step-slide mt-4"
        style={{ "--step-dir": direction === "back" ? "-16px" : "16px" } as CSSProperties}
      >
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              ¿Cómo se llama tu familiar?
            </h1>
            <p className="mt-2 text-text-secondary">
              Así es como la IA le llamará en cada conversación
            </p>

            <div className="mt-8 space-y-5">
              <Input
                label="Nombre completo"
                name="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Input
                label="¿Cómo le gusta que le llamen?"
                name="nickname"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="Ej: Manolo, Yaya Pepa, Tío Antonio"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              ¿Cuántos años tiene {displayName}?
            </h1>
            <p className="mt-2 text-text-secondary">
              Nos ayuda a adaptar el tono de las conversaciones
            </p>

            <div className="mt-8">
              <Input
                label="Edad"
                name="age"
                type="number"
                min={40}
                max={120}
                required
                value={age}
                onChange={(event) => setAge(event.target.value)}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              ¿A qué número le llamamos?
            </h1>
            <p className="mt-2 text-text-secondary">
              Le llamaremos desde nuestro número cada día a este teléfono
            </p>

            <div className="animate-pop-in mx-auto mt-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary-light">
              <Phone className="h-9 w-9 text-primary" strokeWidth={1.5} />
            </div>

            <div className="mt-8">
              <Input
                label="Teléfono"
                name="phone"
                type="tel"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="600 123 456"
                hint="Número español: empieza por 6, 7, 8 o 9"
                error={
                  phone.trim() && !isValidSpanishPhone(phone)
                    ? "Ese número no parece válido. Debe ser un móvil español de 9 dígitos."
                    : undefined
                }
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              Cuéntanos cómo es {displayName}
            </h1>
            <p className="mt-2 text-text-secondary">
              Cuanto más nos cuentes, más natural será la conversación. No te
              preocupes por el orden, escribe como si se lo contaras a un
              amigo
            </p>

            <div className="mt-6">
              <Textarea
                label="Su historia, en tus palabras"
                name="transcript"
                rows={7}
                value={transcript}
                onChange={(event) => setTranscript(event.target.value)}
                placeholder="Por ejemplo: Le encanta el fútbol y no se pierde un partido del Atleti. Tiene 3 nietos: Ana, Luis y Marta, y siempre pregunta por ellos. Fue maestro de primaria toda su vida y le gusta hablar de aquella época. Todas las tardes sale a dar un paseo si hace bueno..."
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleProcessWithAI}
              disabled={processing || !transcript.trim()}
              className="mt-4 w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                  Procesar con IA
                </>
              )}
            </Button>

            {aiProcessed && (
              <div className="mt-6 space-y-4">
                <p className="step-fade flex items-center gap-2 rounded-xl bg-secondary-light px-4 py-3 text-sm text-text-primary">
                  <CheckCircle className="animate-pop-in h-4 w-4 shrink-0 text-secondary" />
                  Esto es lo que hemos entendido. Corrígelo si algo no
                  cuadra.
                </p>
                <div className="step-fade" style={{ animationDelay: "70ms" }}>
                  <Textarea
                    label="Familia"
                    name="family"
                    rows={2}
                    value={familyText}
                    onChange={(event) => setFamilyText(event.target.value)}
                  />
                </div>
                <div className="step-fade" style={{ animationDelay: "120ms" }}>
                  <Input
                    label="Intereses y hobbies"
                    name="hobbies"
                    value={hobbiesText}
                    onChange={(event) => setHobbiesText(event.target.value)}
                    hint="Separados por comas"
                  />
                </div>
                <div className="step-fade" style={{ animationDelay: "170ms" }}>
                  <Input
                    label="Rutina"
                    name="routines"
                    value={routinesText}
                    onChange={(event) => setRoutinesText(event.target.value)}
                    hint="Separados por comas"
                  />
                </div>
                <div className="step-fade" style={{ animationDelay: "220ms" }}>
                  <Input
                    label="Temas favoritos"
                    name="favorite-topics"
                    value={favoriteTopicsText}
                    onChange={(event) =>
                      setFavoriteTopicsText(event.target.value)
                    }
                    hint="Separados por comas"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              ¿Hay algo que debamos saber?
            </h1>
            <p className="mt-2 text-text-secondary">
              Esto nos ayuda a evitar temas delicados durante las llamadas. Es
              totalmente opcional
            </p>

            <div className="mt-6">
              <Textarea
                label="Temas sensibles"
                name="sensitive"
                rows={5}
                value={sensitiveNote}
                onChange={(event) => setSensitiveNote(event.target.value)}
                placeholder="Por ejemplo: perdió a su mujer hace un año, tiene principio de Parkinson, prefiere no hablar de política o de su antiguo trabajo..."
              />
            </div>

            {!sensitiveNote.trim() && (
              <button
                type="button"
                onClick={goNext}
                className="mt-4 block text-sm font-medium text-text-secondary underline underline-offset-4"
              >
                Prefiero no decir nada, continuar
              </button>
            )}
          </div>
        )}

        {step === 6 && (
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              ¿A qué hora prefieres que le llamemos?
            </h1>
            <p className="mt-2 text-text-secondary">
              Intentaremos llamar siempre a esta hora
            </p>

            <div className="mt-8 space-y-5">
              <Input
                label="Primera llamada del día"
                name="call-time-1"
                type="time"
                value={callTime1}
                onChange={(event) => setCallTime1(event.target.value)}
              />

              {hasCompletoPlan && (
                <Input
                  label="¿Y la segunda llamada del día?"
                  name="call-time-2"
                  type="time"
                  value={callTime2}
                  onChange={(event) => setCallTime2(event.target.value)}
                />
              )}
            </div>
          </div>
        )}

        {step === 7 && (
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              Todo listo, revisa que esté bien
            </h1>

            <div className="mt-6 space-y-4">
              <Card className="step-fade p-5 sm:p-5">
                <div className="flex items-start justify-between">
                  <h2 className="text-base font-semibold text-text-primary">
                    Datos básicos
                  </h2>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    aria-label="Editar datos básicos"
                    className="-m-3.5 rounded-lg p-3.5 text-text-muted transition-[transform,background-color,color] duration-200 hover:scale-110 hover:bg-surface-alt hover:text-text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                <dl className="mt-3 space-y-1.5 text-sm text-text-secondary">
                  <div>
                    <span className="text-text-primary">{name}</span>
                    {nickname && ` · «${nickname}»`}
                  </div>
                  <div>{age} años</div>
                  <div>{phone}</div>
                </dl>
              </Card>

              <Card className="step-fade p-5 sm:p-5" style={{ animationDelay: "60ms" }}>
                <div className="flex items-start justify-between">
                  <h2 className="text-base font-semibold text-text-primary">
                    Personalidad
                  </h2>
                  <button
                    type="button"
                    onClick={() => goToStep(4)}
                    aria-label="Editar personalidad"
                    className="-m-3.5 rounded-lg p-3.5 text-text-muted transition-[transform,background-color,color] duration-200 hover:scale-110 hover:bg-surface-alt hover:text-text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                  {aiProcessed
                    ? [familyText, hobbiesText, routinesText, favoriteTopicsText]
                        .filter(Boolean)
                        .join(" · ")
                    : transcript}
                </p>
              </Card>

              {(aiSensitiveTopics.length > 0 || sensitiveNote.trim()) && (
                <Card className="step-fade p-5 sm:p-5" style={{ animationDelay: "120ms" }}>
                  <div className="flex items-start justify-between">
                    <h2 className="text-base font-semibold text-text-primary">
                      Temas sensibles
                    </h2>
                    <button
                      type="button"
                      onClick={() => goToStep(5)}
                      aria-label="Editar temas sensibles"
                      className="-m-3.5 rounded-lg p-3.5 text-text-muted transition-[transform,background-color,color] duration-200 hover:scale-110 hover:bg-surface-alt hover:text-text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-text-secondary">
                    {[...aiSensitiveTopics, sensitiveNote.trim()]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </Card>
              )}

              <Card className="step-fade p-5 sm:p-5" style={{ animationDelay: "180ms" }}>
                <div className="flex items-start justify-between">
                  <h2 className="text-base font-semibold text-text-primary">
                    Horario de llamadas
                  </h2>
                  <button
                    type="button"
                    onClick={() => goToStep(6)}
                    aria-label="Editar horario"
                    className="-m-3.5 rounded-lg p-3.5 text-text-muted transition-[transform,background-color,color] duration-200 hover:scale-110 hover:bg-surface-alt hover:text-text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 text-sm text-text-secondary">
                  {callTime1}
                  {hasCompletoPlan && ` y ${callTime2}`}
                </p>
              </Card>
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-alert-urgent-bg p-4 text-sm text-alert-urgent">
                {error}
              </div>
            )}

            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || saved}
              className="mt-6 w-full py-4 text-lg"
            >
              {saved ? (
                <>
                  <CheckCircle className="animate-pop-in h-5 w-5" />
                  ¡Guardado!
                </>
              ) : saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar y activar"
              )}
            </Button>
          </div>
        )}

        {step < 7 && (
          <>
            {error && (
              <div className="mt-4 rounded-xl bg-alert-urgent-bg p-4 text-sm text-alert-urgent">
                {error}
              </div>
            )}
            <Button
              type="button"
              onClick={goNext}
              disabled={!canContinue}
              className="mt-8 w-full"
            >
              Continuar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
