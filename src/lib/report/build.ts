import { addMonths, startOfMonth, startOfYear, subMonths } from "date-fns";
import type { FinanceRaw } from "@/lib/finance/data";
import { buildFinanceData } from "@/lib/finance/data";
import { convert, describeRate } from "@/lib/finance/currency";
import { CURRENCIES, FREQUENCIES, PAYMENT_METHODS, type Currency } from "@/lib/constants";
import type { CategorySpend, DateRange, Transaction } from "@/lib/finance/types";
import { formatDate, formatMonth, toISODate } from "@/lib/format";
import { round2, sum } from "@/lib/utils";
import { LOGO_MONY } from "./logo";
import { transactionsToCsv } from "@/lib/export-csv";
import { injectNativeCharts, type ChartSpec } from "./charts";
import { describeWeekdays, monthlyEquivalent } from "@/lib/finance/cycles";
import {
  addSheet,
  FMT_DATE,
  FMT_PCT,
  kpiGrid,
  kvRows,
  moneyFmt,
  newWorkbook,
  noteRow,
  placeLogo,
  ratio,
  sectionBar,
  sideBars,
  sideEmpty,
  sideSection,
  table,
  titleBand,
  workbookBuffer,
  type Cell,
  type Tone,
} from "./xlsx";

import type { ExportScope } from "./scopes";

export interface Period extends DateRange {
  label: string;
  fileTag: string;
}

export function resolvePeriod(scope: ExportScope, today: Date, cycle: DateRange, transactions: Transaction[]): Period {
  const todayISO = toISODate(today);
  switch (scope) {
    case "cycle":
      return { start: cycle.start, end: cycle.end, label: `Cycle de paie du ${formatDate(cycle.start, "d MMM")} au ${formatDate(cycle.end, "d MMM yyyy")}`, fileTag: `cycle-${cycle.start}` };
    case "quarter": {
      const start = startOfMonth(subMonths(today, 2));
      return { start: toISODate(start), end: toISODate(addMonths(startOfMonth(today), 1)), label: `${formatMonth(start)} → ${formatMonth(today)}`, fileTag: `3mois-${toISODate(start).slice(0, 7)}` };
    }
    case "year": {
      const start = startOfYear(today);
      return { start: toISODate(start), end: toISODate(addMonths(startOfMonth(today), 1)), label: `Année ${today.getFullYear()} (au ${formatDate(todayISO, "d MMMM")})`, fileTag: `annee-${today.getFullYear()}` };
    }
    case "all": {
      const first = transactions.map((t) => t.date).sort()[0] ?? todayISO;
      return { start: first, end: toISODate(addMonths(startOfMonth(today), 1)), label: `Depuis le ${formatDate(first, "d MMMM yyyy")}`, fileTag: "complet" };
    }
    case "month":
    default: {
      const start = startOfMonth(today);
      return { start: toISODate(start), end: toISODate(addMonths(start, 1)), label: formatMonth(today), fileTag: toISODate(start).slice(0, 7) };
    }
  }
}

/** Date de cellule Excel : ExcelJS sérialise en UTC, donc minuit UTC pour afficher le bon jour quel que soit le fuseau. */
function xlDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
}

const TYPE_LABEL = { expense: "Dépense", income: "Revenu", saving: "Épargne" } as const;
const TYPE_TONE: Record<Transaction["type"], Tone> = { expense: "negative", income: "positive", saving: "brand" };

