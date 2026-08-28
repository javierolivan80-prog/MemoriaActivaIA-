import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/server";
import { getPriceIdForPlan } from "@/lib/stripe/priceMap";

const CheckoutSchema = z.object({
  planType: z.enum(["esencial", "completo"]),
  elderlyId: z.uuid(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = CheckoutSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos de la petición no válidos" },
      { status: 400 }
    );
  }

  const { planType, elderlyId } = parsed.data;

  const { data: profile } = await supabase
    .from("elderly_profiles")
    .select("id")
    .eq("id", elderlyId)
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json(
      { error: "Perfil no encontrado" },
      { status: 404 }
    );
  }

  const stripe = getStripeClient();

  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .not("stripe_customer_id", "is", null)
    .limit(1)
    .maybeSingle();

  let customerId: string | undefined = existingSubscription?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: getPriceIdForPlan(planType), quantity: 1 }],
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/pricing?elderlyId=${elderlyId}`,
      metadata: {
        elderlyId,
        userId: user.id,
        planType,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "No se pudo crear la sesión de pago" },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json(
      { error: "No se pudo crear la sesión de pago" },
      { status: 502 }
    );
  }
}
