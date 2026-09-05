import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { APP_TAGLINE } from "@/lib/constants";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Produit",
    links: [
      { href: "/bienvenue#fonctionnalites", label: "Fonctionnalités" },
      { href: "/bienvenue#comment", label: "Comment ça marche" },
      { href: "/bienvenue#installer", label: "Installer l'application" },
      { href: "/bienvenue#faq", label: "FAQ" },
    ],
  },
  {
    title: "Compte",
    links: [
      { href: "/signup", label: "Créer un compte" },
      { href: "/login", label: "Se connecter" },
    ],
  },
  {
    title: "Légal",
    links: [
      { href: "/conditions", label: "Conditions d'utilisation" },
      { href: "/confidentialite", label: "Politique de confidentialité" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-12 lg:py-16">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="max-w-xs">
            <Logo size={36} className="gap-2.5" wordmarkClassName="text-lg" />
            <p className="mt-3 text-sm text-fg-muted">
              {APP_TAGLINE} Comprends où part ton argent et sache chaque jour ce que tu peux
              dépenser jusqu&apos;à la prochaine paie.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-[13px] font-bold uppercase tracking-wider text-fg-subtle">{col.title}</p>
                <ul className="mt-3 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-sm font-medium text-fg-muted transition-colors hover:text-fg"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-[13px] text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MONY. Tous droits réservés.</p>
          <p>Développé par Martin Bitha.</p>
        </div>
      </div>
    </footer>
  );
}
