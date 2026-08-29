import { NextResponse } from "next/server";
import { verifyRetellWebhookSignature } from "@/lib/phone/retell";
import { createServiceRoleClient } from "@/lib/supabase/service";

interface RetellWebhookCall {
  call_id: string;
  transcript?: string;
  end_timestamp?: number;
  duration_ms?: number;
  disconnection_reason?: string;
}

interface RetellWebhookPayload {
  event: "call_started" | "call_ended" | "call_analyzed" | string;
  call: RetellWebhookCall;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-retell-signature");

  if (!signature) {
    return NextResponse.json({ error: "Falta la firma" }, { status: 401 });
  }

  const isValid = await verifyRetellWebhookSignature(
    rawBody,
    process.env.RETELL_API_KEY!,
    signature
  );

  if (!isValid) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as RetellWebhookPayload;
  const { event, call } = payload;

  if (event !== "call_ended" && event !== "call_analyzed") {
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceRoleClient();

  const { data: session } = await supabase
    .from("conversation_sessions")
    .select("id, transcript")
    .eq("retell_call_id", call.call_id)
    .single();

  if (!session) {
    return NextResponse.json({ received: true });
  }

  const alreadyHasTranscript = Boolean(session.transcript);

  await supabase
    .from("conversation_sessions")
    .update({
      transcript: call.transcript ?? session.transcript ?? null,
      status:
        call.disconnection_reason === "dial_no_answer"
          ? "no_answer"
          : "completed",
      ended_at: call.end_timestamp
        ? new Date(call.end_timestamp).toISOString()
        : new Date().toISOString(),
      duration_seconds: call.duration_ms
        ? Math.round(call.duration_ms / 1000)
        : null,
    })
    .eq("id", session.id);

  if (
    (event === "call_ended" || event === "call_analyzed") &&
    call.transcript &&
    !alreadyHasTranscript
  ) {
    try {
      const summarizeResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/calls/summarize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.INTERNAL_API_SECRET!,
          },
          body: JSON.stringify({ sessionId: session.id }),
        }
      );
      if (!summarizeResponse.ok) {
        console.error(
          `Failed to trigger summary for session ${session.id}: ${summarizeResponse.status}`
        );
      }
    } catch (error) {
      // Not fatal for the webhook ack, but must be visible — otherwise a
      // family can be left with a completed call that never got a summary
      // or an alert, with nothing distinguishing that from "all is well".
      console.error(
        `Failed to trigger summary for session ${session.id}`,
        error
      );
    }
  }

  return NextResponse.json({ received: true });
}
