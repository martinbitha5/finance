"use server";

import { z } from "zod";
import { loadFinanceRaw } from "@/services/finance-data";
import { getToday } from "@/services/today";
import { buildFinanceExports } from "@/lib/report/build";
import { reportEmail } from "@/lib/report/email";
import { EXPORT_SCOPES, type ExportScope } from "@/lib/report/scopes";
import { MailNotConfiguredError, sendMail } from "@/lib/mail/brevo";
import type { ActionResult } from "./_helpers";

const scopeSchema = z.enum(EXPORT_SCOPES.map((s) => s.value) as [ExportScope, ...ExportScope[]]);

/**
 * Génère le rapport (Excel + CSV) de l'utilisateur connecté et le lui envoie par e-mail,
 * sur l'adresse de son compte uniquement (jamais une adresse saisie librement).
 */
export async function emailReport(input: unknown): Promise<ActionResult<{ email: string; period: string }>> {
  const parsed = scopeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Période invalide" };

  try {
    const [raw, today] = await Promise.all([loadFinanceRaw(), getToday()]);
    if (!raw) return { ok: false, error: "Non authentifié" };
    if (!raw.email) return { ok: false, error: "Aucune adresse e-mail n'est associée à ton compte." };

    const exportsData = await buildFinanceExports(raw, today, parsed.data);
    const firstName = raw.profile.display_name?.split(" ")[0] ?? "";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mony.app";
    const { subject, html, text } = reportEmail(firstName, exportsData, siteUrl);

    await sendMail({
      to: { email: raw.email, name: raw.profile.display_name ?? undefined },
      subject,
      html,
      text,
      attachments: [
        { name: exportsData.xlsx.filename, content: Buffer.from(exportsData.xlsx.file).toString("base64") },
        { name: exportsData.csv.filename, content: Buffer.from(exportsData.csv.content, "utf8").toString("base64") },
      ],
    });

    return { ok: true, data: { email: raw.email, period: exportsData.period.label } };
  } catch (e) {
    if (e instanceof MailNotConfiguredError) {
      return { ok: false, error: "L'envoi d'e-mails n'est pas encore activé sur ce serveur. Tu peux télécharger le rapport directement en attendant." };
    }
    console.error("[export] envoi du rapport", e);
    const msg = e instanceof Error ? e.message : "";
    const network = /timeout|ECONN|ETIMEDOUT|ENOTFOUND|EAI_AGAIN/i.test(msg);
    return {
      ok: false,
      error: network
        ? "Le serveur n'arrive pas à joindre le service d'envoi (connexion SMTP bloquée). Télécharge le rapport directement en attendant."
        : "L'envoi a échoué. Réessaie dans un instant ou télécharge le rapport directement.",
    };
  }
}
