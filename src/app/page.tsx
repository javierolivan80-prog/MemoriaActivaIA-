import Link from "next/link";
import { Brain, Heart, Phone, ShieldCheck, Users } from "lucide-react";
import Header from "@/components/landing/Header";
import { buttonBaseClasses, buttonVariantClasses } from "@/components/ui/Button";

const STEPS = [
  {
    number: "01",
    title: "Cuéntanos sobre él o ella",
    description:
      "Rellena su perfil una sola vez: su familia, sus aficiones, su rutina.",
  },
  {
    number: "02",
    title: "Le llamamos cada día",
    description:
      "A la hora que elijas, con una voz cálida y natural.",
  },
  {
    number: "03",
    title: "Tú te enteras de todo",
    description:
      "Recibe un resumen después de cada llamada y alertas si algo importa.",
  },
];

const BENEFITS = [
  {
    icon: Phone,
    title: "Sin apps ni internet",
    description:
      "Solo necesita su teléfono de siempre, nada de tecnología nueva que aprender.",
  },
  {
    icon: Brain,
    title: "Recuerda cada conversación",
    description:
      "La IA recuerda lo que hablasteis ayer, como haría un buen amigo.",
  },
  {
    icon: ShieldCheck,
    title: "Nunca compartimos la conversación entera",
    description:
      "La familia recibe solo lo importante. El resto se queda entre él o ella y quien le llama.",
  },
];

const WAVE_BARS = [42, 78, 100, 60, 88, 48, 70, 55, 90, 65];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <Header />

      <section className="relative overflow-hidden px-6 pb-20 pt-16 md:pb-28 md:pt-20">
        <div
          aria-hidden
          className="animate-drift-slow pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-secondary-light/60 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-primary-light/50 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-[1.05fr_0.95fr] md:gap-12">
          <div className="text-center md:text-left">
            <h1 className="mx-auto max-w-xl font-serif text-5xl font-medium leading-[1.08] text-text-primary md:mx-0 md:text-[3.75rem]">
              Compañía real para quien más quieres
            </h1>
            <p className="mx-auto mt-6 max-w-md text-lg text-text-secondary md:mx-0">
              Una inteligencia artificial llama por teléfono a tus seres
              queridos cada día, con conversaciones cálidas y memoria de cada
              charla. Ellos solo necesitan contestar el teléfono.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 md:justify-start">
              <Link
                href="/auth/signup"
                className={`${buttonBaseClasses} ${buttonVariantClasses.primary} px-8 py-4 text-lg`}
              >
                Empezar ahora
              </Link>
              <Link
                href="/pricing"
                className={`${buttonBaseClasses} ${buttonVariantClasses.secondary} px-8 py-4 text-lg`}
              >
                Ver planes
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm md:mx-0" aria-hidden>
            <div className="relative rounded-2xl border border-border bg-surface p-6 shadow-soft-md">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-light font-serif text-lg text-primary">
                  M
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-text-primary">Mamá</p>
                  <p className="flex items-center gap-1.5 text-sm text-text-secondary">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    Llamada en curso · 04:12
                  </p>
                </div>
                <span className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-light text-secondary">
                  <Phone className="h-4 w-4" strokeWidth={1.75} />
                </span>
              </div>

              <div className="mt-6 flex h-12 items-end gap-1.5">
                {WAVE_BARS.map((h, i) => (
                  <span
                    key={i}
                    className="animate-call-wave w-full rounded-full bg-primary/30"
                    style={{ height: `${h}%`, animationDelay: `${i * 0.11}s` }}
                  />
                ))}
              </div>
            </div>

            <div className="absolute -left-12 -top-8 hidden max-w-[12rem] -rotate-6 rounded-xl border border-border bg-surface px-4 py-3 shadow-soft sm:block">
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-secondary" strokeWidth={1.75} />
                Su nieta juega al fútbol los sábados
              </div>
            </div>
            <div className="absolute -right-8 -bottom-10 hidden max-w-[12rem] rotate-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-soft sm:block">
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <Heart className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
                Le encanta el flan de su hermana
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-alt py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center font-serif text-3xl text-text-primary">
            Cómo funciona
          </h2>
          <div className="mt-16 space-y-16 md:space-y-24">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="flex flex-col gap-1 md:flex-row md:items-start md:gap-10"
              >
                <span
                  aria-hidden
                  className="font-serif text-8xl leading-none text-primary/15 md:w-40 md:shrink-0 md:text-9xl"
                >
                  {step.number}
                </span>
                <div className="md:pt-5">
                  <h3 className="text-2xl font-semibold text-text-primary">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-md text-lg text-text-secondary">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
          <div className="md:sticky md:top-32 md:self-start">
            <h2 className="font-serif text-3xl text-text-primary md:text-4xl">
              Por qué Memoria Activa
            </h2>
            <p className="mt-4 max-w-sm text-text-secondary">
              Pensado para dar tranquilidad a la familia, sin invadir nunca su
              intimidad.
            </p>
          </div>

          <div className="divide-y divide-border">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="flex items-start gap-6 py-8 first:pt-0 last:pb-0"
              >
                <benefit.icon
                  className="h-9 w-9 shrink-0 text-secondary"
                  strokeWidth={1.5}
                />
                <div>
                  <h3 className="text-xl font-semibold text-text-primary md:text-2xl">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-lg text-text-secondary">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-text-muted">
        © 2026 Memoria Activa
      </footer>
    </div>
  );
}
