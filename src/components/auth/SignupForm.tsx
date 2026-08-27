"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
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
    setInfo("Cuenta creada. Revisa tu email para confirmar la cuenta antes de iniciar sesión.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block text-lg font-medium text-gray-900"
        >
          Nombre
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          placeholder="Tu nombre"
        />
      </div>

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
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          placeholder="••••••••"
        />
      </div>

      {error && <p className="text-base text-red-600">{error}</p>}
      {info && <p className="text-base text-green-700">{info}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gray-900 px-4 py-3 text-lg font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-center text-base text-gray-600">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-gray-900 underline underline-offset-4"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
