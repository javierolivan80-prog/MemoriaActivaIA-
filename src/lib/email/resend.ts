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

  const { error } = await client.emails.send({
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

  if (error) {
    console.error("No se pudo enviar el email de invitación", error);
  }
}

export async function sendAlertEmail({
  to,
  elderlyName,
  elderlyId,
  alertMessage,
  alertLevel,
  dashboardUrl,
}: {
  to: string;
  elderlyName: string;
  elderlyId: string;
  alertMessage: string;
  alertLevel: 2 | 3;
  dashboardUrl: string;
}): Promise<void> {
  const client = getResendClient();
  if (!client) return;

  const levelBg = alertLevel === 3 ? "#fbeae7" : "#fbf1e3";
  const levelColor = alertLevel === 3 ? "#c24b3f" : "#c98a3a";

  const { error } = await client.emails.send({
    from: "Memoria Activa <onboarding@resend.dev>",
    to,
    subject: `Alerta sobre ${elderlyName}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 20px; color: #2d2a26;">Memoria Activa</h1>
        <h2 style="font-size: 18px; color: #2d2a26;">Alerta sobre ${elderlyName}</h2>
        <div style="margin-top: 12px; padding: 16px; border-radius: 12px; background-color: ${levelBg};">
          <p style="margin: 0; font-size: 16px; color: ${levelColor}; line-height: 1.5;">
            ${alertMessage}
          </p>
        </div>
        <a href="${dashboardUrl}/elderly/${elderlyId}"
           style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #c97a5b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Ver en la app
        </a>
        <p style="margin-top: 24px; font-size: 13px; color: #a39d96;">
          Recibes este email porque tienes acceso al perfil de ${elderlyName} en Memoria Activa.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("No se pudo enviar el email de alerta", error);
  }
}