/** Construit le classeur Excel complet. Renvoie le fichier (Uint8Array) et son nom. */
export async function buildFinanceWorkbook(raw: FinanceRaw, today: Date, scope: ExportScope): Promise<{ file: Uint8Array; filename: string }> {
  const data = buildFinanceData(raw, today);
  const s = data.summary;
  const cur = s.currency as Currency;
  const money = moneyFmt(cur);
  const conv = (amount: number, from: Currency) => convert(amount, from, cur, s.rates);
  const todayISO = toISODate(today);
  const owner = raw.profile.display_name || raw.email || "Utilisateur MONY";
  const period = resolvePeriod(scope, today, { start: s.cycle.start, end: s.cycle.end }, raw.transactions);
  const catById = new Map(raw.categories.map((c) => [c.id, c]));
  const goalById = new Map(raw.goals.map((g) => [g.id, g]));
  const debtById = new Map(raw.debts.map((d) => [d.id, d]));
  const methodLabel = new Map(PAYMENT_METHODS.map((m) => [m.value, m.label]));

  // ── Agrégats de la période ──
  const inPeriod = raw.transactions.filter((t) => t.date >= period.start && t.date < period.end && t.date <= todayISO);
  const base = (t: Transaction) => conv(t.amount, t.currency);
  const pIncome = round2(sum(inPeriod.filter((t) => t.type === "income").map(base)));
  const pExpenses = round2(sum(inPeriod.filter((t) => t.type === "expense").map(base)));
  const pSavings = round2(sum(inPeriod.filter((t) => t.type === "saving").map(base)));
  const pAvailable = round2(pIncome - pExpenses - pSavings);
  const byCat: CategorySpend[] = (() => {
    const map = new Map<string | null, CategorySpend>();
    for (const t of inPeriod) {
      if (t.type !== "expense") continue;
      const cat = t.category_id ? catById.get(t.category_id) : undefined;
      const key = cat?.id ?? null;
      const e = map.get(key) ?? { categoryId: key, name: cat?.name ?? "Sans catégorie", icon: cat?.icon ?? "", color: cat?.color ?? "#94A3B8", amount: 0, percent: 0, count: 0 };
      e.amount = round2(e.amount + base(t));
      e.count += 1;
      map.set(key, e);
    }
    return [...map.values()].map((e) => ({ ...e, percent: pExpenses > 0 ? round2((e.amount / pExpenses) * 100) : 0 })).sort((a, b) => b.amount - a.amount);
  })();
  const daysInPeriod = Math.max(1, Math.round((Math.min(Date.parse(period.end), Date.parse(todayISO) + 864e5) - Date.parse(period.start)) / 864e5));
  const now = new Date();

  const wb = newWorkbook(owner);
  wb.title = `MONY · Rapport ${period.label}`;

  // ═══════════════════ FEUILLE 1 — SYNTHÈSE ═══════════════════
  {
    const COLS = 12;
    const ws = addSheet(wb, "Synthèse", "brand");
    let r = titleBand(
      ws,
      {
        title: "Rapport financier personnel",
        subtitle: period.label,
        meta: [
          ["Titulaire", owner],
          ["Période", `${formatDate(period.start, "d MMM yyyy")} → ${formatDate(period.end, "d MMM yyyy")} (exclu)`],
          ["Devise", `${CURRENCIES.find((c) => c.code === cur)?.label ?? cur} (${cur})`],
          ["Édité le", now.toLocaleString("fr-FR")],
        ],
      },
      COLS,
    );
    placeLogo(wb, ws, LOGO_MONY);
    const panelTop = r;

    r = kpiGrid(
      ws,
      r,
      [
        { label: "Revenus", value: pIncome, numFmt: money, sub: `${inPeriod.filter((t) => t.type === "income").length} entrée(s)`, tone: "positive" },
        { label: "Dépenses", value: pExpenses, numFmt: money, sub: `${inPeriod.filter((t) => t.type === "expense").length} dépense(s)`, tone: "negative" },
        { label: "Épargne", value: pSavings, numFmt: money, sub: pIncome > 0 ? `${Math.round((pSavings / pIncome) * 100)} % des revenus` : "—", tone: "brand" },
        { label: "Reste", value: pAvailable, numFmt: money, sub: "revenus − dépenses − épargne", tone: pAvailable < 0 ? "negative" : pAvailable > 0 ? "positive" : "neutral" },
      ],
      4,
    );

    r = sectionBar(ws, r, `Situation au ${formatDate(todayISO, "d MMMM yyyy")}`, COLS);
    r = kvRows(
      ws,
      r,
      [
        { label: "Solde disponible", value: s.balance, numFmt: money, tone: s.balance < 0 ? "negative" : "brand" },
        { label: "Charges récurrentes restantes avant la paie", value: -s.remainingCharges, numFmt: money },
        { label: "Épargne protégée (objectifs du cycle)", value: -s.remainingSavings, numFmt: money },
        ...(s.remainingDebtPayments > 0 ? [{ label: "Mensualités de dettes à payer", value: -s.remainingDebtPayments, numFmt: money }] : []),
        { label: "Argent libre jusqu'à la prochaine paie", value: s.safeToSpend, numFmt: money, tone: s.safeToSpend < 0 ? "negative" : "positive" },
        { label: "Montant quotidien recommandé", value: s.dailyAllowance, numFmt: money, tone: "brand" },
        { label: "Rythme moyen réel (hors charges fixes)", value: s.avgDailySpend, numFmt: money, tone: s.paceRatio !== null && s.paceRatio >= 1.25 ? "warning" : undefined },
        { label: "Prochaine paie", value: xlDate(s.cycle.nextPayday), numFmt: FMT_DATE },
        { label: "Jours restants avant la paie", value: s.cycle.daysRemaining },
        ...(s.salary.configured ? [{ label: "Salaire mensuel configuré", value: s.salary.amount, numFmt: money }] : []),
      ],
      COLS,
    );

    r = sectionBar(ws, r, `Période · ${period.label}`, COLS);
    r = kvRows(
      ws,
      r,
      [
        { label: "Revenus", value: pIncome, numFmt: money, tone: "positive" },
        { label: "Dépenses", value: pExpenses, numFmt: money, tone: "negative" },
        { label: "Épargne mise de côté", value: pSavings, numFmt: money },
        { label: "Reste", value: pAvailable, numFmt: money, tone: pAvailable < 0 ? "negative" : "positive" },
        { label: "Taux d'épargne", value: ratio(pSavings, pIncome), numFmt: FMT_PCT },
        { label: "Part des revenus dépensée", value: ratio(pExpenses, pIncome), numFmt: FMT_PCT, tone: pIncome > 0 && pExpenses / pIncome > 0.9 ? "warning" : undefined },
        { label: "Dépense moyenne par jour", value: round2(pExpenses / daysInPeriod), numFmt: money },
        { label: "Nombre de transactions", value: inPeriod.length },
        { label: "Plus grosse dépense", value: Math.max(0, ...inPeriod.filter((t) => t.type === "expense").map(base)), numFmt: money },
      ],
      COLS,
    );

    if (s.budgets.length > 0) {
      r = sectionBar(ws, r, `Budgets · ${s.month.label}`, COLS);
      r = kvRows(
        ws,
        r,
        s.budgets.map((b) => ({
          label: `${b.category?.icon ?? ""} ${b.category?.name ?? "Catégorie"}`.trim(),
          hint: `${Math.round(b.percent)} % utilisé · budget ${b.amount.toLocaleString("fr-FR")}`,
          value: b.spent,
          numFmt: money,
          tone: (b.state === "exceeded" ? "negative" : b.state === "warning" ? "warning" : "positive") as Tone,
        })),
        COLS,
      );
    }

    if (s.goals.length > 0 || s.debts.length > 0) {
      r = sectionBar(ws, r, "Épargne et dettes", COLS);
      r = kvRows(
        ws,
        r,
        [
          { label: "Total épargné dans les objectifs", value: s.totalSavedInGoals, numFmt: money, tone: "brand" },
          { label: "Objectifs en cours", value: s.goals.filter((g) => g.state !== "reached").length },
          { label: "Objectifs atteints", value: s.goals.filter((g) => g.state === "reached").length, tone: s.goals.some((g) => g.state === "reached") ? "positive" : undefined },
          { label: "Ce que je dois encore", value: s.totalOwed, numFmt: money, tone: s.totalOwed > 0 ? "negative" : "positive" },
          { label: "Ce qu'on me doit", value: s.totalLent, numFmt: money, tone: s.totalLent > 0 ? "info" : undefined },
          { label: "Dettes en retard", value: s.debts.filter((d) => d.state === "overdue").length, tone: s.debts.some((d) => d.state === "overdue") ? "negative" : undefined },
        ],
        COLS,
      );
    }

    if (s.insights.length > 0) {
      r = sectionBar(ws, r, "Analyse automatique", COLS);
      for (const i of s.insights.slice(0, 8)) {
        const tone: Tone = i.severity === "danger" ? "negative" : i.severity === "warning" ? "warning" : i.severity === "success" ? "positive" : "info";
        r = noteRow(ws, r, 1, COLS, `${i.icon} ${i.title}${i.body ? ` — ${i.body}` : ""}`, tone);
      }
    }

    // ── Panneau d'analyse à droite ──
    {
      const A0 = COLS + 2;
      const A1 = A0 + 3;
      ws.getColumn(A0).width = 26;
      ws.getColumn(A0 + 1).width = 12;
      ws.getColumn(A0 + 2).width = 7;
      ws.getColumn(A0 + 3).width = 24;

      let ar = panelTop;
      ar = sideSection(ws, ar, A0, A1, "Où va ton argent ?");
      if (byCat.length === 0) ar = sideEmpty(ws, ar, A0, A1, "Aucune dépense sur la période");
      else ar = sideBars(ws, ar, A0, byCat.slice(0, 10).map((c) => ({ label: `${c.icon} ${c.name}`.trim(), value: c.amount, max: pExpenses, tone: "brand" as Tone, numFmt: money })));

      ar = sideSection(ws, ar, A0, A1, "Revenus vs dépenses");
      const maxFlow = Math.max(pIncome, pExpenses, 1);
      ar = sideBars(ws, ar, A0, [
        { label: "Revenus", value: pIncome, max: maxFlow, tone: "positive", numFmt: money },
        { label: "Dépenses", value: pExpenses, max: maxFlow, tone: "negative", numFmt: money },
        { label: "Épargne", value: pSavings, max: maxFlow, tone: "brand", numFmt: money },
      ]);

      ar = sideSection(ws, ar, A0, A1, "Moyens de paiement");
      const byMethod = new Map<string, number>();
      for (const t of inPeriod) if (t.type === "expense") byMethod.set(t.payment_method, (byMethod.get(t.payment_method) ?? 0) + base(t));
      const methods = [...byMethod.entries()].sort((a, b) => b[1] - a[1]);
      if (methods.length === 0) sideEmpty(ws, ar, A0, A1, "Aucune dépense");
      else sideBars(ws, ar, A0, methods.map(([m, v]) => ({ label: methodLabel.get(m as never) ?? m, value: round2(v), max: pExpenses, tone: "info" as Tone, numFmt: money })));
    }
  }

  // ═══════════════════ FEUILLE 2 — TRANSACTIONS ═══════════════════
  {
    const ws = addSheet(wb, "Transactions", "brand");
    const hr = titleBand(ws, { title: "Transactions", subtitle: `${period.label} · ${inPeriod.length} mouvement(s)`, meta: [] }, 10);
    const sorted = [...inPeriod].sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
    const rows: Cell[][] = sorted.map((t) => {
      const cat = t.category_id ? catById.get(t.category_id) : undefined;
      const signed = t.type === "income" ? t.amount : -t.amount;
      const linked = t.savings_goal_id ? `🎯 ${goalById.get(t.savings_goal_id)?.name ?? ""}` : t.debt_id ? `🧾 ${debtById.get(t.debt_id)?.name ?? ""}` : t.recurring_expense_id ? "🔁 Récurrent" : "";
      return [
        xlDate(t.date),
        { value: TYPE_LABEL[t.type], pill: TYPE_TONE[t.type] },
        cat ? `${cat.icon} ${cat.name}` : "—",
        t.description || cat?.name || "",
        { value: signed, numFmt: moneyFmt(t.currency), tone: t.type === "income" ? "positive" : undefined },
        t.currency !== cur ? { value: t.type === "income" ? base(t) : -base(t), numFmt: money } : { value: "", align: "center" },
        t.currency,
        methodLabel.get(t.payment_method) ?? t.payment_method,
        linked,
        t.notes ?? "",
      ];
    });
    table(
      ws,
      hr,
      [
        { header: "Date", width: 12 },
        { header: "Type", width: 11, align: "center" },
        { header: "Catégorie", width: 22 },
        { header: "Description", width: 32 },
        { header: "Montant", width: 15, align: "right" },
        { header: `Équiv. ${cur}`, width: 14, align: "right" },
        { header: "Devise", width: 8, align: "center" },
        { header: "Paiement", width: 14 },
        { header: "Lié à", width: 22 },
        { header: "Notes", width: 30 },
      ],
      rows,
      {
        emptyLabel: "Aucune transaction sur la période",
        totals: [
          `${inPeriod.length} transaction(s)`,
          "",
          "",
          "Solde de la période",
          { value: pAvailable + pSavings, numFmt: money, tone: pAvailable + pSavings < 0 ? "negative" : "positive" },
          "",
          "",
          "",
          `Revenus ${pIncome.toLocaleString("fr-FR")} · Dépenses ${pExpenses.toLocaleString("fr-FR")}`,
          "",
        ],
      },
    );
    if (raw.transactions.some((t) => t.currency !== cur)) {
      const others = [...new Set(raw.transactions.filter((t) => t.currency !== cur).map((t) => t.currency))];
      ws.getCell(hr - 2, 6).value = `Taux utilisés : ${others.map((c) => describeRate(c, cur, s.rates)).join(" · ")}`;
    }
  }

  // ═══════════════════ FEUILLE 3 — BUDGETS ═══════════════════
  {
    const ws = addSheet(wb, "Budgets", "warning");
    const hr = titleBand(ws, { title: "Budgets", subtitle: `Mois calendaire · ${s.month.label}`, meta: [] }, 6);
    const rows: Cell[][] = s.budgets.map((b) => [
      `${b.category?.icon ?? ""} ${b.category?.name ?? "Catégorie"}`.trim(),
      { value: b.amount, numFmt: money },
      { value: b.spent, numFmt: money },
      { value: b.remaining, numFmt: money, tone: b.remaining < 0 ? "negative" : undefined },
      { value: b.amount > 0 ? b.spent / b.amount : 0, numFmt: FMT_PCT },
      { value: b.state === "exceeded" ? "Dépassé" : b.state === "warning" ? "Presque atteint" : "Sous contrôle", pill: b.state === "exceeded" ? "negative" : b.state === "warning" ? "warning" : "positive" },
    ]);
    const totalB = sum(s.budgets.map((b) => b.amount));
    const spentB = sum(s.budgets.map((b) => b.spent));
    table(
      ws,
      hr,
      [
        { header: "Catégorie", width: 26 },
        { header: "Budget", width: 14, align: "right" },
        { header: "Dépensé", width: 14, align: "right" },
        { header: "Restant", width: 14, align: "right" },
        { header: "Utilisé", width: 10, align: "right" },
        { header: "Statut", width: 18, align: "center" },
      ],
      rows,
      {
        emptyLabel: "Aucun budget défini",
        totals: [`${s.budgets.length} budget(s)`, { value: totalB, numFmt: money }, { value: spentB, numFmt: money }, { value: totalB - spentB, numFmt: money }, { value: ratio(spentB, totalB), numFmt: FMT_PCT }, ""],
      },
    );
  }

  // ═══════════════════ FEUILLE 4 — OBJECTIFS ═══════════════════
  {
    const ws = addSheet(wb, "Objectifs", "positive");
    const hr = titleBand(ws, { title: "Objectifs d'épargne", subtitle: `Total épargné : ${s.totalSavedInGoals.toLocaleString("fr-FR")} ${cur}`, meta: [] }, 9);
    const rows: Cell[][] = s.goals.map((g) => [
      `${g.goal.icon} ${g.goal.name}`,
      { value: conv(g.goal.target_amount, g.goal.currency), numFmt: money },
      { value: g.saved, numFmt: money, tone: "positive" },
      { value: g.remaining, numFmt: money },
      { value: g.percent / 100, numFmt: FMT_PCT },
      g.goal.target_date ? xlDate(g.goal.target_date) : "—",
      g.goal.monthly_contribution ? { value: conv(g.goal.monthly_contribution, g.goal.currency), numFmt: money } : "—",
      g.requiredMonthly !== null ? { value: g.requiredMonthly, numFmt: money } : "—",
      { value: g.state === "reached" ? "Atteint" : g.state === "behind" ? "En retard" : g.state === "on_track" ? "En bonne voie" : "Sans échéance", pill: g.state === "reached" ? "positive" : g.state === "behind" ? "warning" : g.state === "on_track" ? "info" : "neutral" },
    ]);
    table(
      ws,
      hr,
      [
        { header: "Objectif", width: 26 },
        { header: "Cible", width: 14, align: "right" },
        { header: "Épargné", width: 14, align: "right" },
        { header: "Restant", width: 14, align: "right" },
        { header: "Progression", width: 12, align: "right" },
        { header: "Échéance", width: 12 },
        { header: "Mensualité prévue", width: 16, align: "right" },
        { header: "Requis / mois", width: 14, align: "right" },
        { header: "Statut", width: 16, align: "center" },
      ],
      rows,
      { emptyLabel: "Aucun objectif d'épargne" },
    );
  }

  // ═══════════════════ FEUILLE 5 — DETTES ═══════════════════
  {
    const ws = addSheet(wb, "Dettes", "negative");
    const hr = titleBand(ws, { title: "Dettes", subtitle: `Je dois ${s.totalOwed.toLocaleString("fr-FR")} ${cur} · On me doit ${s.totalLent.toLocaleString("fr-FR")} ${cur}`, meta: [] }, 11);
    const rows: Cell[][] = s.debts.map((d) => [
      d.debt.name,
      { value: d.debt.direction === "owed" ? "Je dois" : "On me doit", pill: d.debt.direction === "owed" ? "negative" : "info" },
      d.debt.counterparty ?? "—",
      { value: d.principal, numFmt: money },
      { value: d.repaid, numFmt: money, tone: "positive" },
      { value: d.remaining, numFmt: money, tone: d.remaining > 0 && d.debt.direction === "owed" ? "negative" : undefined },
      { value: d.percent / 100, numFmt: FMT_PCT },
      d.debt.due_date ? xlDate(d.debt.due_date) : "—",
      d.debt.monthly_payment ? { value: conv(d.debt.monthly_payment, d.debt.currency), numFmt: money } : "—",
      {
        value: d.state === "settled" ? "Liquidée" : d.state === "overdue" ? "En retard" : d.state === "behind" ? "Mensualité insuffisante" : d.state === "on_track" ? "En cours" : "Sans échéance",
        pill: d.state === "settled" ? "positive" : d.state === "overdue" ? "negative" : d.state === "behind" ? "warning" : d.state === "on_track" ? "info" : "neutral",
      },
      d.debt.settled_at ? xlDate(d.debt.settled_at) : d.projectedSettleDate ? { value: xlDate(d.projectedSettleDate), numFmt: FMT_DATE, tone: "neutral" as Tone } : "—",
    ]);
    table(
      ws,
      hr,
      [
        { header: "Dette", width: 24 },
        { header: "Sens", width: 12, align: "center" },
        { header: "Contrepartie", width: 18 },
        { header: "Capital", width: 13, align: "right" },
        { header: "Remboursé", width: 13, align: "right" },
        { header: "Restant", width: 13, align: "right" },
        { header: "Avancement", width: 12, align: "right" },
        { header: "Échéance", width: 12 },
        { header: "Mensualité", width: 13, align: "right" },
        { header: "Statut", width: 20, align: "center" },
        { header: "Liquidée le / prévue", width: 18 },
      ],
      rows,
      { emptyLabel: "Aucune dette enregistrée" },
    );
  }

  // ═══════════════════ FEUILLE 6 — CHARGES RÉCURRENTES ═══════════════════
  {
    const ws = addSheet(wb, "Charges récurrentes", "info");
    const monthly = (r: FinanceRaw["recurring"][number]) => monthlyEquivalent(conv(r.amount, r.currency), r.frequency, r.weekdays);
    const totalMonthly = round2(sum(raw.recurring.filter((r) => r.is_active).map(monthly)));
    const hr = titleBand(ws, { title: "Charges récurrentes", subtitle: `Charge mensuelle équivalente : ${totalMonthly.toLocaleString("fr-FR")} ${cur}`, meta: [] }, 7);
    const rows: Cell[][] = raw.recurring.map((rc) => {
      const cat = rc.category_id ? catById.get(rc.category_id) : undefined;
      return [
        rc.name,
        { value: rc.amount, numFmt: moneyFmt(rc.currency) },
        rc.frequency === "weekly" && rc.weekdays?.length ? `Chaque semaine · ${describeWeekdays(rc.weekdays)}` : (FREQUENCIES.find((f) => f.value === rc.frequency)?.label ?? rc.frequency),
        { value: round2(monthly(rc)), numFmt: money },
        xlDate(rc.next_date),
        cat ? `${cat.icon} ${cat.name}` : "—",
        { value: rc.is_active ? "Active" : "En pause", pill: rc.is_active ? "positive" : "neutral" },
      ];
    });
    table(
      ws,
      hr,
      [
        { header: "Charge", width: 26 },
        { header: "Montant", width: 14, align: "right" },
        { header: "Fréquence", width: 16 },
        { header: "Équiv. / mois", width: 14, align: "right" },
        { header: "Prochaine échéance", width: 18 },
        { header: "Catégorie", width: 22 },
        { header: "Statut", width: 12, align: "center" },
      ],
      rows,
      { emptyLabel: "Aucune charge récurrente", totals: [`${raw.recurring.length} charge(s)`, "", "", { value: totalMonthly, numFmt: money }, "", "", ""] },
    );
  }

  // ═══════════════════ FEUILLE 7 — GRAPHIQUES ═══════════════════
  const charts: ChartSpec[] = [];
  {
    const ws = addSheet(wb, "Graphiques", "brand", "portrait");
    const hr = titleBand(ws, { title: "Graphiques", subtitle: "Six derniers mois et répartition de la période", meta: [] }, 6);

    // Tableau 1 : tendance mensuelle
    const trend = s.monthlyTrend;
    const rows: Cell[][] = trend.map((m) => [m.label, { value: m.income, numFmt: money }, { value: m.expenses, numFmt: money }, { value: m.savings, numFmt: money }, { value: round2(m.income - m.expenses - m.savings), numFmt: money }]);
    let r = table(ws, hr, [
      { header: "Mois", width: 12 },
      { header: "Revenus", width: 16, align: "right" },
      { header: "Dépenses", width: 16, align: "right" },
      { header: "Épargne", width: 16, align: "right" },
      { header: "Reste", width: 16, align: "right" },
    ], rows, { emptyLabel: "Aucune donnée", freeze: false });
    const t0 = hr + 1;
    const t1 = hr + trend.length;
    const col = (letter: string) => `Graphiques!$${letter}$${t0}:$${letter}$${t1}`;
    const chartTop = r + 1;
    charts.push({
      type: "column",
      title: "Revenus, dépenses et épargne par mois",
      categories: { ref: col("A"), labels: trend.map((m) => m.label) },
      anchor: { fromCol: 0, fromRow: chartTop, toCol: 6, toRow: chartTop + 18 },
      series: [
        { name: "Revenus", color: "15803D", ref: col("B"), values: trend.map((m) => m.income) },
        { name: "Dépenses", color: "DC2626", ref: col("C"), values: trend.map((m) => m.expenses) },
        { name: "Épargne", color: "2DD4BF", ref: col("D"), values: trend.map((m) => m.savings) },
      ],
    });
    charts.push({
      type: "line",
      title: "Reste à la fin de chaque mois",
      categories: { ref: col("A"), labels: trend.map((m) => m.label) },
      anchor: { fromCol: 0, fromRow: chartTop + 20, toCol: 6, toRow: chartTop + 36 },
      series: [{ name: "Reste", color: "0B1220", ref: col("E"), values: trend.map((m) => round2(m.income - m.expenses - m.savings)) }],
    });

    // Tableau 2 : catégories de la période (sous les graphiques)
    r = chartTop + 39;
    r = sectionBar(ws, r, `Dépenses par catégorie · ${period.label}`, 6);
    const catRows: Cell[][] = byCat.map((c) => [`${c.icon} ${c.name}`.trim(), { value: c.amount, numFmt: money }, { value: c.percent / 100, numFmt: FMT_PCT }, c.count]);
    const catHeader = r;
    // en-tête + lignes sans re-figer la vue
    const after = table(ws, catHeader, [
      { header: "Catégorie", width: 12 },
      { header: "Montant", width: 16, align: "right" },
      { header: "Part", width: 16, align: "right" },
      { header: "Nb", width: 16, align: "right" },
    ], catRows, { emptyLabel: "Aucune dépense sur la période", freeze: false });
    // rétablit les largeurs du tableau 1 (partagées par les colonnes)
    ws.getColumn(1).width = 24;
    ws.getColumn(2).width = 16;
    ws.getColumn(3).width = 16;
    ws.getColumn(4).width = 16;
    ws.getColumn(5).width = 16;
    if (byCat.length > 0) {
      const c0 = catHeader + 1;
      const c1 = catHeader + byCat.length;
      const top = byCat.slice(0, 8);
      charts.push({
        type: "pie",
        title: "Où va ton argent ?",
        categories: { ref: `Graphiques!$A$${c0}:$A$${c0 + top.length - 1}`, labels: top.map((c) => c.name) },
        anchor: { fromCol: 0, fromRow: after + 1, toCol: 6, toRow: after + 20 },
        pointColors: top.map((c) => c.color.replace("#", "").toUpperCase().padEnd(6, "0")),
        series: [{ name: "Dépenses", color: "0B1220", ref: `Graphiques!$B$${c0}:$B$${Math.min(c1, c0 + top.length - 1)}`, values: top.map((c) => c.amount) }],
      });
    }
    ws.autoFilter = undefined;
  }

  const buffer = await workbookBuffer(wb);
  const file = charts.length > 0 ? await injectNativeCharts(buffer, "Graphiques", charts) : new Uint8Array(buffer);
  return { file, filename: `MONY-rapport-${period.fileTag}.xlsx` };
}

