"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-text-primary">
        Bienvenido de nuevo
      </h1>
      <p className="mt-2 mb-6 text-text-secondary">
        Inicia sesión para ver cómo está tu familiar
      </p>

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

        {error && (
          <div className="rounded-xl bg-alert-urgent-bg p-4 text-sm text-alert-urgent">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading} className="mt-4 w-full">
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
