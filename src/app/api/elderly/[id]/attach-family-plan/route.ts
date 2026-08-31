import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { MAX_FAMILY_MEMBERS } from "@/lib/stripe/plans";

const ACTIVE_STATUSES = ["active", "trialing"];

// Attaches an elderly profile to the caller's existing "familiar"
// subscription — no Stripe checkout, since the plan is already paid for.
// Used once a family plan exists and has room for another relative.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: elderlyId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("elderly_profiles")
    .select("id")
    .eq("id", elderlyId)
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const service = createServiceRoleClient();

  const { data: familySubscription } = await service
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("plan_type", "familiar")
    .in("status", ACTIVE_STATUSES)
    .maybeSingle();

  if (!familySubscription) {
    return NextResponse.json(
      { error: "No tienes un plan familiar activo" },
      { status: 400 }
    );
  }

  // Already covered by some plan — either this same family subscription
  // or an individual one. Either way, don't double-attach.
  const { count: alreadyCovered } = await service
    .from("subscription_members")
    .select("id", { count: "exact", head: true })
    .eq("elderly_id", elderlyId);

  if (alreadyCovered && alreadyCovered > 0) {
    return NextResponse.json(
      { error: "Este familiar ya tiene un plan asignado" },
      { status: 409 }
    );
  }

  const { count: memberCount } = await service
    .from("subscription_members")
    .select("id", { count: "exact", head: true })
    .eq("subscription_id", familySubscription.id);

  if ((memberCount ?? 0) >= MAX_FAMILY_MEMBERS) {
    return NextResponse.json(
      { error: `Tu plan familiar ya tiene ${MAX_FAMILY_MEMBERS} familiares, el máximo` },
      { status: 400 }
    );
  }

  const { error } = await service.from("subscription_members").insert({
    subscription_id: familySubscription.id,
    elderly_id: elderlyId,
  });

  if (error) {
    return NextResponse.json(
      { error: "No se pudo añadir al plan familiar" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
