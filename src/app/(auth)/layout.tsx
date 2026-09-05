import { APP_TAGLINE } from "@/lib/constants";
import { Logo } from "@/components/brand/logo";
import { ForgetFinanceCache } from "@/components/finance/forget-cache";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col lg:flex-row">
      <ForgetFinanceCache />
      <section className="aurora text-ink-fg px-6 pt-safe pb-10 lg:w-1/2 lg:min-h-dvh lg:flex lg:flex-col lg:justify-between lg:p-14 relative overflow-hidden">
        <div className="pt-10 lg:pt-0">
          <Logo size={36} className="gap-2.5" wordmarkClassName="text-lg" />
        </div>
        <div className="mt-10 lg:mt-0">
          <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight leading-[1.05] text-balance">
            {APP_TAGLINE}
          </h1>
          <p className="mt-3 text-ink-muted max-w-md text-balance lg:text-lg">
            Sache exactement où part ton argent et ce que tu peux dépenser aujourd&apos;hui, jusqu&apos;à la prochaine paie.
          </p>
        </div>
        <div className="hidden lg:flex gap-6 text-sm text-ink-muted">
          <span>🔒 Données chiffrées & privées</span>
          <span>📱 Installable sur iPhone & Android</span>
        </div>
      </section>
      <section className="flex-1 flex items-start lg:items-center justify-center px-5 py-8 lg:p-14 -mt-6 lg:mt-0">
        <div className="w-full max-w-md card p-6 sm:p-8 animate-fade-up">{children}</div>
      </section>
    </div>
  );
}
