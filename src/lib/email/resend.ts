import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

const COLORS = {
  background: "#f7f8f6",
  surface: "#ffffff",
  border: "#d1dade",
  primary: "#073d5d",
  textPrimary: "#062f4b",
  textSecondary: "#345369",
  textMuted: "#5c7383",
};

function emailShell(bodyHtml: string): string {
  const logoUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/brand/icon-transparent.png`
    : null;

  return `
    <div style="background-color: ${COLORS.background}; padding: 40px 16px; font-family: -apple-system, 'Segoe UI', sans-serif;">
      <div style="max-width: 480px; margin: 0 auto; background-color: ${COLORS.surface}; border: 1px solid ${COLORS.border}; border-radius: 16px; padding: 32px;">
        ${
          logoUrl
            ? `<img src="${logoUrl}" alt="Memoria Activa" width="40" height="24" style="display: block; margin: 0 0 20px; height: 24px; width: auto;" />`
            : `<p style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: ${COLORS.textPrimary};">Memoria Activa</p>`
        }
        ${bodyHtml}
      </div>
    </div>
  `;
}

function emailButton(href: string, label: string): string {
  return `
    <a href="${href}"
       style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; font-family: -apple-system, 'Segoe UI', sans-serif;">
      ${label}
    </a>
  `;
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
    html: emailShell(`
      <p style="margin: 0; font-size: 16px; color: ${COLORS.textPrimary}; line-height: 1.6;">
        <strong>${inviterEmail}</strong> te ha invitado a ver el perfil de <strong>${elderlyName}</strong> y acompañar de cerca cómo está.
      </p>
      ${emailButton(inviteUrl, "Ver invitación")}
    `),
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

  const levelBg = alertLevel === 3 ? "#f7ecea" : "#f1ebe3";
  const levelColor = alertLevel === 3 ? "#b3432f" : "#8a5819";

  const { error } = await client.emails.send({
    from: "Memoria Activa <onboarding@resend.dev>",
    to,
    subject: `Alerta sobre ${elderlyName}`,
    html: emailShell(`
      <p style="margin: 0 0 4px; font-size: 17px; color: ${COLORS.textPrimary}; font-weight: 600;">
        Sobre ${elderlyName}
      </p>
      <div style="margin-top: 12px; padding: 16px; border-radius: 12px; background-color: ${levelBg};">
        <p style="margin: 0; font-size: 16px; color: ${levelColor}; line-height: 1.5;">
          ${alertMessage}
        </p>
      </div>
      ${emailButton(`${dashboardUrl}/elderly/${elderlyId}`, "Ver en la app")}
      <p style="margin-top: 24px; font-size: 13px; color: ${COLORS.textSecondary};">
        Recibes este email porque tienes acceso al perfil de ${elderlyName} en Memoria Activa.
      </p>
    `),
  });

  if (error) {
    console.error("No se pudo enviar el email de alerta", error);
  }
}
