"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Turnstile from "@/components/auth/Turnstile";
import GoogleButton from "@/components/auth/GoogleButton";

const CAPTCHA_ENABLED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken: captchaToken ?? undefined },
    });

    setLoading(false);

    if (error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    const pendingInvite = sessionStorage.getItem("pendingInviteToken");
    if (pendingInvite) {
      sessionStorage.removeItem("pendingInviteToken");
      router.push(`/invite/${pendingInvite}`);
      router.refresh();
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-text-primary">
        Bienvenido de nuevo
      </h1>
      <p className="mt-2 mb-6 text-text-secondary">
        Inicia sesión para ver cómo está tu familiar
      </p>

      <GoogleButton />

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm text-text-muted">o</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
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
              Entrando...
            </>
          ) : (
            "Iniciar sesión"
          )}
        </Button>

        <p className="text-center text-sm text-text-secondary">
          ¿No tienes cuenta?{" "}
          <Link href="/auth/signup" className="font-medium text-primary">
            Crear una
          </Link>
        </p>
      </form>
    </div>
  );
}
