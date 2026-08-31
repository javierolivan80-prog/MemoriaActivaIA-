import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/server";
import { getPlanTypeForPriceId } from "@/lib/stripe/priceMap";
import { PLANS } from "@/lib/stripe/plans";
import { createServiceRoleClient } from "@/lib/supabase/service";

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subscription = invoice.parent?.subscription_details?.subscription;
  if (!subscription) return null;
  return typeof subscription === "string" ? subscription : subscription.id;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  const stripe = getStripeClient();

  if (!signature) {
    return NextResponse.json({ error: "Falta la firma" }, { status: 401 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (
        session.payment_status === "unpaid" ||
        !session.subscription ||
        !session.customer
      ) {
        break;
      }

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer.id;

      const elderlyId = session.metadata?.elderlyId || null;
      const userId = session.metadata?.userId;

      if (!userId) break;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      const planType = priceId ? getPlanTypeForPriceId(priceId) : null;
      const plan = planType ? PLANS[planType] : null;

      if (!plan) break;
      // A non-family plan always belongs to one relative; the checkout
      // route already refused to start a session without elderlyId in
      // that case, but a webhook must not trust client-set metadata
      // blindly — re-check the invariant here too.
      if (plan.planType !== "familiar" && !elderlyId) break;

      const { data: savedSubscription } = await supabase
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            elderly_id: plan.planType === "familiar" ? null : elderlyId,
            plan_type: plan.planType,
            calls_per_day: plan.callsPerDay,
            minutes_per_call: plan.minutesPerCall,
            status: subscription.status,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            current_period_end: new Date(
              subscription.items.data[0].current_period_end * 1000
            ).toISOString(),
          },
          { onConflict: "stripe_subscription_id" }
        )
        .select("id")
        .single();

      // Checkout was launched from a specific relative's pricing page —
      // attach them as the family plan's first member instead of leaving
      // a paid-for plan with nobody on it.
      if (plan.planType === "familiar" && elderlyId && savedSubscription) {
        await supabase
          .from("subscription_members")
          .upsert(
            { subscription_id: savedSubscription.id, elderly_id: elderlyId },
            { onConflict: "elderly_id" }
          );
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from("subscriptions")
        .update({
          status: subscription.status,
          current_period_end: subscription.items.data[0]
            ? new Date(
                subscription.items.data[0].current_period_end * 1000
              ).toISOString()
            : null,
        })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = getInvoiceSubscriptionId(invoice);
      if (subscriptionId) {
        await supabase
          .from("subscriptions")
          .update({ status: "payment_failed" })
          .eq("stripe_subscription_id", subscriptionId);
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = getInvoiceSubscriptionId(invoice);
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId
        );
        await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            current_period_end: subscription.items.data[0]
              ? new Date(
                  subscription.items.data[0].current_period_end * 1000
                ).toISOString()
              : null,
          })
          .eq("stripe_subscription_id", subscriptionId);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
