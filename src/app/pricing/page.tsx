import Link from "next/link";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PricingCards from "@/components/pricing/PricingCards";
import Card from "@/components/ui/Card";
import { buttonBaseClasses, buttonVariantClasses } from "@/components/ui/Button";
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
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-center font-serif text-4xl text-text-primary">
          Elige cómo acompañarle
        </h1>
        <p className="mt-3 text-center text-lg text-text-secondary">
          Cambia o cancela cuando quieras, sin permanencia
        </p>

        {(!profiles || profiles.length === 0) && (
          <Card className="mx-auto mt-10 max-w-md text-center">
            <UserPlus
              className="mx-auto h-10 w-10 text-primary"
              strokeWidth={1.5}
            />
            <p className="mt-4 text-lg text-text-secondary">
              Añade primero un familiar para poder elegir un plan.
            </p>
            <Link
              href="/profile/new"
              className={`${buttonBaseClasses} ${buttonVariantClasses.primary} mt-6`}
            >
              Añadir familiar
            </Link>
          </Card>
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
