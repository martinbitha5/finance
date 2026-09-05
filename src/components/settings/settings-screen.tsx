"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, ChevronRight, Tags } from "lucide-react";
import type { Category, Debt, Profile, SavingsGoal, Settings, Transaction } from "@/lib/finance/types";
import { CURRENCIES, type Currency } from "@/lib/constants";
import { normalizeRates, describeRate } from "@/lib/finance/currency";
import { saveSettings } from "@/actions/settings";
import { signOut } from "@/actions/auth";
import { useAction } from "@/hooks/use-action";
import { ExportPanel } from "./export-panel";
import { PushSettings } from "./push-settings";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Toggle } from "@/components/ui/primitives";
import { CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { InstallHint } from "@/components/pwa/install-hint";

export function SettingsScreen({
  settings,
  profile,
  categories,
  transactions,
  goals,
  debts,
  email,
}: {
  settings: Settings;
  profile: Profile;
  categories: Category[];
  transactions: Transaction[];
  goals: SavingsGoal[];
  debts: Debt[];
  email: string;
}) {
  const rates = normalizeRates(settings.exchange_rates);
  const [name, setName] = useState(profile.display_name ?? "");
  const [currency, setCurrency] = useState<Currency>(settings.currency);
  const [notif, setNotif] = useState(settings.notifications_enabled);
  const [cdf, setCdf] = useState(String(rates.CDF));
  const [eur, setEur] = useState(String(rates.EUR));
  const [gbp, setGbp] = useState(String(rates.GBP));
  const save = useAction(saveSettings, { success: "Paramètres enregistrés" });

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
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} · {c.label} ({c.code})
              </option>
            ))}
          </Select>
        </Field>
        <div className="rounded-2xl bg-surface-2/70 p-4">
          <div className="text-[12px] font-semibold text-fg-muted mb-2">Taux de change (pour 1 USD)</div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="CDF">
              <Input inputMode="decimal" value={cdf} onChange={(e) => setCdf(e.target.value)} />
            </Field>
            <Field label="EUR">
              <Input inputMode="decimal" value={eur} onChange={(e) => setEur(e.target.value)} />
            </Field>
            <Field label="GBP">
              <Input inputMode="decimal" value={gbp} onChange={(e) => setGbp(e.target.value)} />
            </Field>
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
            <div className="text-xs text-fg-muted">Budgets, salaire, dettes, rythme de dépenses, objectifs.</div>
          </div>
          <Toggle checked={notif} onChange={setNotif} label="Notifications" />
        </div>

        <Button type="submit" size="lg" full loading={save.pending}>
          Enregistrer
        </Button>
      </form>

      <Link href="/categories" className="card p-4 flex items-center gap-3 press hover:bg-surface-2/60 transition-colors">
        <span className="h-10 w-10 rounded-2xl bg-surface-2 inline-flex items-center justify-center">
          <Tags className="h-5 w-5" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-semibold">Catégories</span>
          <span className="block text-xs text-fg-muted">
            {categories.filter((c) => c.kind === "expense").length} catégories de dépenses · renommer, colorer, ajouter
          </span>
        </span>
        <ChevronRight className="h-4 w-4 text-fg-subtle" />
      </Link>

      <PushSettings />

      <ExportPanel email={email} transactions={transactions} categories={categories} goals={goals} debts={debts} />

      <section className="card p-5">
        <CardTitle>Installer l&apos;application</CardTitle>
        <InstallHint />
      </section>

      <form action={signOut} className="pb-4">
        <Button type="submit" variant="outline" full>
          <LogOut className="h-4 w-4" /> Se déconnecter
        </Button>
      </form>
    </div>
  );
}
