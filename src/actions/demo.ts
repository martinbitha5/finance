"use server";

import { addDays, addMonths, subMonths, parseISO } from "date-fns";
import { requireUser, revalidateApp, run, type ActionResult } from "./_helpers";
import { getToday } from "@/services/today";
import { getPayCycle, paydayInMonth, occurrencesInRange, advance } from "@/lib/finance/cycles";
import { toISODate } from "@/lib/format";

/** Small seeded PRNG so the demo is deterministic. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const POOL: { slug: string; desc: string; min: number; max: number; weight: number; method: "cash" | "card" | "mobile_money" }[] = [
  { slug: "food", desc: "Restaurant", min: 6, max: 14, weight: 5, method: "cash" },
  { slug: "food", desc: "Marché", min: 8, max: 20, weight: 4, method: "cash" },
  { slug: "food", desc: "Café", min: 1.5, max: 3.5, weight: 6, method: "cash" },
  { slug: "food", desc: "Snack", min: 2, max: 5, weight: 5, method: "cash" },
  { slug: "food", desc: "Courses", min: 12, max: 28, weight: 2, method: "card" },
  { slug: "transport", desc: "Taxi", min: 2, max: 5, weight: 6, method: "cash" },
  { slug: "transport", desc: "Bus", min: 0.5, max: 1.5, weight: 5, method: "cash" },
  { slug: "transport", desc: "Moto-taxi", min: 1, max: 3, weight: 4, method: "cash" },
  { slug: "transport", desc: "Carburant", min: 10, max: 20, weight: 1, method: "mobile_money" },
  { slug: "phone", desc: "Recharge téléphone", min: 3, max: 6, weight: 2, method: "mobile_money" },
  { slug: "shopping", desc: "Vêtements", min: 15, max: 35, weight: 1, method: "card" },
  { slug: "shopping", desc: "Accessoires", min: 5, max: 15, weight: 1, method: "cash" },
  { slug: "leisure", desc: "Cinéma", min: 5, max: 8, weight: 1, method: "card" },
  { slug: "leisure", desc: "Sortie", min: 8, max: 18, weight: 2, method: "cash" },
  { slug: "leisure", desc: "Jeux", min: 3, max: 10, weight: 1, method: "card" },
  { slug: "health", desc: "Pharmacie", min: 4, max: 12, weight: 1, method: "cash" },
  { slug: "family", desc: "Aide famille", min: 10, max: 25, weight: 1, method: "mobile_money" },
  { slug: "other", desc: "Coiffeur", min: 5, max: 8, weight: 1, method: "cash" },
  { slug: "other", desc: "Divers", min: 2, max: 9, weight: 2, method: "cash" },
];

async function deleteDemoRows(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], userId: string) {
  await supabase.from("transactions").delete().eq("user_id", userId).eq("is_demo", true);
  await supabase.from("budgets").delete().eq("user_id", userId).eq("is_demo", true);
  await supabase.from("recurring_expenses").delete().eq("user_id", userId).eq("is_demo", true);
  await supabase.from("savings_goals").delete().eq("user_id", userId).eq("is_demo", true);
  await supabase.from("income").delete().eq("user_id", userId).eq("is_demo", true);
  await supabase.from("notifications").delete().eq("user_id", userId);
}

/** Loads a realistic, deterministic dataset for the current user (salary 650 $, paid on the 5th). */
export async function loadDemoData(): Promise<ActionResult<null>> {
  return run(async () => {
    const { supabase, user } = await requireUser();
    const today = await getToday();
    const todayISO = toISODate(today);
    const rand = mulberry32(20260905);

    await deleteDemoRows(supabase, user.id);

    const { data: cats } = await supabase.from("categories").select("id, slug").eq("user_id", user.id);
    const bySlug = new Map((cats ?? []).filter((c) => c.slug).map((c) => [c.slug as string, c.id]));
    const cat = (slug: string) => bySlug.get(slug) ?? null;

    // Any existing (non-demo) salary is deactivated so the demo salary drives the cycle.
    await supabase.from("income").update({ is_active: false }).eq("user_id", user.id).eq("type", "salary").eq("is_demo", false);

    const PAY_DAY = 5;
    const SALARY = 650;
    const { data: salary, error: salaryErr } = await supabase
      .from("income")
      .insert({
        user_id: user.id,
        type: "salary",
        label: "Salaire",
        amount: SALARY,
        currency: "USD",
        is_recurring: true,
        frequency: "monthly",
        pay_day: PAY_DAY,
        is_variable: false,
        is_demo: true,
      })
      .select("id")
      .single();
    if (salaryErr) return { ok: false, error: salaryErr.message };

    const cycle = getPayCycle(today, PAY_DAY);
    const cycleStart = parseISO(cycle.start);
    const historyStart = subMonths(cycleStart, 2); // 3 cycles of history

    type TxRow = {
      user_id: string;
      type: "expense" | "income" | "saving";
      amount: number;
      currency: "USD";
      category_id: string | null;
      description: string;
      date: string;
      payment_method: "cash" | "card" | "mobile_money" | "transfer" | "other";
      income_id?: string | null;
      savings_goal_id?: string | null;
      recurring_expense_id?: string | null;
      is_demo: true;
    };
    const rows: TxRow[] = [];

    // Salaries on each payday of the history window
    for (let i = 2; i >= 0; i--) {
      const d = paydayInMonth(subMonths(cycleStart, i), PAY_DAY);
      rows.push({
        user_id: user.id,
        type: "income",
        amount: SALARY,
        currency: "USD",
        category_id: cat("salary"),
        description: "Salaire",
        date: toISODate(d),
        payment_method: "transfer",
        income_id: salary.id,
        is_demo: true,
      });
    }
    // A small freelance bonus last month
    rows.push({
      user_id: user.id,
      type: "income",
      amount: 80,
      currency: "USD",
      category_id: cat("freelance"),
      description: "Mission freelance",
      date: toISODate(addDays(subMonths(cycleStart, 1), 12)),
      payment_method: "mobile_money",
      is_demo: true,
    });

    // Recurring expenses
    const recurringDefs = [
      { name: "Loyer", amount: 150, slug: "housing", day: 15, method: "cash" as const },
      { name: "Internet", amount: 30, slug: "phone", day: 10, method: "mobile_money" as const },
      { name: "Netflix", amount: 10, slug: "subscriptions", day: 12, method: "card" as const },
    ];
    for (const r of recurringDefs) {
      // occurrences from history start up to today are posted; next_date is the first future one
      const range = { start: toISODate(historyStart), end: toISODate(addMonths(today, 2)) };
      const first = paydayInMonth(historyStart, r.day);
      const occ = occurrencesInRange(toISODate(first), "monthly", r.day, range);
      const past = occ.filter((d) => d <= todayISO);
      let next = occ.find((d) => d > todayISO);
      if (!next) next = toISODate(advance(parseISO(past[past.length - 1] ?? todayISO), "monthly", r.day));
      const { data: rec, error } = await supabase
        .from("recurring_expenses")
        .insert({
          user_id: user.id,
          name: r.name,
          amount: r.amount,
          currency: "USD",
          category_id: cat(r.slug),
          frequency: "monthly",
          day_of_month: r.day,
          next_date: next,
          payment_method: r.method,
          is_active: true,
          is_demo: true,
        })
        .select("id")
        .single();
      if (error) return { ok: false, error: error.message };
      for (const d of past) {
        rows.push({
          user_id: user.id,
          type: "expense",
          amount: r.amount,
          currency: "USD",
          category_id: cat(r.slug),
          description: r.name,
          date: d,
          payment_method: r.method,
          recurring_expense_id: rec.id,
          is_demo: true,
        });
      }
    }

    // Budgets
    const budgetDefs = [
      { slug: "food", amount: 120 },
      { slug: "transport", amount: 70 },
      { slug: "leisure", amount: 40 },
      { slug: "shopping", amount: 50 },
    ];
    for (const b of budgetDefs) {
      const id = cat(b.slug);
      if (!id) continue;
      await supabase
        .from("budgets")
        .upsert({ user_id: user.id, category_id: id, amount: b.amount, currency: "USD", alert_threshold: 80, is_demo: true }, { onConflict: "user_id,category_id" });
    }

    // Goals
    const { data: macbook } = await supabase
      .from("savings_goals")
      .insert({
        user_id: user.id,
        name: "MacBook",
        icon: "💻",
        kind: "custom",
        target_amount: 1500,
        initial_amount: 250,
        currency: "USD",
        target_date: toISODate(addMonths(today, 11)),
        monthly_contribution: 100,
        is_demo: true,
      })
      .select("id")
      .single();
    const { data: emergency } = await supabase
      .from("savings_goals")
      .insert({
        user_id: user.id,
        name: "Fonds d'urgence",
        icon: "🛟",
        kind: "emergency",
        target_amount: 500,
        initial_amount: 120,
        currency: "USD",
        target_date: null,
        monthly_contribution: 50,
        is_demo: true,
      })
      .select("id")
      .single();

    // Savings contributions: 100 to MacBook right after each payday, 50 to emergency
    for (let i = 2; i >= 0; i--) {
      const payday = paydayInMonth(subMonths(cycleStart, i), PAY_DAY);
      const d1 = toISODate(addDays(payday, 1));
      if (d1 <= todayISO && macbook) {
        rows.push({ user_id: user.id, type: "saving", amount: 100, currency: "USD", category_id: cat("saving"), description: "Épargne · MacBook", date: d1, payment_method: "transfer", savings_goal_id: macbook.id, is_demo: true });
      }
      const d2 = toISODate(addDays(payday, 2));
      if (d2 <= todayISO && emergency && i > 0) {
        rows.push({ user_id: user.id, type: "saving", amount: 50, currency: "USD", category_id: cat("saving"), description: "Épargne · Fonds d'urgence", date: d2, payment_method: "mobile_money", savings_goal_id: emergency.id, is_demo: true });
      }
    }

    // Day-to-day expenses (deterministic pseudo-random), ~9 $/day on average, a bit heavier last month
    const totalWeight = POOL.reduce((a, p) => a + p.weight, 0);
    const pick = () => {
      let r = rand() * totalWeight;
      for (const p of POOL) {
        r -= p.weight;
        if (r <= 0) return p;
      }
      return POOL[0];
    };
    for (let d = historyStart; toISODate(d) <= todayISO; d = addDays(d, 1)) {
      const iso = toISODate(d);
      const inPrevMonth = iso >= toISODate(subMonths(cycleStart, 1)) && iso < cycle.start;
      const n = rand() < 0.15 ? 0 : rand() < 0.55 ? 1 : rand() < 0.8 ? 2 : 3;
      for (let k = 0; k < n; k++) {
        const p = pick();
        const base = p.min + rand() * (p.max - p.min);
        const amount = Math.round(base * (inPrevMonth ? 1.12 : 1) * 2) / 2;
        rows.push({
          user_id: user.id,
          type: "expense",
          amount,
          currency: "USD",
          category_id: cat(p.slug),
          description: p.desc,
          date: iso,
          payment_method: p.method,
          is_demo: true,
        });
      }
    }

    // A couple of signature items this cycle so the dashboard tells a story
    if (cycle.daysElapsed >= 3) {
      rows.push({ user_id: user.id, type: "expense", amount: 32, currency: "USD", category_id: cat("shopping"), description: "Chaussures", date: toISODate(addDays(cycleStart, 2)), payment_method: "card", is_demo: true });
    }

    const { error: txErr } = await supabase.from("transactions").insert(rows);
    if (txErr) return { ok: false, error: txErr.message };

    await supabase.from("settings").update({ demo_loaded: true }).eq("user_id", user.id);
    await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
    revalidateApp();
    return { ok: true, data: null };
  });
}

/** Removes every demo row (keeps the user's own data). */
export async function clearDemoData(): Promise<ActionResult<null>> {
  return run(async () => {
    const { supabase, user } = await requireUser();
    await deleteDemoRows(supabase, user.id);
    await supabase.from("income").update({ is_active: true }).eq("user_id", user.id).eq("type", "salary").eq("is_demo", false);
    await supabase.from("settings").update({ demo_loaded: false }).eq("user_id", user.id);
    revalidateApp();
    return { ok: true, data: null };
  });
}
