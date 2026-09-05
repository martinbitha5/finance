"use server";

import { categorySchema, uuid } from "@/lib/validation/schemas";
import { parseInput, requireUser, revalidateApp, run, type ActionResult } from "./_helpers";

export async function createCategory(input: unknown): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const parsed = parseInput(categorySchema, input);
    if (!parsed.ok) return parsed;
    const { supabase, user } = await requireUser();
    const { count } = await supabase.from("categories").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if ((count ?? 0) >= 60) return { ok: false, error: "Limite de 60 catégories atteinte." };
    const { data, error } = await supabase
      .from("categories")
      .insert({ ...parsed.data, user_id: user.id, sort_order: 100 + (count ?? 0) })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidateApp();
    return { ok: true, data: { id: data.id } };
  });
}

export async function updateCategory(id: string, input: unknown): Promise<ActionResult<null>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const parsed = parseInput(categorySchema.partial(), input);
    if (!parsed.ok) return parsed;
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("categories").update(parsed.data).eq("id", id).eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    revalidateApp();
    return { ok: true, data: null };
  });
}

export async function deleteCategory(id: string): Promise<ActionResult<null>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const { supabase, user } = await requireUser();
    const { data: cat } = await supabase.from("categories").select("is_default").eq("id", id).eq("user_id", user.id).maybeSingle();
    if (!cat) return { ok: false, error: "Catégorie introuvable" };
    if (cat.is_default) return { ok: false, error: "Les catégories par défaut ne peuvent pas être supprimées." };
    const { error } = await supabase.from("categories").delete().eq("id", id).eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    revalidateApp();
    return { ok: true, data: null };
  });
}
