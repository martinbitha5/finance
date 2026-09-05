"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import type { Category, FinanceSummary } from "@/lib/finance/types";
import { CURRENCIES, type Currency } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { createRecurring } from "@/actions/recurring";
import { completeOnboarding } from "@/actions/settings";
import { useAction } from "@/hooks/use-action";
import { SalaryForm } from "@/components/income/income-screen";
import { DemoButton } from "@/components/settings/demo-button";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const SUGGESTED = [
  { name: "Loyer", slug: "housing", amount: 150 },
  { name: "Internet", slug: "phone", amount: 30 },
  { name: "Téléphone", slug: "phone", amount: 10 },
  { name: "Netflix", slug: "subscriptions", amount: 10 },
  { name: "Transport", slug: "transport", amount: 40 },
];

export function OnboardingFlow({ summary, categories, name, demoLoaded }: { summary: FinanceSummary; categories: Category[]; name: string; demoLoaded: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(summary.salary.configured ? 2 : 0);
  const [charges, setCharges] = useState<{ name: string; amount: string; slug: string; done: boolean }[]>([]);
  const [custom, setCustom] = useState({ name: "", amount: "", slug: "subscriptions" });
  const [currency] = useState<Currency>(summary.currency);
  const add = useAction(createRecurring, { refresh: false });
  const finish = useAction(completeOnboarding, { refresh: false, onSuccess: () => { router.replace("/"); router.refresh(); } });
  const catBySlug = new Map(categories.filter((c) => c.slug).map((c) => [c.slug as string, c.id]));

  async function saveCharges() {
    for (const c of charges) {
      if (c.done || !Number(c.amount)) continue;
      await add.execute({ name: c.name, amount: c.amount, currency, category_id: catBySlug.get(c.slug) ?? null, frequency: "monthly", next_date: summary.today, payment_method: "cash", is_active: true });
    }
    finish.execute(null);
  }

  return (
    <div className="flex flex-col gap-6 pt-8">
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-fg" : "bg-surface-3")} />
        ))}
      </div>

      {step === 0 ? (
        <div className="animate-fade-up">
          <h1 className="text-3xl font-extrabold tracking-tight">Bienvenue{name ? ` ${name.split(" ")[0]}` : ""} 👋</h1>
          <p className="text-fg-muted mt-2">Deux minutes pour configurer MONY. Commence par ton salaire : c&apos;est la base de tous les calculs.</p>
          <div className="card p-5 mt-6">
            <SalaryForm s={summary} onDone={() => setStep(1)} submitLabel="Continuer" />
          </div>
          <div className="mt-6 text-center">
            <p className="text-xs text-fg-subtle mb-2">Tu veux juste voir l&apos;app en action ?</p>
            <DemoButton loaded={demoLoaded} variant="ghost" />
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="animate-fade-up">
          <h1 className="text-3xl font-extrabold tracking-tight">Tes charges fixes</h1>
          <p className="text-fg-muted mt-2">Loyer, internet, abonnements… Elles sont déduites automatiquement de ce que tu peux dépenser. Tu pourras en ajouter plus tard.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {SUGGESTED.map((s) => {
              const active = charges.some((c) => c.name === s.name);
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setCharges((prev) => (active ? prev.filter((c) => c.name !== s.name) : [...prev, { name: s.name, amount: String(s.amount), slug: s.slug, done: false }]))}
                  className={cn("h-10 px-4 rounded-full text-sm font-semibold border press inline-flex items-center gap-1.5", active ? "bg-ink text-ink-fg border-ink dark:bg-fg dark:text-bg dark:border-fg" : "bg-surface border-border")}
                >
                  {active ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {s.name}
                </button>
              );
            })}
          </div>
          {charges.length > 0 ? (
            <ul className="card p-4 mt-4 flex flex-col gap-3">
              {charges.map((c, i) => (
                <li key={c.name} className="flex items-center gap-3">
                  <span className="flex-1 font-semibold">{c.name}</span>
                  <Input inputMode="decimal" value={c.amount} onChange={(e) => setCharges((prev) => prev.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} className="w-28 h-10 text-right" />
                  <span className="text-sm text-fg-muted w-10">{CURRENCIES.find((x) => x.code === currency)?.symbol}/mois</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="card p-4 mt-4">
            <div className="text-[12px] font-semibold text-fg-muted mb-2">Autre charge</div>
            <div className="grid grid-cols-[1fr_90px_auto] gap-2 items-end">
              <Field label="Nom"><Input value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} placeholder="Ex : Salle de sport" className="h-10" /></Field>
              <Field label="Montant"><Input inputMode="decimal" value={custom.amount} onChange={(e) => setCustom({ ...custom, amount: e.target.value })} placeholder="20" className="h-10" /></Field>
              <Button type="button" size="sm" variant="secondary" className="h-10" disabled={!custom.name || !Number(custom.amount)} onClick={() => { setCharges((p) => [...p, { name: custom.name, amount: custom.amount, slug: custom.slug, done: false }]); setCustom({ name: "", amount: "", slug: "subscriptions" }); }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Select value={custom.slug} onChange={(e) => setCustom({ ...custom, slug: e.target.value })} className="mt-2 h-10">
              {categories.filter((c) => c.kind === "expense" && c.slug).map((c) => <option key={c.id} value={c.slug!}>{c.icon} {c.name}</option>)}
            </Select>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="secondary" onClick={() => setStep(2)}>Passer</Button>
            <Button className="flex-1" loading={add.pending || finish.pending} onClick={() => { setStep(2); }}>Continuer</Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="animate-fade-up">
          <h1 className="text-3xl font-extrabold tracking-tight">C&apos;est prêt ✨</h1>
          <p className="text-fg-muted mt-2">
            {summary.salary.configured ? (
              <>Avec un salaire de <b className="text-fg">{formatMoney(summary.salary.amount, summary.currency)}</b> reçu le <b className="text-fg">{summary.salary.payDay}</b>, MONY calcule chaque jour ce que tu peux dépenser sans mettre en danger tes charges ni ton épargne.</>
            ) : (
              <>Tu pourras configurer ton salaire à tout moment depuis « Revenus & salaire ».</>
            )}
          </p>
          <ul className="card p-5 mt-6 flex flex-col gap-3 text-sm">
            <li className="flex gap-3"><span>🏠</span><span><b>Accueil</b> — où en sont mes finances ?</span></li>
            <li className="flex gap-3"><span>📊</span><span><b>Analyse</b> — où part mon argent ?</span></li>
            <li className="flex gap-3"><span>➕</span><span><b>Ajouter</b> — une dépense en 5 secondes.</span></li>
            <li className="flex gap-3"><span>🎯</span><span><b>Objectifs</b> — est-ce que je progresse ?</span></li>
          </ul>
          {charges.length > 0 ? <p className="text-xs text-fg-subtle mt-3">{charges.length} charge{charges.length > 1 ? "s" : ""} seront enregistrées.</p> : null}
          <Button size="lg" full className="mt-6" loading={add.pending || finish.pending} onClick={saveCharges}>
            Ouvrir MONY
          </Button>
        </div>
      ) : null}
    </div>
  );
}
