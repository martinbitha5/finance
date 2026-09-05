import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const NAV = [
  { href: "/bienvenue#fonctionnalites", label: "Fonctionnalités" },
  { href: "/bienvenue#comment", label: "Comment ça marche" },
  { href: "/bienvenue#securite", label: "Sécurité" },
  { href: "/bienvenue#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/bienvenue" className="shrink-0" aria-label="MONY — accueil">
          <Logo size={34} className="gap-2.5" wordmarkClassName="text-base" />
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-fg-muted">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-fg">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="press inline-flex h-10 items-center rounded-2xl px-4 text-sm font-semibold text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            Se connecter
          </Link>
          <Link
            href="/signup"
            className="press inline-flex h-10 items-center rounded-2xl bg-ink px-4.5 text-sm font-bold text-ink-fg shadow-soft transition-colors hover:bg-ink-2 dark:bg-fg dark:text-bg dark:hover:opacity-90"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </header>
  );
}
