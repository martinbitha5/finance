import type { FinanceSummary, Insight } from "./types";
import { formatMoney, formatPercent } from "@/lib/format";

/**
 * Rule-based analysis of the user's real numbers. Every message is derived from the summary —
 * nothing is invented. Order = display priority.
 */
export function buildInsights(s: FinanceSummary): Insight[] {
  const out: Insight[] = [];
  const cur = s.currency;
  const money = (n: number) => formatMoney(n, cur);
  const hasData = s.month.expenses > 0 || s.month.income > 0 || s.cycle.income > 0;

  if (!hasData) return out;

  // Low balance / negative safe-to-spend
  if (s.safeToSpend < 0) {
    out.push({
      id: "negative_safe",
      kind: "low_balance",
      severity: "danger",
      icon: "🔴",
      title: `Il te manque ${money(Math.abs(s.safeToSpend))} pour couvrir tes charges et ton épargne d'ici la prochaine paie.`,
      body: "Réduis les dépenses non essentielles ou ajuste ton épargne du mois.",
      href: "/recurrents",
    });
  } else if (s.cycle.income > 0 && s.safeToSpend < s.cycle.income * 0.1 && s.cycle.daysRemaining > 5) {
    out.push({
      id: "low_balance",
      kind: "low_balance",
      severity: "warning",
      icon: "⚠️",
      title: `Solde faible : il te reste ${money(s.safeToSpend)} pour ${s.cycle.daysRemaining} jours.`,
      body: `Soit environ ${money(s.dailyAllowance)} par jour.`,
    });
  }

  // Pace
  if (s.paceRatio !== null && s.cycle.daysElapsed >= 3) {
    if (s.paceRatio >= 1.25) {
      out.push({
        id: "pace_high",
        kind: "pace",
        severity: "danger",
        icon: "🔴",
        title: `Attention : ton rythme de dépenses est élevé (${money(s.avgDailySpend)}/jour).`,
        body: `Ton budget quotidien de départ était de ${money(s.initialDailyAllowance)}.`,
      });
    } else if (s.paceRatio <= 0.75 && s.avgDailySpend > 0) {
      out.push({
        id: "pace_good",
        kind: "pace",
        severity: "success",
        icon: "🟢",
        title: `Bon rythme : tu dépenses ${money(s.avgDailySpend)}/jour, sous ton budget de ${money(s.initialDailyAllowance)}.`,
      });
    }
  }

  // Projection
  if (s.cycle.daysRemaining > 1 && (s.avgDailySpend > 0 || s.remainingCharges > 0)) {
    if (s.projectedRemaining >= 0) {
      out.push({
        id: "projection",
        kind: "projection",
        severity: "info",
        icon: "💡",
        title: `Si tu continues à ce rythme, il te restera environ ${money(s.projectedRemaining)} avant ta prochaine paie.`,
      });
    } else {
      out.push({
        id: "projection_negative",
        kind: "projection",
        severity: "danger",
        icon: "🔴",
        title: `À ce rythme, tu seras à court de ${money(Math.abs(s.projectedRemaining))} avant ta prochaine paie.`,
        body: `Vise ${money(s.dailyAllowance)} par jour maximum pour tenir jusqu'au ${s.cycle.nextPayday.split("-").reverse().join("/")}.`,
      });
    }
  }

  // Top category share of income
  const top = s.month.byCategory[0];
  const incomeRef = s.month.income > 0 ? s.month.income : s.salary.amount;
  if (top && incomeRef > 0) {
    const share = (top.amount / incomeRef) * 100;
    if (share >= 25) {
      out.push({
        id: `share_${top.categoryId}`,
        kind: "category_share",
        severity: share >= 40 ? "danger" : "warning",
        icon: "⚠️",
        title: `Tu as dépensé ${formatPercent(share)} de ton salaire en ${top.name.toLowerCase()} ce mois-ci.`,
        body: `${money(top.amount)} sur ${top.count} dépense${top.count > 1 ? "s" : ""}.`,
        href: "/analyse",
      });
    }
  }

  // Month over month
  if (s.monthChange.expensesPct !== null && s.previousMonth.expenses > 0) {
    const p = s.monthChange.expensesPct;
    if (p >= 10) {
      out.push({
        id: "mom_up",
        kind: "month_change",
        severity: "danger",
        icon: "🔴",
        title: `Tes dépenses sont ${formatPercent(p)} plus élevées que le mois dernier.`,
        body: `${money(s.month.expenses)} contre ${money(s.previousMonth.expenses)}.`,
        href: "/rapport",
      });
    } else if (p <= -10) {
      out.push({
        id: "mom_down",
        kind: "month_change",
        severity: "success",
        icon: "🟢",
        title: `Tes dépenses ont baissé de ${formatPercent(Math.abs(p))} par rapport au mois dernier.`,
        href: "/rapport",
      });
    }
  }

  // Unusual category increase
  for (const c of s.month.byCategory.slice(0, 5)) {
    const prev = s.previousMonth.byCategory.find((p) => p.categoryId === c.categoryId);
    if (prev && prev.amount > 0 && c.amount >= prev.amount * 1.4 && c.amount - prev.amount >= Math.max(10, incomeRef * 0.03)) {
      out.push({
        id: `spike_${c.categoryId}`,
        kind: "category_spike",
        severity: "warning",
        icon: "📈",
        title: `${c.icon} ${c.name} : ${money(c.amount)} ce mois-ci, contre ${money(prev.amount)} le mois dernier.`,
        href: "/analyse",
      });
    }
  }

  // Budgets
  for (const b of s.budgets) {
    if (!b.category) continue;
    if (b.state === "exceeded") {
      out.push({
        id: `budget_over_${b.budget.id}`,
        kind: "budget_exceeded",
        severity: "danger",
        icon: "🔴",
        title: `Budget ${b.category.name.toLowerCase()} dépassé de ${money(Math.abs(b.remaining))}.`,
        href: "/budgets",
      });
    } else if (b.state === "warning") {
      out.push({
        id: `budget_warn_${b.budget.id}`,
        kind: "budget_warning",
        severity: "warning",
        icon: "⚠️",
        title: `Il te reste seulement ${money(b.remaining)} pour ${b.category.name.toLowerCase()}.`,
        body: `${formatPercent(b.percent)} du budget utilisé.`,
        href: "/budgets",
      });
    }
  }

  // Savings
  if (s.month.savings > 0) {
    out.push({
      id: "saved",
      kind: "savings",
      severity: "success",
      icon: "🟢",
      title: `Tu as réussi à économiser ${money(s.month.savings)} ce mois-ci.`,
      href: "/objectifs",
    });
  }

  // Goals
  for (const g of s.goals) {
    if (g.state === "reached" && !g.goal.is_completed) {
      out.push({
        id: `goal_reached_${g.goal.id}`,
        kind: "goal_reached",
        severity: "success",
        icon: "🎯",
        title: `Objectif atteint : ${g.goal.name} (${money(g.saved)}) !`,
        href: "/objectifs",
      });
    } else if (g.state === "behind" && g.requiredMonthly !== null) {
      out.push({
        id: `goal_behind_${g.goal.id}`,
        kind: "goal_behind",
        severity: "warning",
        icon: "🐢",
        title: `${g.goal.name} : tu es en retard sur ton objectif.`,
        body: `Mets ${money(g.requiredMonthly)}/mois de côté pour l'atteindre à temps.`,
        href: "/objectifs",
      });
    } else if (g.state !== "reached" && g.percent >= 90) {
      out.push({
        id: `goal_near_${g.goal.id}`,
        kind: "goal_near",
        severity: "info",
        icon: "🎯",
        title: `Tu es à ${formatPercent(g.percent)} de ton objectif ${g.goal.name}.`,
        href: "/objectifs",
      });
    }
  }

  // Salary arriving soon
  if (s.salary.configured && s.cycle.daysRemaining <= 3) {
    out.push({
      id: "salary_soon",
      kind: "salary_soon",
      severity: "info",
      icon: "💰",
      title: s.cycle.daysRemaining === 1 ? "Ton salaire arrive demain." : `Ton salaire arrive dans ${s.cycle.daysRemaining} jours.`,
    });
  }

  return out;
}