export interface FinanceExports {
  period: Period;
  currency: Currency;
  stats: { income: number; expenses: number; savings: number; available: number; count: number };
  xlsx: { filename: string; file: Uint8Array };
  csv: { filename: string; content: string };
}

/** Les deux formats (Excel + CSV) pour un même périmètre, prêts à être envoyés ou téléchargés. */
export async function buildFinanceExports(raw: FinanceRaw, today: Date, scope: ExportScope): Promise<FinanceExports> {
  const data = buildFinanceData(raw, today);
  const s = data.summary;
  const cur = s.currency as Currency;
  const todayISO = toISODate(today);
  const period = resolvePeriod(scope, today, { start: s.cycle.start, end: s.cycle.end }, raw.transactions);
  const inPeriod = raw.transactions.filter((t) => t.date >= period.start && t.date < period.end && t.date <= todayISO);
  const base = (t: Transaction) => convert(t.amount, t.currency, cur, s.rates);
  const income = round2(sum(inPeriod.filter((t) => t.type === "income").map(base)));
  const expenses = round2(sum(inPeriod.filter((t) => t.type === "expense").map(base)));
  const savings = round2(sum(inPeriod.filter((t) => t.type === "saving").map(base)));

  const xlsx = await buildFinanceWorkbook(raw, today, scope);
  const csv = transactionsToCsv(inPeriod, raw.categories, raw.goals, raw.debts);
  return {
    period,
    currency: cur,
    stats: { income, expenses, savings, available: round2(income - expenses - savings), count: inPeriod.length },
    xlsx,
    csv: { filename: `MONY-transactions-${period.fileTag}.csv`, content: csv },
  };
}
