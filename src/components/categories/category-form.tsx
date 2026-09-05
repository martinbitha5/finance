"use client";

import { useState } from "react";
import { createCategory, updateCategory } from "@/actions/categories";
import { useAction } from "@/hooks/use-action";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/constants";
import type { Category } from "@/lib/finance/types";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function CategoryForm({
  kind = "expense",
  initial,
  onDone,
}: {
  kind?: Category["kind"];
  initial?: Category;
  onDone?: (id?: string) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "🧾");
  const [color, setColor] = useState(initial?.color ?? CATEGORY_COLORS[0]);
  const create = useAction(createCategory, { success: "Catégorie créée", onSuccess: (d) => onDone?.(d.id) });
  const update = useAction((input: unknown) => updateCategory(initial!.id, input), { success: "Catégorie modifiée", onSuccess: () => onDone?.() });
  const pending = create.pending || update.pending;
  const fields = initial ? update.fields : create.fields;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const payload = { name, icon, color, kind: initial?.kind ?? kind };
        if (initial) update.execute(payload);
        else create.execute(payload);
      }}
    >
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-2xl inline-flex items-center justify-center text-3xl" style={{ background: `color-mix(in oklab, ${color} 20%, transparent)` }}>
          {icon}
        </div>
        <Field label="Nom" error={fields.name} className="flex-1">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Café" autoFocus maxLength={40} />
        </Field>
      </div>
      <Field label="Icône">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_ICONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              className={cn("h-10 w-10 rounded-xl text-xl inline-flex items-center justify-center press", icon === i ? "bg-ink text-ink-fg dark:bg-fg" : "bg-surface-2")}
              aria-label={i}
            >
              {i}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Couleur">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              className={cn("h-8 w-8 rounded-full press ring-offset-2 ring-offset-surface", color === c && "ring-2 ring-fg")}
              style={{ background: c }}
            />
          ))}
        </div>
      </Field>
      <Button type="submit" loading={pending} full size="lg">
        {initial ? "Enregistrer" : "Créer la catégorie"}
      </Button>
    </form>
  );
}
