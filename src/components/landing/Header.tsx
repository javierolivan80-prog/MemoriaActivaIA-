"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonBaseClasses, buttonVariantClasses } from "@/components/ui/Button";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 ${
        scrolled
          ? "bg-surface/95 shadow-soft backdrop-blur-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-xl text-text-primary">
          Memoria Activa
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className={`${buttonBaseClasses} ${buttonVariantClasses.ghost} px-4 py-2`}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/auth/signup"
            className={`${buttonBaseClasses} ${buttonVariantClasses.primary} px-4 py-2`}
          >
            Crear cuenta
          </Link>
        </nav>
      </div>
    </header>
  );
}
