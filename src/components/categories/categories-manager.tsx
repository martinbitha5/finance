"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Category, Transaction } from "@/lib/finance/types";
import { deleteCategory } from "@/actions/categories";
import { useAction } from "@/hooks/use-action";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { Sheet, ConfirmSheet } from "@/components/ui/sheet";
import { Badge, IconBubble } from "@/components/ui/primitives";
import { CategoryForm } from "./category-form";

type Kind = "expense" | "income";

/** Full category management: list per kind, usage counts, create / edit / delete (custom only). */
export function CategoriesManager({ categories, transactions }: { categories: Category[]; transactions: Transaction[] }) {
  const [kind, setKind] = useState<Kind>("expense");
  const [sheet, setSheet] = useState<{ mode: "new" | "edit"; cat?: Category } | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const del = useAction(deleteCategory, { success: "Catégorie supprimée", onSuccess: () => setToDelete(null) });

  const usage = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) if (t.category_id) map.set(t.category_id, (map.get(t.category_id) ?? 0) + 1);
    return map;
  }, [transactions]);

  const shown = categories.filter((c) => c.kind === kind);
  const custom = shown.filter((c) => !c.is_default).length;

  return (
    <div className="flex flex-col gap-4">
      <Segmented
        value={kind}
        onChange={setKind}
        options={[
          { value: "expense", label: "Dépenses", icon: "💸" },
          { value: "income", label: "Revenus", icon: "💰" },
        ]}
      />
      <div className="flex items-center justify-between px-1 text-sm text-fg-muted">
        <span>
          {shown.length} catégorie{shown.length > 1 ? "s" : ""}
          {custom > 0 ? ` · ${custom} personnalisée${custom > 1 ? "s" : ""}` : ""}
        </span>
        <Button size="sm" variant="secondary" onClick={() => setSheet({ mode: "new" })}>
          <Plus className="h-4 w-4" /> Nouvelle
        </Button>
      </div>
      <ul className="card p-0 overflow-hidden divide-y divide-border">
        {shown.map((c) => {
          const n = usage.get(c.id) ?? 0;
          return (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              <IconBubble icon={c.icon} color={c.color} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{c.name}</div>
                <div className="text-xs text-fg-muted">
                  {n > 0 ? `${n} transaction${n > 1 ? "s" : ""}` : "aucune transaction"}
                </div>
              </div>
              {!c.is_default ? <Badge tone="accent">perso</Badge> : null}
              <button type="button" onClick={() => setSheet({ mode: "edit", cat: c })} aria-label={`Modifier ${c.name}`} className="p-2 rounded-xl text-fg-subtle hover:text-fg hover:bg-surface-2 press">
                <Pencil className="h-4 w-4" />
              </button>
              {!c.is_default ? (
                <button type="button" onClick={() => setToDelete(c)} aria-label={`Supprimer ${c.name}`} className="p-2 rounded-xl text-fg-subtle hover:text-negative hover:bg-surface-2 press">
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : (
                <span className="w-8" />
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-fg-subtle px-1">
        Les catégories par défaut peuvent être renommées et recolorées, mais pas supprimées. Les catégories personnalisées sont entièrement à toi.
      </p>

      <Sheet open={!!sheet} onClose={() => setSheet(null)} title={sheet?.mode === "edit" ? "Modifier la catégorie" : "Nouvelle catégorie"}>
        <CategoryForm key={sheet?.cat?.id ?? `new-${kind}`} kind={kind} initial={sheet?.cat} onDone={() => setSheet(null)} />
      </Sheet>
      <ConfirmSheet
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && del.execute(toDelete.id)}
        loading={del.pending}
        title={`Supprimer « ${toDelete?.name ?? ""} » ?`}
        description={
          toDelete && (usage.get(toDelete.id) ?? 0) > 0
            ? `${usage.get(toDelete.id)} transaction(s) deviendront « sans catégorie ».`
            : "Cette catégorie n'est utilisée par aucune transaction."
        }
      />
    </div>
  );
}
