"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    setLoading(false);

    if (error) {
      setError("No se pudo crear la cuenta. Inténtalo de nuevo.");
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    // Email confirmation is required before a session exists.
    setAwaitingConfirmation(true);
  }

  if (awaitingConfirmation) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary-light">
          <Mail className="h-6 w-6 text-secondary" strokeWidth={1.75} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-text-primary">
          Revisa tu email
        </h1>
        <p className="mt-2 text-text-secondary">
          Te hemos enviado un enlace de confirmación a{" "}
          <span className="font-medium text-text-primary">{email}</span>.
          Confírmalo para poder iniciar sesión.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-block font-medium text-primary"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-text-primary">
        Crea tu cuenta
      </h1>
      <p className="mt-2 mb-6 text-text-secondary">
        Empecemos a cuidar de quien más quieres
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Nombre completo"
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Tu nombre"
        />

        <Input
          label="Correo electrónico"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
        />

        <Input
          label="Contraseña"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          hint="Mínimo 8 caracteres"
        />

        {error && (
          <div className="rounded-xl bg-alert-urgent-bg p-4 text-sm text-alert-urgent">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading} className="mt-4 w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creando cuenta...
            </>
          ) : (
            "Crear cuenta"
          )}
        </Button>

        <p className="text-center text-sm text-text-secondary">
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="font-medium text-primary">
            Iniciar sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
