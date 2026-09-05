"use client";

import { useState } from "react";
import { LogOut, Pencil, Trash2, Plus, Download } from "lucide-react";
import type { Category, Profile, Settings } from "@/lib/finance/types";
import { CURRENCIES, type Currency, APP_NAME } from "@/lib/constants";
import { normalizeRates, describeRate } from "@/lib/finance/currency";
import { saveSettings } from "@/actions/settings";
import { deleteCategory } from "@/actions/categories";
import { signOut } from "@/actions/auth";
import { useAction } from "@/hooks/use-action";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Toggle, IconBubble } from "@/components/ui/primitives";
import { CardTitle } from "@/components/ui/card";
import { Sheet, ConfirmSheet } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CategoryForm } from "@/components/categories/category-form";
import { DemoButton } from "./demo-button";
import { InstallHint } from "@/components/pwa/install-hint";

export function SettingsScreen({ settings, profile, categories, email }: { settings: Settings; profile: Profile; categories: Category[]; email: string }) {
  const rates = normalizeRates(settings.exchange_rates);
  const [name, setName] = useState(profile.display_name ?? "");
  const [currency, setCurrency] = useState<Currency>(settings.currency);
  const [notif, setNotif] = useState(settings.notifications_enabled);
  const [cdf, setCdf] = useState(String(rates.CDF));
  const [eur, setEur] = useState(String(rates.EUR));
  const [gbp, setGbp] = useState(String(rates.GBP));
  const save = useAction(saveSettings, { success: "Paramètres enregistrés" });

  const [catSheet, setCatSheet] = useState<{ mode: "new" | "edit"; cat?: Category } | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const delCat = useAction(deleteCategory, { success: "Catégorie supprimée", onSuccess: () => setToDelete(null) });

  return (
    <div className="flex flex-col gap-4">
      <form
        className="card p-5 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.execute({ display_name: name, currency, theme: settings.theme, notifications_enabled: notif, rate_CDF: cdf, rate_EUR: eur, rate_GBP: gbp });
        }}
      >
        <CardTitle>Profil</CardTitle>
        <Field label="Prénom" error={save.fields.display_name}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ton prénom" maxLength={60} />
        </Field>
        <Field label="Email">
          <Input value={email} disabled className="opacity-70" />
        </Field>

        <CardTitle className="mt-2">Devise principale</CardTitle>
        <Field label="Tous les montants sont affichés dans cette devise" error={save.fields.currency}>
          <Select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} · {c.label} ({c.code})</option>)}
          </Select>
        </Field>
        <div className="rounded-2xl bg-surface-2/70 p-4">
          <div className="text-[12px] font-semibold text-fg-muted mb-2">Taux de change (pour 1 USD)</div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="CDF"><Input inputMode="decimal" value={cdf} onChange={(e) => setCdf(e.target.value)} /></Field>
            <Field label="EUR"><Input inputMode="decimal" value={eur} onChange={(e) => setEur(e.target.value)} /></Field>
            <Field label="GBP"><Input inputMode="decimal" value={gbp} onChange={(e) => setGbp(e.target.value)} /></Field>
          </div>
          <p className="text-[11px] text-fg-subtle mt-2">
            Les montants saisis dans une autre devise sont convertis avec ces taux, et le taux utilisé est toujours affiché. Exemple : {describeRate("USD", "CDF", { ...rates, CDF: Number(cdf) || rates.CDF })}.
          </p>
        </div>

        <CardTitle className="mt-2">Apparence</CardTitle>
        <div className="flex items-center justify-between rounded-2xl bg-surface-2/70 px-4 py-3">
          <div className="text-sm font-semibold">Thème</div>
          <ThemeToggle />
        </div>

        <CardTitle className="mt-2">Notifications</CardTitle>
        <div className="flex items-center justify-between rounded-2xl bg-surface-2/70 px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Alertes intelligentes</div>
            <div className="text-xs text-fg-muted">Budgets, salaire, rythme de dépenses, objectifs.</div>
          </div>
          <Toggle checked={notif} onChange={setNotif} label="Notifications" />
        </div>

        <Button type="submit" size="lg" full loading={save.pending}>Enregistrer</Button>
      </form>

      <section className="card p-5">
        <CardTitle action={<Button size="sm" variant="secondary" onClick={() => setCatSheet({ mode: "new" })}><Plus className="h-4 w-4" /> Nouvelle</Button>}>Catégories</CardTitle>
        <ul className="divide-y divide-border -mx-5">
          {categories.filter((c) => c.kind === "expense").map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-5 py-2.5">
              <IconBubble icon={c.icon} color={c.color} size="sm" />
              <span className="flex-1 font-semibold text-sm truncate">{c.name}</span>
              <button type="button" onClick={() => setCatSheet({ mode: "edit", cat: c })} aria-label="Modifier" className="p-1 text-fg-subtle hover:text-fg"><Pencil className="h-4 w-4" /></button>
              {!c.is_default ? <button type="button" onClick={() => setToDelete(c)} aria-label="Supprimer" className="p-1 text-fg-subtle hover:text-negative"><Trash2 className="h-4 w-4" /></button> : <span className="w-6" />}
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5">
        <CardTitle>Mode démo</CardTitle>
        <p className="text-sm text-fg-muted mb-3">Un jeu de données réaliste (salaire 650 $, charges, budgets, objectifs) pour découvrir {APP_NAME}.</p>
        <DemoButton loaded={settings.demo_loaded} full />
      </section>

      <section className="card p-5">
        <CardTitle>Installer l&apos;application</CardTitle>
        <InstallHint />
      </section>

      <form action={signOut} className="pb-4">
        <Button type="submit" variant="outline" full><LogOut className="h-4 w-4" /> Se déconnecter</Button>
      </form>

      <Sheet open={!!catSheet} onClose={() => setCatSheet(null)} title={catSheet?.mode === "edit" ? "Modifier la catégorie" : "Nouvelle catégorie"}>
        <CategoryForm key={catSheet?.cat?.id ?? "new"} initial={catSheet?.cat} onDone={() => setCatSheet(null)} />
      </Sheet>
      <ConfirmSheet open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={() => toDelete && delCat.execute(toDelete.id)} loading={delCat.pending} title="Supprimer cette catégorie ?" description="Les transactions associées deviendront « sans catégorie »." />
      <span className="hidden"><Download /></span>
    </div>
  );
}
