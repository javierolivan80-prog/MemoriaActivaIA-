import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

export default function EntryShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen md:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <Link
          href="/"
          className="mb-10 inline-block w-fit"
          aria-label="Memoria Activa, ir al inicio"
        >
          <Image
            src="/brand/icon-transparent.png"
            alt=""
            width={628}
            height={372}
            priority
            className="h-8 w-auto"
          />
        </Link>
        <Reveal className="w-full max-w-sm">{children}</Reveal>
      </div>

      <div className="relative hidden overflow-hidden bg-surface-alt md:block">
        <div
          aria-hidden
          className="animate-drift-slow pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-secondary-light/70 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-primary-light/60 blur-3xl"
        />

        <div className="relative flex h-full flex-col justify-center px-16">
          <h2 className="max-w-md text-4xl leading-[1.15] font-semibold tracking-tight text-text-primary">
            Compañía real para quien más quieres
          </h2>
          <p className="mt-6 max-w-sm text-lg text-text-secondary">
            Cada día, una llamada cálida que recuerda la conversación de
            ayer. Ellos solo tienen que contestar el teléfono.
          </p>

          <div className="relative mt-14 max-w-xs">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light font-semibold text-primary">
                  M
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Mamá
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    Llamada en curso
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 flex max-w-[11rem] -rotate-3 items-start gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs text-text-secondary shadow-soft">
              <Heart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.75} />
              Le encanta el flan de su hermana
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
