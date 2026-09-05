import type { FinanceExports } from "./build";
import { formatMoney } from "@/lib/format";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Objet, message HTML et texte brut de l'e-mail qui accompagne le rapport. */
export function reportEmail(firstName: string, x: FinanceExports, siteUrl: string) {
  const cur = x.currency;
  const m = (n: number) => formatMoney(n, cur);
  const hello = firstName ? `Bonjour ${firstName}` : "Bonjour";
  const subject = `Ton rapport ${APP_NAME} · ${x.period.label}`;
  const restTone = x.stats.available < 0 ? "#DC2626" : "#15803D";

  const text = [
    `${hello},`,
    "",
    `Voici ton rapport financier ${APP_NAME} pour la période : ${x.period.label}.`,
    "",
    `Revenus : ${m(x.stats.income)}`,
    `Dépenses : ${m(x.stats.expenses)}`,
    `Épargne : ${m(x.stats.savings)}`,
    `Reste : ${m(x.stats.available)}`,
    `${x.stats.count} transaction(s) sur la période.`,
    "",
    "Deux fichiers sont joints :",
    `- ${x.xlsx.filename} : le rapport complet (synthèse, transactions, budgets, objectifs, dettes, charges, graphiques), à ouvrir dans Excel, Numbers ou Google Sheets.`,
    `- ${x.csv.filename} : tes transactions au format brut, pour tout autre outil.`,
    "",
    `Ces documents contiennent des informations personnelles : garde-les pour toi.`,
    "",
    `${APP_NAME} — ${APP_TAGLINE}`,
    siteUrl,
  ].join("\n");

  const row = (label: string, value: string, color = "#12141A") =>
    `<tr><td style="padding:8px 12px;color:#676C78;font-size:13px;border-bottom:1px solid #EDEBE4">${esc(label)}</td><td style="padding:8px 12px;text-align:right;font-weight:700;font-size:14px;color:${color};border-bottom:1px solid #EDEBE4;font-variant-numeric:tabular-nums">${esc(value)}</td></tr>`;

  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#F4F3EE;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#12141A">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F4F3EE;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%">
  <tr><td style="background:#0B1220;border-radius:20px 20px 0 0;padding:22px 24px">
    <div style="font-size:20px;font-weight:800;color:#F7F7F5;letter-spacing:-0.3px">${APP_NAME}</div>
    <div style="font-size:12px;color:#2DD4BF;margin-top:2px">${esc(APP_TAGLINE)}</div>
  </td></tr>
  <tr><td style="background:#FFFFFF;padding:24px">
    <p style="margin:0 0 12px;font-size:16px;font-weight:700">${esc(hello)} 👋</p>
    <p style="margin:0 0 18px;font-size:14px;line-height:1.5;color:#3A3F4B">Voici ton rapport financier pour la période <b>${esc(x.period.label)}</b>. Les deux fichiers sont en pièce jointe.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F7F8F5;border-radius:14px;overflow:hidden;margin-bottom:18px">
      ${row("Revenus", m(x.stats.income), "#15803D")}
      ${row("Dépenses", m(x.stats.expenses), "#DC2626")}
      ${row("Épargne", m(x.stats.savings))}
      ${row("Reste", m(x.stats.available), restTone)}
      <tr><td colspan="2" style="padding:8px 12px;font-size:12px;color:#9BA0AB">${x.stats.count} transaction(s) sur la période</td></tr>
    </table>
    <p style="margin:0 0 6px;font-size:13px;font-weight:700">Pièces jointes</p>
    <ul style="margin:0 0 18px;padding-left:18px;font-size:13px;line-height:1.6;color:#3A3F4B">
      <li><b>${esc(x.xlsx.filename)}</b> — rapport complet : synthèse, transactions, budgets, objectifs, dettes, charges et graphiques. À ouvrir dans Excel, Numbers ou Google Sheets.</li>
      <li><b>${esc(x.csv.filename)}</b> — tes transactions au format brut, pour n'importe quel autre outil.</li>
    </ul>
    <p style="margin:0;font-size:12px;line-height:1.5;color:#9BA0AB">Ces documents contiennent des informations personnelles : garde-les pour toi. Tu reçois cet e-mail parce que tu as demandé ce rapport depuis ${APP_NAME}.</p>
  </td></tr>
  <tr><td style="background:#FFFFFF;border-radius:0 0 20px 20px;padding:0 24px 22px">
    <a href="${esc(siteUrl)}" style="display:inline-block;background:#0B1220;color:#F7F7F5;text-decoration:none;font-weight:700;font-size:13px;padding:10px 16px;border-radius:12px">Ouvrir ${APP_NAME}</a>
  </td></tr>
  <tr><td style="padding:14px 8px;text-align:center;font-size:11px;color:#9BA0AB">${APP_NAME} · ${esc(APP_TAGLINE)}</td></tr>
</table></td></tr></table></body></html>`;

  return { subject, html, text };
}
