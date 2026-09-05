import { addMonths, differenceInCalendarDays, differenceInCalendarMonths, parseISO } from "date-fns";
import type { DateRange, Debt, DebtStatus, Transaction } from "./types";
import type { Currency } from "@/lib/constants";
import { convert } from "./currency";
import { inRange } from "./cycles";
import { toISODate } from "@/lib/format";
import { round2, sum } from "@/lib/utils";

/**
 * Debt status for every debt (active and settled).
 * - owed : I borrowed. Repayments are expense transactions with debt_id.
 * - lent : I lent money. Money received back = income transactions with debt_id.
 * The initial disbursement (money received / given) is also linked to the debt but is not a repayment;
 * it is identified by its type (income for owed, expense for lent).
 */
export function computeDebts(
  debts: Debt[],
  transactions: (Transaction & { base: number })[],
  today: Date,
  cycle: DateRange,
  currency: Currency,
  rates: Record<Currency, number>,
): DebtStatus[] {
  const todayISO = toISODate(today);
  return debts
    .map((d) => {
      const principal = convert(d.principal, d.currency, currency, rates);
      const repayType = d.direction === "owed" ? "expense" : "income";
      const repayments = transactions.filter((t) => t.debt_id === d.id && t.type === repayType && t.date <= todayISO);
      const repaid = round2(sum(repayments.map((t) => t.base)));
      const remaining = round2(Math.max(0, principal - repaid));
      const percent = principal > 0 ? Math.min(100, round2((repaid / principal) * 100)) : 0;
      const settled = d.is_settled || remaining <= 0;
      const monthly = d.monthly_payment ? convert(d.monthly_payment, d.currency, currency, rates) : 0;

      const paidThisCycle = round2(sum(repayments.filter((t) => inRange(t.date, cycle)).map((t) => t.base)));
      const dueThisCycle = settled || d.direction !== "owed" ? 0 : round2(Math.max(0, Math.min(remaining, monthly) - paidThisCycle));

      let monthsLeft: number | null = null;
      let daysLeft: number | null = null;
      let requiredMonthly: number | null = null;
      if (d.due_date) {
        const due = parseISO(d.due_date);
        daysLeft = differenceInCalendarDays(due, today);
        monthsLeft = Math.max(0, differenceInCalendarMonths(due, today));
        requiredMonthly = settled ? 0 : monthsLeft > 0 ? round2(remaining / monthsLeft) : remaining;
      }

      let monthsAtPlan: number | null = null;
      let projectedSettleDate: string | null = null;
      if (!settled && monthly > 0) {
        monthsAtPlan = Math.ceil((remaining - paidThisCycle > 0 ? remaining - paidThisCycle : 0) / monthly) + (paidThisCycle > 0 ? 0 : 0);
        if (remaining <= paidThisCycle) monthsAtPlan = 0;
        projectedSettleDate = toISODate(addMonths(today, Math.max(0, monthsAtPlan)));
      }

      let state: DebtStatus["state"];
      if (settled) state = "settled";
      else if (d.due_date && daysLeft !== null && daysLeft < 0) state = "overdue";
      else if (d.due_date && monthly > 0 && requiredMonthly !== null && monthly + 0.01 < requiredMonthly) state = "behind";
      else if (monthly > 0 || d.due_date) state = "on_track";
      else state = "no_plan";

      const lastPaymentDate = repayments.length ? repayments.map((t) => t.date).sort().at(-1) ?? null : null;

      return {
        debt: d,
        principal,
        repaid,
        remaining,
        percent,
        monthsLeft,
        daysLeft,
        requiredMonthly,
        projectedSettleDate,
        monthsAtPlan,
        paidThisCycle,
        dueThisCycle,
        state,
        lastPaymentDate,
      };
    })
    .sort((a, b) => {
      const rank = (s: DebtStatus) => (s.state === "overdue" ? 0 : s.state === "behind" ? 1 : s.state === "settled" ? 3 : 2);
      return rank(a) - rank(b) || (a.debt.due_date ?? "9999").localeCompare(b.debt.due_date ?? "9999");
    });
}
