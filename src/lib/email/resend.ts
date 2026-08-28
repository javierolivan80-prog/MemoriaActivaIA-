import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendInviteEmail({
  to,
  inviterEmail,
  elderlyName,
  inviteUrl,
}: {
  to: string;
  inviterEmail: string;
  elderlyName: string;
  inviteUrl: string;
}): Promise<void> {
  const client = getResendClient();
  if (!client) return;

  await client.emails.send({
    from: "Memoria Activa <onboarding@resend.dev>",
    to,
    subject: `${inviterEmail} te ha invitado a Memoria Activa`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 20px; color: #2b2118;">Memoria Activa</h1>
        <p style="font-size: 16px; color: #2b2118; line-height: 1.5;">
          <strong>${inviterEmail}</strong> te ha invitado a ver el perfil de <strong>${elderlyName}</strong> en Memoria Activa.
        </p>
        <a href="${inviteUrl}"
           style="display: inline-block; margin-top: 16px; padding: 12px 24px; background-color: #C97A5B; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Ver invitación
        </a>
      </div>
    `,
  });
}
