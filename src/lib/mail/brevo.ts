import "server-only";
import nodemailer from "nodemailer";

// ─────────────────────────────────────────────────────────────
// Envoi d'e-mails transactionnels via Brevo, côté serveur uniquement.
//
// Deux transports, choisis selon l'environnement :
//  1. API HTTP v3  — BREVO_API_KEY (xkeysib-…). Recommandé : fonctionne partout, y compris
//     sur les réseaux qui bloquent les ports SMTP.
//  2. SMTP         — BREVO_SMTP_KEY (xsmtpsib-…) + BREVO_SMTP_LOGIN. Relais smtp-relay.brevo.com,
//     port 587 (STARTTLS). Nécessite que le serveur puisse ouvrir des connexions SMTP sortantes.
// Rien de tout cela n'est exposé au navigateur.
// ─────────────────────────────────────────────────────────────

export interface MailAttachment {
  name: string;
  /** Contenu encodé en base64. */
  content: string;
}

export interface MailMessage {
  to: { email: string; name?: string };
  subject: string;
  html: string;
  text: string;
  attachments?: MailAttachment[];
}

export class MailNotConfiguredError extends Error {
  constructor() {
    super("L'envoi d'e-mails n'est pas configuré (BREVO_API_KEY ou BREVO_SMTP_KEY manquante).");
    this.name = "MailNotConfiguredError";
  }
}

function sender() {
  return {
    email: process.env.MAIL_FROM_EMAIL ?? "martinbitha6@gmail.com",
    name: process.env.MAIL_FROM_NAME ?? "MONY",
  };
}

export function mailTransport(): "api" | "smtp" | null {
  if (process.env.BREVO_API_KEY) return "api";
  if (process.env.BREVO_SMTP_KEY) return "smtp";
  return null;
}

/** Envoie un e-mail. Lève une erreur explicite si aucun transport n'est configuré ou si l'envoi échoue. */
export async function sendMail(message: MailMessage): Promise<{ messageId: string; transport: "api" | "smtp" }> {
  const transport = mailTransport();
  if (!transport) throw new MailNotConfiguredError();
  return transport === "api" ? sendViaApi(message) : sendViaSmtp(message);
}

async function sendViaApi(message: MailMessage) {
  const from = sender();
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY!, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: from,
      to: [{ email: message.to.email, name: message.to.name }],
      subject: message.subject,
      htmlContent: message.html,
      textContent: message.text,
      attachment: message.attachments?.map((a) => ({ name: a.name, content: a.content })),
      tags: ["mony-report"],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo API ${res.status} : ${body.slice(0, 300) || res.statusText}`);
  }
  const json = (await res.json().catch(() => ({}))) as { messageId?: string };
  return { messageId: json.messageId ?? "", transport: "api" as const };
}

async function sendViaSmtp(message: MailMessage) {
  const from = sender();
  const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST ?? "smtp-relay.brevo.com",
    port: Number(process.env.BREVO_SMTP_PORT ?? 587),
    secure: process.env.BREVO_SMTP_PORT === "465",
    auth: { user: process.env.BREVO_SMTP_LOGIN ?? from.email, pass: process.env.BREVO_SMTP_KEY! },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
  });
  const info = await transporter.sendMail({
    from: `"${from.name}" <${from.email}>`,
    to: message.to.name ? `"${message.to.name.replace(/"/g, "")}" <${message.to.email}>` : message.to.email,
    subject: message.subject,
    text: message.text,
    html: message.html,
    attachments: message.attachments?.map((a) => ({ filename: a.name, content: a.content, encoding: "base64" })),
    headers: { "X-Mailin-Tag": "mony-report" },
  });
  return { messageId: info.messageId ?? "", transport: "smtp" as const };
}
