import Link from "next/link";
import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/landing/Header";
import PricingCards from "@/components/pricing/PricingCards";
import Reveal from "@/components/ui/Reveal";
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

  // Visitors see the plans without an account: the landing page links here, and
  // a family should be able to check the price before signing up. Choosing a
  // plan sends them to signup, and they pick a familiar once they're back.
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-20">
          <PricingCards
            profiles={[]}
            initialElderlyId={null}
            isAuthenticated={false}
          />
        </div>
      </div>
    );
  }

  const { data: profiles } = await supabase
    .from("elderly_profiles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<ElderlyProfile[]>();

  return (
    <div className="min-h-screen bg-background px-4 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-5xl">
        {(!profiles || profiles.length === 0) && (
          <Reveal className="mx-auto max-w-md text-center">
            <UserPlus
              className="mx-auto h-10 w-10 text-primary"
              strokeWidth={1.5}
            />
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-text-primary">
              Añade primero un familiar
            </h1>
            <p className="mt-3 text-lg text-text-secondary">
              Necesitas crear su perfil antes de poder elegir un plan para
              él o ella.
            </p>
            <Link
              href="/profile/new"
              className={`${buttonBaseClasses} ${buttonVariantClasses.primary} mt-6`}
            >
              Añadir familiar
            </Link>
          </Reveal>
        )}

        {profiles && profiles.length > 0 && (
          <PricingCards
            profiles={profiles}
            initialElderlyId={elderlyId ?? null}
            isAuthenticated
          />
        )}
      </div>
    </div>
  );
}
