import Link from "next/link";
import { buttonBaseClasses, buttonVariantClasses } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <span
        aria-hidden
        className="text-9xl leading-none font-bold text-primary/15"
      >
        404
      </span>
      <h1 className="-mt-4 text-3xl font-semibold tracking-tight text-text-primary">
        No hemos encontrado esta página
      </h1>
      <p className="mt-3 max-w-sm text-text-secondary">
        Puede que el enlace sea antiguo o que la página se haya movido.
      </p>
      <Link
        href="/"
        className={`${buttonBaseClasses} ${buttonVariantClasses.primary} mt-8`}
      >
        Volver al inicio
      </Link>
    </div>
  );
}
