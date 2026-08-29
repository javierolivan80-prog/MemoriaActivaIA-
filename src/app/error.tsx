"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";
import { buttonBaseClasses, buttonVariantClasses } from "@/components/ui/Button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <AlertTriangle
        aria-hidden
        className="h-10 w-10 text-alert-warning"
        strokeWidth={1.5}
      />
      <h1 className="mt-4 font-serif text-3xl text-text-primary">
        Algo no ha ido bien
      </h1>
      <p className="mt-3 max-w-sm text-text-secondary">
        Ha ocurrido un error inesperado. Puedes intentarlo de nuevo o volver
        al panel.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={reset}>
          Reintentar
        </Button>
        <Link
          href="/dashboard"
          className={`${buttonBaseClasses} ${buttonVariantClasses.ghost}`}
        >
          Ir al panel
        </Link>
      </div>
    </div>
  );
}
