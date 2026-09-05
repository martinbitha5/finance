import { LogoMark } from "@/components/brand/logo";

/**
 * Static, hand-drawn replica of the MONY dashboard shown in the landing hero.
 * Pure markup on purpose: no data, no client JS — the real screens live in (app).
 */
export function PhoneMockup({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="relative mx-auto w-[300px] sm:w-[330px] rounded-[2.6rem] border border-border-strong bg-ink p-2 shadow-float">
        {/* screen */}
        <div className="overflow-hidden rounded-[2.1rem] bg-bg">
          {/* status bar + header */}
          <div className="flex items-center justify-between px-5 pt-5">
            <div className="flex items-center gap-2">
              <LogoMark size={26} />
              <div>
                <p className="text-[10px] font-semibold text-fg-subtle leading-none">Bonjour 👋</p>
                <p className="text-[13px] font-extrabold leading-tight">Martin</p>
              </div>
            </div>
            <div className="h-8 w-8 rounded-xl bg-surface-2" />
          </div>

          {/* balance card */}
          <div className="mx-4 mt-4 rounded-3xl aurora p-4 text-ink-fg">
            <p className="text-[11px] font-semibold text-ink-muted">Solde actuel</p>
            <p className="mt-1 text-[28px] font-extrabold tracking-tight tabular">1 240,50&nbsp;$</p>
            <div className="mt-3 flex gap-4 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-2" /> Revenus 2 100&nbsp;$
              </span>
              <span className="inline-flex items-center gap-1 text-ink-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-ink-fg/40" /> Dépenses 859,50&nbsp;$
              </span>
            </div>
          </div>

          {/* daily allowance card */}
          <div className="mx-4 mt-3 rounded-3xl border border-border bg-surface p-4 shadow-soft">
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-positive/12 text-base">
                💵
              </div>
              <div>
                <p className="text-[10px] font-semibold text-fg-muted">Aujourd&apos;hui</p>
                <p className="text-[13px] font-extrabold leading-snug">
                  Tu peux dépenser environ <span className="tabular whitespace-nowrap">23,60&nbsp;$</span>
                </p>
                <p className="mt-0.5 text-[10px] text-fg-subtle">23,60&nbsp;$ × 14 jours jusqu&apos;au 19 sept.</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[10px] font-semibold">
                <span className="text-fg-muted">Dépensé aujourd&apos;hui</span>
                <span className="tabular">8,40&nbsp;$</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full w-[36%] rounded-full bg-fg" />
              </div>
            </div>
          </div>

          {/* upcoming charges */}
          <div className="mx-4 mt-3 rounded-3xl border border-border bg-surface p-4 shadow-soft">
            <p className="text-[11px] font-bold">Charges à venir</p>
            <div className="mt-2.5 space-y-2">
              {[
                { icon: "🏠", label: "Loyer", when: "dans 3 jours", amount: "350 $" },
                { icon: "📺", label: "Streaming", when: "dans 6 jours", amount: "12,99 $" },
                { icon: "📱", label: "Forfait mobile", when: "dans 9 jours", amount: "25 $" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-2 text-sm">
                    {row.icon}
                  </span>
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold leading-tight">{row.label}</p>
                    <p className="text-[10px] text-fg-subtle">{row.when}</p>
                  </div>
                  <span className="text-[12px] font-bold tabular">{row.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* bottom nav */}
          <div className="mt-4 flex items-center justify-around border-t border-border px-4 py-3">
            {["Accueil", "Analyse", "Ajouter", "Objectifs", "Plus"].map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span
                  className={
                    i === 2
                      ? "flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-r from-accent to-accent-2 text-accent-fg text-base font-bold leading-none"
                      : `h-1.5 w-5 rounded-full ${i === 0 ? "bg-fg" : "bg-surface-3"}`
                  }
                >
                  {i === 2 ? "+" : null}
                </span>
                <span className={`text-[8px] font-semibold ${i === 0 ? "text-fg" : "text-fg-subtle"}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* floating insight bubbles */}
      <div className="pointer-events-none relative mx-auto w-[300px] sm:w-[330px]">
        <div className="absolute -top-108 -left-24 hidden rotate-[-4deg] rounded-2xl border border-border bg-surface px-3.5 py-2.5 shadow-float lg:block xl:-left-32">
          <p className="text-[11px] font-semibold">📉 Dépenses en baisse de 15&nbsp;% vs le mois dernier</p>
        </div>
        <div className="absolute -top-40 -right-20 hidden rotate-[3deg] rounded-2xl border border-border bg-surface px-3.5 py-2.5 shadow-float lg:block xl:-right-28">
          <p className="text-[11px] font-semibold">🎯 Objectif « Voyage » atteint à 72&nbsp;%</p>
        </div>
      </div>
    </div>
  );
}
