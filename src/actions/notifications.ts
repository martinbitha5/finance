"use server";

import { uuid } from "@/lib/validation/schemas";
import { requireUser, run, type ActionResult } from "./_helpers";

export async function markNotificationRead(id: string): Promise<ActionResult<null>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const { supabase, user } = await requireUser();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", user.id);
    return { ok: true, data: null };
  });
}

export async function markAllNotificationsRead(): Promise<ActionResult<null>> {
  return run(async () => {
    const { supabase, user } = await requireUser();
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    return { ok: true, data: null };
  });
}

export async function clearNotifications(): Promise<ActionResult<null>> {
  return run(async () => {
    const { supabase, user } = await requireUser();
    await supabase.from("notifications").delete().eq("user_id", user.id);
    return { ok: true, data: null };
  });
}
