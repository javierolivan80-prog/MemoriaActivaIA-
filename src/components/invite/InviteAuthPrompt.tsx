"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonBaseClasses, buttonVariantClasses } from "@/components/ui/Button";

export default function InviteAuthPrompt({ token }: { token: string }) {
  useEffect(() => {
    sessionStorage.setItem("pendingInviteToken", token);
  }, [token]);

  return (
    <div>
      <h1 className="font-serif text-3xl text-text-primary">
        Te han invitado a Memoria Activa
      </h1>
      <p className="mt-3 text-text-secondary">
        Para aceptar esta invitación, primero crea una cuenta o inicia sesión.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Link
          href="/auth/signup"
          className={`${buttonBaseClasses} ${buttonVariantClasses.primary} w-full`}
        >
          Crear una cuenta
        </Link>
        <Link
          href="/auth/login"
          className={`${buttonBaseClasses} ${buttonVariantClasses.secondary} w-full`}
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
