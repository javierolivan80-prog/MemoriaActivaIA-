import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PricingCards from "@/components/pricing/PricingCards";
import type { ElderlyProfile } from "@/types";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ elderlyId?: string }>;
}) {
  const { elderlyId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profiles } = await supabase
    .from("elderly_profiles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<ElderlyProfile[]>();

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-center text-3xl font-semibold tracking-tight text-gray-900">
          Elige un plan
        </h1>
        <p className="mt-2 text-center text-lg text-gray-600">
          Todas las llamadas son reales, cálidas y pensadas para acompañar.
        </p>

        {(!profiles || profiles.length === 0) && (
          <div className="mx-auto mt-10 max-w-md rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-lg text-gray-600">
              Añade primero un familiar para poder elegir un plan.
            </p>
            <Link
              href="/profile/new"
              className="mt-6 inline-block rounded-lg bg-gray-900 px-6 py-3 text-lg font-medium text-white transition hover:bg-gray-800"
            >
              Añadir familiar
            </Link>
          </div>
        )}

        {profiles && profiles.length > 0 && (
          <PricingCards
            profiles={profiles}
            initialElderlyId={elderlyId ?? null}
          />
        )}
      </div>
    </div>
  );
}
