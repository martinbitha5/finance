import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { FinanceSummary } from "@/lib/finance/types";
import { sendPushToUser } from "@/lib/push/server";

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

/** Écran ouvert quand on touche la notification push. */
function targetUrl(kind: string, href?: string) {
  if (href) return href;
  if (kind.startsWith("budget")) return "/budgets";
  if (kind.startsWith("debt")) return "/dettes";
  if (kind.startsWith("goal")) return "/objectifs";
  return "/";
}

/**
 * Turns the current insights into notifications, once per pay cycle per insight, and pushes
 * the NEW ones to the user's devices. Idempotent: the (user_id, dedupe_key) unique index
 * prevents duplicates, and only rows that did not exist before are pushed.
 * Takes an already-created client so it can run inside `after()` (no request APIs there).
 */
export async function syncNotifications(supabase: Supabase, userId: string, summary: FinanceSummary, enabled: boolean) {
  if (!enabled) return;
  const candidates = summary.insights.filter(
    (i) => NOTIFY_KINDS.has(i.kind) && (i.severity !== "info" || i.kind === "salary_soon" || i.kind === "goal_near"),
  );
  if (candidates.length === 0) return;

  const keys = candidates.map((i) => `${i.id}:${summary.cycle.start}`);
  const { data: existing } = await supabase.from("notifications").select("dedupe_key").eq("user_id", userId).in("dedupe_key", keys);
  const seen = new Set((existing ?? []).map((e) => e.dedupe_key));
  const fresh = candidates.filter((i) => !seen.has(`${i.id}:${summary.cycle.start}`));
  if (fresh.length === 0) return;

  const rows = fresh.map((i) => ({
    user_id: userId,
    kind: i.kind,
    severity: i.severity,
    title: `${i.icon} ${i.title}`,
    body: i.body ?? "",
    dedupe_key: `${i.id}:${summary.cycle.start}`,
  }));
  const { data: inserted } = await supabase
    .from("notifications")
    .upsert(rows, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true })
    .select("dedupe_key");
  const insertedKeys = new Set((inserted ?? []).map((r) => r.dedupe_key));

  // One push per new notification (most urgent first), capped so a first sync never spams.
  const toPush = fresh.filter((i) => insertedKeys.has(`${i.id}:${summary.cycle.start}`)).slice(0, 3);
  for (const i of toPush) {
    await sendPushToUser(supabase, userId, {
      title: `${i.icon} ${i.title}`,
      body: i.body,
      url: targetUrl(i.kind, i.href),
      tag: `mony-${i.kind}`,
    });
  }
}
