import Link from "next/link";
import {
  Brain,
  Heart,
  Phone,
  PhoneCall,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import Header from "@/components/landing/Header";
import { buttonBaseClasses, buttonVariantClasses } from "@/components/ui/Button";

const STEPS = [
  {
    number: "01",
    icon: UserPlus,
    title: "Cuéntanos sobre él o ella",
    description:
      "Rellena su perfil una sola vez: su familia, sus aficiones, su rutina.",
  },
  {
    number: "02",
    icon: PhoneCall,
    title: "Nosotros nos encargamos",
    description:
      "Le llamamos cada día a la hora que elijas, con una voz cálida y natural.",
  },
  {
    number: "03",
    icon: Heart,
    title: "Tú te quedas tranquilo",
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
    title: "Privacidad respetada",
    description:
      "Nunca compartimos la conversación completa, solo lo importante para la familia.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <Header />

      <section className="flex min-h-[85vh] flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="max-w-3xl font-serif text-5xl font-medium text-text-primary md:text-6xl">
          Compañía real para quien más quieres
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary">
          Una inteligencia artificial llama por teléfono a tus seres queridos
          cada día, con conversaciones cálidas y memoria de cada charla. Ellos
          solo necesitan contestar el teléfono.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
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

        <div className="mt-16 flex h-28 w-28 items-center justify-center rounded-full bg-primary-light">
          <PhoneCall className="h-12 w-12 text-primary" strokeWidth={1.5} />
        </div>
      </section>

      <section className="bg-surface-alt py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-serif text-3xl text-text-primary">
            Así de simple
          </h2>
          <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number} className="text-center">
                <p className="font-serif text-2xl text-primary">
                  {step.number}
                </p>
                <div className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-light">
                  <step.icon
                    className="h-6 w-6 text-primary"
                    strokeWidth={1.75}
                  />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-text-primary">
                  {step.title}
                </h3>
                <p className="mt-2 text-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center font-serif text-3xl text-text-primary">
            Por qué Memoria Activa
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary-light">
                  <benefit.icon
                    className="h-6 w-6 text-secondary"
                    strokeWidth={1.75}
                  />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-text-primary">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-text-secondary">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-text-muted">
        © 2026 Memoria Activa. Hecho con cariño para las familias.
      </footer>
    </div>
  );
}
