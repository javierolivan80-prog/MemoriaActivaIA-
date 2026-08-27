"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
      setError("Email o contraseña incorrectos.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="email"
          className="block text-lg font-medium text-gray-900"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          placeholder="tu@email.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-lg font-medium text-gray-900"
        >
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          placeholder="••••••••"
        />
      </div>

      {error && <p className="text-base text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gray-900 px-4 py-3 text-lg font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Entrando..." : "Iniciar sesión"}
      </button>

      <p className="text-center text-base text-gray-600">
        ¿No tienes cuenta?{" "}
        <Link
          href="/auth/signup"
          className="font-medium text-gray-900 underline underline-offset-4"
        >
          Regístrate
        </Link>
      </p>
    </form>
  );
}
