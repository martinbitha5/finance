import type { Metadata } from "next";
import Link from "next/link";
import {
  BellRing,
  CalendarClock,
  Coins,
  FileSpreadsheet,
  HandCoins,
  Landmark,
  LineChart,
  Lock,
  PiggyBank,
  Repeat,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import { APP_TAGLINE } from "@/lib/constants";
import { PhoneMockup } from "@/components/marketing/phone-mockup";

export const metadata: Metadata = {
  title: "MONY — Ton argent, en clair",
  description:
    "MONY calcule chaque jour ce que tu peux vraiment dépenser jusqu'à ta prochaine paie : charges fixes, budgets, objectifs d'épargne et dettes, au même endroit. Gratuit, installable sur iPhone et Android.",
  alternates: { canonical: "/bienvenue" },
  openGraph: {
    title: "MONY — Ton argent, en clair",
    description:
      "Sache chaque jour ce que tu peux vraiment dépenser jusqu'à ta prochaine paie. Charges fixes, budgets, épargne et dettes, au même endroit.",
    type: "website",
    locale: "fr_FR",
  },
};

const FEATURES = [
  {
    icon: Wallet,
    title: "Reste à dépenser quotidien",
    text: "Un seul chiffre chaque matin : ce que tu peux dépenser aujourd'hui, une fois le loyer, les factures, l'épargne et les remboursements mis de côté.",
  },
  {
    icon: CalendarClock,
    title: "Calé sur ta paie, pas sur le calendrier",
    text: "Tu indiques ton jour de paie et MONY organise tout autour de ton cycle réel, du dernier salaire reçu au prochain.",
  },
  {
    icon: Repeat,
    title: "Charges fixes automatiques",
    text: "Loyer, électricité, abonnements : enregistrés une fois, inscrits tout seuls aux bonnes dates et anticipés dans ton budget. Zéro mauvaise surprise.",
  },
  {
    icon: Target,
    title: "Budgets par catégorie",
    text: "Alimentation, sorties, transport… fixe tes limites et sois prévenu avant de les franchir, pas après.",
  },
  {
    icon: PiggyBank,
    title: "Objectifs d'épargne concrets",
    text: "Téléphone, voyage, fonds d'urgence : un montant cible, une date, et MONY calcule combien mettre de côté chaque mois — dès le jour de paie.",
  },
  {
    icon: HandCoins,
    title: "Dettes sous contrôle",
    text: "Ce que tu dois et ce qu'on te doit, au même endroit, avec la mensualité exacte pour tenir ta date limite.",
  },
] as const;

const STEPS = [
  {
    title: "Configure ton cycle",
    text: "Ton salaire, ton jour de paie et tes charges fixes. Deux minutes suffisent, et tu peux tout ajuster plus tard.",
  },
  {
    title: "Note ce qui entre et sort",
    text: "Une dépense se saisit en quelques secondes : montant, catégorie, moyen de paiement. Les charges récurrentes, elles, s'inscrivent toutes seules.",
  },
  {
    title: "Décide en connaissance de cause",
    text: "MONY te dit ce qu'il te reste vraiment, ton budget du jour et où tu en seras à la prochaine paie si tu continues à ce rythme.",
  },
] as const;

const INSIGHTS = [
  "Si tu continues à ce rythme, il te restera environ 45 $ avant ta prochaine paie.",
  "Tu as dépensé 32 % de ton salaire en restaurants ce mois-ci.",
  "Tes dépenses ont baissé de 15 % par rapport au mois dernier.",
  "Objectif atteint : Nouveau téléphone ! 🎉",
] as const;

const FAQ = [
  {
    q: "Est-ce que MONY est gratuit ?",
    a: "Oui. Tu crées un compte avec ton adresse e-mail et tu utilises toutes les fonctionnalités sans payer.",
  },
  {
    q: "Dois-je connecter mon compte bancaire ?",
    a: "Non, et c'est voulu. Tu saisis toi-même tes revenus et tes dépenses : MONY n'a jamais accès à ta banque, à ta carte ni à tes identifiants bancaires.",
  },
  {
    q: "Sur quels appareils MONY fonctionne-t-il ?",
    a: "MONY fonctionne dans le navigateur et s'installe comme une application sur iPhone (Safari → Partager → Sur l'écran d'accueil) et Android (Chrome → menu → Installer l'application). L'essentiel reste consultable même quand le réseau est capricieux.",
  },
  {
    q: "Quelles devises sont prises en charge ?",
    a: "Le dollar américain, le franc congolais, l'euro et la livre sterling. Tu peux mélanger les devises dans tes comptes et tes dépenses : MONY fait la conversion et affiche toujours le taux utilisé.",
  },
  {
    q: "Mes données sont-elles privées ?",
    a: "Oui. Chaque compte a son espace isolé et sécurisé, accessible uniquement avec tes identifiants. Tes données ne sont ni vendues ni partagées, et tu peux les exporter (Excel, CSV) ou supprimer ton compte à tout moment. Les détails sont dans notre politique de confidentialité.",
  },
  {
    q: "MONY donne-t-il des conseils de placement ?",
    a: "Non. MONY analyse uniquement les chiffres que tu as saisis pour t'aider à suivre ton budget. Ce n'est ni un conseiller financier, ni un produit d'investissement.",
  },
] as const;

export default function LandingPage() {
  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 45% at 85% 0%, color-mix(in oklab, var(--accent) 16%, transparent) 0%, transparent 70%), radial-gradient(50% 40% at 0% 25%, color-mix(in oklab, var(--accent-2) 10%, transparent) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-16 pt-14 lg:grid-cols-2 lg:gap-8 lg:pb-24 lg:pt-24">
          <div className="stagger">
            <p className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-3.5 py-1.5 text-[13px] font-semibold text-fg-muted shadow-soft">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Gratuit · Sans connexion bancaire
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.04] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {APP_TAGLINE.replace(/\.$/, "")}
              <span className="aurora-text">.</span>
              <br />
              <span className="text-fg-muted">Chaque jour, jusqu&apos;à la paie.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-fg-muted text-balance">
              Fini le « où est passé mon salaire ? ». MONY met de côté tes charges, ton épargne et
              tes remboursements, puis te dit exactement ce que tu peux dépenser aujourd&apos;hui.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="press inline-flex h-13 items-center justify-center rounded-2xl bg-gradient-to-r from-accent to-accent-2 px-7 text-base font-bold text-accent-fg shadow-soft transition-[filter] hover:brightness-105"
              >
                Commencer gratuitement
              </Link>
              <Link
                href="/login"
                className="press inline-flex h-13 items-center justify-center rounded-2xl border border-border-strong bg-surface px-7 text-base font-semibold transition-colors hover:bg-surface-2"
              >
                J&apos;ai déjà un compte
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-fg-muted">
              <li className="inline-flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-accent" /> Données privées et chiffrées
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-accent" /> S&apos;installe sur iPhone &amp; Android
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-accent" /> 4 devises, conversions incluses
              </li>
            </ul>
          </div>
          <PhoneMockup className="animate-fade-up" />
        </div>
      </section>

      {/* ---------------------------------------------------------- features */}
      <section id="fonctionnalites" className="scroll-mt-20 border-t border-border bg-surface/60">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-accent">Fonctionnalités</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              Tout ce qu&apos;il faut pour reprendre la main, rien de plus
            </h2>
            <p className="mt-3 text-fg-muted text-balance">
              Pas de tableaux compliqués, pas de jargon bancaire. Tu notes ce qui entre et ce qui
              sort, MONY te dit ce que ça veut dire pour toi.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-5">
            {FEATURES.map((f) => (
              <article key={f.title} className="card p-6">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/15 to-accent-2/15">
                  <f.icon className="h-5.5 w-5.5 text-accent" strokeWidth={2.2} />
                </div>
                <h3 className="mt-4 text-lg font-bold tracking-tight">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ how it works */}
      <section id="comment" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-accent">Comment ça marche</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              Deux minutes pour démarrer, quelques secondes par jour
            </h2>
          </div>
          <ol className="mt-10 grid gap-4 lg:mt-14 lg:grid-cols-3 lg:gap-5">
            {STEPS.map((step, i) => (
              <li key={step.title} className="card relative overflow-hidden p-6">
                <span
                  aria-hidden="true"
                  className="absolute -right-3 -top-6 text-[7rem] font-extrabold leading-none text-fg opacity-[0.045] select-none"
                >
                  {i + 1}
                </span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-bold text-ink-fg dark:bg-fg dark:text-bg">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold tracking-tight">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------- insights */}
      <section className="mx-auto max-w-6xl px-5 pb-16 lg:pb-24">
        <div className="aurora relative overflow-hidden rounded-[2rem] p-8 text-ink-fg sm:p-12 lg:p-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-accent">
                <LineChart className="h-4 w-4" /> Conseils basés sur tes vrais chiffres
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
                MONY te parle simplement, sans rien inventer
              </h2>
              <p className="mt-4 max-w-md text-ink-muted text-balance">
                Chaque message est calculé à partir de ce que tu as réellement saisi : ton rythme de
                dépense, tes plus grosses catégories, l&apos;avancement de tes objectifs. Et si tu
                l&apos;actives, MONY te prévient par notification avant chaque échéance.
              </p>
              <p className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-ink-fg/10 px-4 py-2.5 text-sm font-semibold">
                <BellRing className="h-4 w-4 text-accent-2" /> Rappels de charges &amp; alertes de budget
              </p>
            </div>
            <ul className="space-y-3">
              {INSIGHTS.map((text, i) => (
                <li
                  key={text}
                  className={`max-w-md rounded-2xl border border-ink-fg/10 bg-ink-fg/8 px-4.5 py-3.5 text-[15px] font-medium backdrop-blur ${i % 2 === 1 ? "ml-auto" : ""}`}
                >
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- security */}
      <section id="securite" className="scroll-mt-20 border-t border-border bg-surface/60">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-accent">Sécurité &amp; vie privée</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              Tes données t&apos;appartiennent. Point.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4 lg:gap-5">
            {[
              {
                icon: Landmark,
                title: "Zéro connexion bancaire",
                text: "MONY ne se connecte jamais à ta banque. Tu saisis tes chiffres toi-même, il ne voit que ce que tu lui donnes.",
              },
              {
                icon: ShieldCheck,
                title: "Espace strictement privé",
                text: "Chaque compte est isolé au niveau de la base de données : personne d'autre que toi ne peut lire tes finances.",
              },
              {
                icon: FileSpreadsheet,
                title: "Exporte tout, quand tu veux",
                text: "Ton rapport complet en Excel ou CSV, téléchargé ou envoyé par e-mail. Tes données restent portables.",
              },
              {
                icon: Lock,
                title: "Ni vendues, ni partagées",
                text: "Pas de publicité, pas de revente de données. Le détail est écrit noir sur blanc dans notre politique de confidentialité.",
              },
            ].map((item) => (
              <article key={item.title} className="card p-6">
                <item.icon className="h-6 w-6 text-accent" strokeWidth={2.2} />
                <h3 className="mt-3.5 font-bold tracking-tight">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{item.text}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 text-sm text-fg-muted">
            Lis nos{" "}
            <Link href="/conditions" className="font-semibold text-fg underline-offset-4 hover:underline">
              conditions d&apos;utilisation
            </Link>{" "}
            et notre{" "}
            <Link href="/confidentialite" className="font-semibold text-fg underline-offset-4 hover:underline">
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ----------------------------------------------------------- install */}
      <section id="installer" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-accent">Sur ton téléphone</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
                Une vraie application, sans passer par un store
              </h2>
              <p className="mt-4 max-w-md text-fg-muted">
                MONY s&apos;installe en deux gestes depuis le navigateur et s&apos;ouvre ensuite
                comme n&apos;importe quelle application — plein écran, avec son icône, et
                consultable même hors ligne.
              </p>
              <div className="mt-7 space-y-3">
                <div className="card flex items-start gap-3.5 p-4.5">
                  <span className="text-2xl">📱</span>
                  <div>
                    <p className="font-bold">iPhone</p>
                    <p className="text-sm text-fg-muted">
                      Ouvre MONY dans Safari, touche « Partager », puis « Sur l&apos;écran d&apos;accueil ».
                    </p>
                  </div>
                </div>
                <div className="card flex items-start gap-3.5 p-4.5">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <p className="font-bold">Android</p>
                    <p className="text-sm text-fg-muted">
                      Ouvre MONY dans Chrome, touche le menu, puis « Installer l&apos;application ».
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { big: "1", small: "chiffre clé chaque matin : ton budget du jour" },
                { big: "4", small: "devises — USD, CDF, EUR, GBP — converties automatiquement" },
                { big: "6", small: "mois d'historique comparés dans l'analyse" },
                { big: "0", small: "connexion bancaire requise, aujourd'hui comme demain" },
              ].map((stat) => (
                <div key={stat.small} className="card p-6">
                  <p className="aurora-text text-5xl font-extrabold tabular">{stat.big}</p>
                  <p className="mt-2 text-sm font-medium text-fg-muted">{stat.small}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- faq */}
      <section id="faq" className="scroll-mt-20 border-t border-border bg-surface/60">
        <div className="mx-auto max-w-3xl px-5 py-16 lg:py-24">
          <h2 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            Questions fréquentes
          </h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="card group p-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold tracking-tight [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="text-xl font-medium text-fg-subtle transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="px-5 pb-5 text-[15px] leading-relaxed text-fg-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- final CTA */}
      <section className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
        <div className="aurora relative overflow-hidden rounded-[2rem] px-8 py-14 text-center text-ink-fg sm:px-12 lg:py-20">
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-balance sm:text-4xl lg:text-5xl">
            Sache enfin ce que tu peux dépenser aujourd&apos;hui
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-muted text-balance">
            Crée ton compte gratuitement, configure ton cycle de paie en deux minutes, et ouvre
            l&apos;application demain matin avec un chiffre clair.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="press inline-flex h-13 items-center justify-center rounded-2xl bg-gradient-to-r from-accent to-accent-2 px-8 text-base font-bold text-accent-fg shadow-float transition-[filter] hover:brightness-105"
            >
              Créer mon compte gratuit
            </Link>
            <Link
              href="/login"
              className="press inline-flex h-13 items-center justify-center rounded-2xl border border-ink-fg/25 px-8 text-base font-semibold text-ink-fg transition-colors hover:bg-ink-fg/10"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
