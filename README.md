<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/brand/mony-logo-light.svg">
    <source media="(prefers-color-scheme: light)" srcset="public/brand/mony-logo-dark.svg">
    <img src="public/brand/mony-logo-dark.svg" alt="MONY" width="320">
  </picture>
</p>

<p align="center"><strong>Ton argent, en clair.</strong></p>

Application web de gestion financière personnelle, mobile-first, installable en PWA.
Elle répond à une question simple : **où part mon argent, et combien puis-je dépenser aujourd'hui jusqu'à la prochaine paie ?**

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions) · **TypeScript** · **Tailwind CSS v4**
- **Supabase** (Auth + PostgreSQL + Row Level Security)
- **PWA** : manifest, service worker, icônes, mode standalone iOS/Android
- Recharts (graphiques), Zod (validation serveur), date-fns, sonner (toasts), next-themes (clair/sombre)

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis renseigne l'URL et la clé publishable Supabase
npm run dev
```

Ouvre <http://localhost:3000>. Sur téléphone (même Wi-Fi) : `http://<ip-du-pc>:3000`.

### Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publique (jamais la service role key) |
| `NEXT_PUBLIC_SITE_URL` | URL publique, utilisée pour les liens de confirmation d'email |

### Base de données

Le schéma complet est dans [`supabase/migrations`](supabase/migrations). Il est déjà appliqué au projet Supabase « finance ».
Pour un nouveau projet : colle le contenu des fichiers dans l'éditeur SQL Supabase (dans l'ordre), ou `supabase db push`.

Tables : `profiles`, `settings`, `accounts`, `categories`, `income`, `recurring_expenses`, `savings_goals`, `transactions`, `budgets`, `notifications`.
Chaque table est protégée par RLS (`auth.uid() = user_id`). Un trigger sur `auth.users` crée le profil, les réglages, un compte et les catégories par défaut à l'inscription.

> Supabase demande par défaut une confirmation d'email à l'inscription. Pour tester plus vite : Dashboard → Authentication → Providers → Email → désactive « Confirm email ».
> En production, renseigne aussi `Site URL` et `Redirect URLs` (`https://ton-domaine/auth/callback`).

## Structure

```
src/
  app/                 routes (App Router)
    (auth)/            login, signup
    (app)/             écrans authentifiés : accueil, analyse, ajouter, objectifs, plus, transactions, budgets, revenus, récurrents, rapport, calendrier, notifications, paramètres
    onboarding/        configuration initiale (salaire, date de paie, charges)
    auth/callback/     échange du code de confirmation d'email
    manifest.ts        manifest PWA
  actions/             Server Actions (validation Zod + Supabase, RLS)
  services/            accès données côté serveur (getFinanceData, notifications, "today" fuseau utilisateur)
  lib/finance/         moteur de calcul pur : engine.ts (solde, cycle de paie, allocation quotidienne, budgets, objectifs, projections), insights.ts (analyse), cycles.ts, currency.ts
  lib/validation/      schémas Zod
  lib/supabase/        clients navigateur / serveur + types générés
  components/          UI (ui/), layout (bottom nav mobile, sidebar desktop), dashboard, transactions, budgets, goals, income, recurring, calendar, settings, charts
  proxy.ts             rafraîchit la session Supabase et protège les routes
public/sw.js           service worker (app shell, pages network-first, page hors ligne)
scripts/generate-icons.mjs  génère les icônes PWA et les assets de marque
```

## Logique financière (résumé)

- **Cycle de paie** : de la dernière date de paie (incluse) à la prochaine (exclue). Sans salaire configuré, le mois calendaire.
- **Solde** = comptes + revenus − dépenses − épargne (transactions jusqu'à aujourd'hui).
- **Argent libre** = solde − charges récurrentes à venir avant la paie − épargne planifiée restante (contributions mensuelles des objectifs non encore versées).
- **Montant quotidien** = argent libre ÷ jours restants avant la paie. Jamais arbitraire.
- **Projection** = argent libre − rythme moyen quotidien (hors charges fixes) × jours restants.
- **Budgets** et **rapport** : mois calendaire. Comparaisons « vs mois dernier » faites à date comparable.
- Les **charges récurrentes** génèrent automatiquement la dépense à chaque échéance.
- **Multi-devises** : les montants sont stockés dans leur devise ; l'affichage convertit avec les taux définis dans Paramètres et affiche toujours le taux utilisé.

## Mode démo

Paramètres → « Charger les données de démonstration » (salaire 650 $, loyer, internet, Netflix, budgets, objectifs, ~2 mois de dépenses). « Effacer les données de démo » ne supprime que ces lignes.

## Installer sur téléphone

- **iPhone** : Safari → Partager → « Sur l'écran d'accueil ».
- **Android** : Chrome → menu ⋮ → « Installer l'application ».

## Scripts

```bash
npm run dev       # développement
npm run build     # build de production
npm run start     # serveur de production
npm run lint      # ESLint
node scripts/generate-icons.mjs   # régénérer les icônes
```
