import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { FinanceSummary } from "@/lib/finance/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Insight kinds that deserve a persistent notification (not every insight is worth a ping). */
const NOTIFY_KINDS = new Set([
  "budget_warning",
  "budget_exceeded",
  "salary_soon",
  "pace",
  "goal_near",
  "goal_reached",
  "low_balance",
  "category_spike",
  "projection",
  "debt_overdue",
  "debt_due",
  "debt_behind",
]);

/**
 * Turns the current insights into notifications, once per pay cycle per insight.
 * Idempotent: the (user_id, dedupe_key) unique index prevents duplicates.
 * Takes an already-created client so it can run inside `after()` (no request APIs there).
 */
export async function syncNotifications(supabase: Supabase, userId: string, summary: FinanceSummary, enabled: boolean) {
  if (!enabled) return;
  const candidates = summary.insights.filter(
    (i) => NOTIFY_KINDS.has(i.kind) && (i.severity !== "info" || i.kind === "salary_soon" || i.kind === "goal_near"),
  );
  if (candidates.length === 0) return;

  const rows = candidates.map((i) => ({
    user_id: userId,
    kind: i.kind,
    severity: i.severity,
    title: `${i.icon} ${i.title}`,
    body: i.body ?? "",
    dedupe_key: `${i.id}:${summary.cycle.start}`,
  }));
  await supabase.from("notifications").upsert(rows, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true });
}
