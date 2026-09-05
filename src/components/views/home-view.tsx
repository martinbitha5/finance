"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useFinanceData } from "@/components/finance/finance-provider";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { DailyAllowanceCard } from "@/components/dashboard/daily-allowance-card";
import { MonthSummary } from "@/components/dashboard/month-summary";
import { SpendingBreakdown } from "@/components/dashboard/spending-breakdown";
import { InsightsList } from "@/components/dashboard/insights-list";
import { UpcomingCharges } from "@/components/dashboard/upcoming-charges";
import { DebtsCard } from "@/components/dashboard/debts-card";
import { TransactionItem } from "@/components/transactions/transaction-item";
import { PageHeader } from "@/components/layout/page-header";
import { CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export function HomeView() {
  const data = useFinanceData();
  const { summary: s, snapshot, profile } = data;

  const name = profile.display_name?.split(" ")[0] || "";
  const hasAnyData = snapshot.transactions.length > 0;
  const categoryById = new Map(snapshot.categories.map((c) => [c.id, c]));
  const recent = snapshot.transactions.filter((t) => t.date <= s.today).slice(0, 5);

  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:items-start md:gap-5">
      <div className="md:col-span-2">
        <PageHeader title={`Bonjour${name ? ` ${name}` : ""} 👋`} question="Où en sont mes finances ?" unread={data.unreadNotifications} className="pb-0" />
      </div>

      <BalanceCard s={s} />
      <DailyAllowanceCard s={s} />

      {!hasAnyData ? (
        <EmptyState
          className="md:col-span-2"
          icon="✨"
          title="Commence par une première dépense"
          description="Chaque dépense, revenu ou épargne que tu ajoutes met à jour ton solde et ton budget du jour."
          action={
            <div className="flex flex-col sm:flex-row gap-2">
              <Button href="/ajouter">Ajouter une dépense</Button>
              {!s.salary.configured ? (
                <Button href="/revenus" variant="secondary">
                  Configurer mon salaire
                </Button>
              ) : null}
            </div>
          }
        />
      ) : null}

      <MonthSummary s={s} />
      <SpendingBreakdown data={s.month.byCategory} currency={s.currency} total={s.month.expenses} limit={4} linkTo="/analyse" />
      <InsightsList insights={s.insights} limit={3} />
      <UpcomingCharges
        charges={s.upcomingCharges}
        currency={s.currency}
        total={s.remainingCharges}
        salary={s.salary.configured && s.salary.amount > 0 ? { amount: s.salary.amount, date: s.cycle.nextPayday } : null}
      />

      <DebtsCard debts={s.debts} currency={s.currency} totalOwed={s.totalOwed} totalLent={s.totalLent} />

      {recent.length > 0 ? (
        <section className="card p-0 overflow-hidden animate-fade-up" style={{ animationDelay: "360ms" }}>
          <div className="px-5 pt-5">
            <CardTitle
              action={
                <Link href="/transactions" className="inline-flex items-center text-xs font-semibold text-fg-muted hover:text-fg">
                  Tout voir <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              Dernières transactions
            </CardTitle>
          </div>
          <ul className="divide-y divide-border">
            {recent.map((t) => (
              <li key={t.id}>
                <TransactionItem tx={t} category={t.category_id ? categoryById.get(t.category_id) : null} currency={s.currency} rates={s.rates} showDate={t.date === s.today ? "Aujourd'hui" : undefined} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
