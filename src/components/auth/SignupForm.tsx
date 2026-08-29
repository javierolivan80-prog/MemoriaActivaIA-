"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Turnstile from "@/components/auth/Turnstile";
import GoogleButton from "@/components/auth/GoogleButton";

const CAPTCHA_ENABLED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (CAPTCHA_ENABLED && !captchaToken) {
      setError("Completa la verificación para continuar.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        captchaToken: captchaToken ?? undefined,
      },
    });

    setLoading(false);

    if (error) {
      setError("No se pudo crear la cuenta. Inténtalo de nuevo.");
      return;
    }

    if (data.session) {
      const pendingInvite = sessionStorage.getItem("pendingInviteToken");
      if (pendingInvite) {
        sessionStorage.removeItem("pendingInviteToken");
        router.push(`/invite/${pendingInvite}`);
        router.refresh();
        return;
      }
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
        <Mail className="mx-auto h-9 w-9 text-primary" strokeWidth={1.5} />
        <h1 className="mt-5 font-serif text-3xl text-text-primary">
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
      <h1 className="font-serif text-3xl text-text-primary">
        Crea tu cuenta
      </h1>
      <p className="mt-2 mb-6 text-text-secondary">
        Empecemos a cuidar de quien más quieres
      </p>

      <GoogleButton />

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm text-text-muted">o</span>
        <div className="h-px flex-1 bg-border" />
      </div>

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

        <Turnstile onVerify={setCaptchaToken} />

        {error && (
          <div className="rounded-xl bg-alert-urgent-bg p-4 text-sm text-alert-urgent">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || (CAPTCHA_ENABLED && !captchaToken)}
          className="mt-4 w-full"
        >
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
