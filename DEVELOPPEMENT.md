# MONY — Guide de développement

Documentation technique du projet. Pour la présentation générale, voir le [README](README.md).

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

Tables : `profiles`, `settings`, `accounts`, `categories`, `income`, `recurring_expenses`, `savings_goals`, `transactions`, `budgets`, `debts`, `notifications`.
Chaque table est protégée par RLS (`auth.uid() = user_id`). Un trigger sur `auth.users` crée le profil, les réglages, un compte et les catégories par défaut à l'inscription.

> Supabase demande par défaut une confirmation d'email à l'inscription. Pour tester plus vite : Dashboard → Authentication → Providers → Email → désactive « Confirm email ».
> En production, renseigne aussi `Site URL` et `Redirect URLs` (`https://ton-domaine/auth/callback`).

### E-mails (SMTP Brevo)

Le service d'e-mail intégré de Supabase est limité à quelques envois par heure. L'e-mail de confirmation d'inscription passe donc par le SMTP de Brevo, configuré dans le dashboard Supabase (Authentication → Emails → SMTP Settings → « Enable Custom SMTP »). Aucune variable d'environnement côté app : c'est Supabase qui envoie.

| Champ | Valeur |
| --- | --- |
| Sender email | `martinbitha6@gmail.com` (expéditeur validé dans Brevo → Paramètres → Expéditeurs) |
| Sender name | `MONY` |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | le login SMTP affiché sur <https://app.brevo.com/settings/keys/smtp> (forme `xxxx@smtp-brevo.com`) |
| Password | une **clé SMTP** Brevo (`xsmtpsib-…`), pas une clé API (`xkeysib-…`). À générer sur la même page. Jamais dans le dépôt. |

**Inscription par code (OTP).** L'utilisateur reçoit un code à 6 chiffres et le saisit dans l'app (`VerifyCodeForm`), qui appelle `verifySignupCode` → `supabase.auth.verifyOtp({ type: "signup" })`. Pas de lien à cliquer, donc pas de dépendance à `Site URL`.

Modèle « Confirm signup » (Authentication → Emails → Templates) : sujet `Ton code MONY : {{ .Token }}`, corps dans [`supabase/templates/confirm-signup.html`](supabase/templates/confirm-signup.html). Le corps doit contenir `{{ .Token }}` ; s'il contient `{{ .ConfirmationURL }}` à la place, l'utilisateur reçoit un lien et le code saisi est refusé. Vérifier aussi Authentication → Providers → Email → « Email OTP Length » = 6 et « Email OTP Expiration » (3600 s par défaut, c'est la durée annoncée dans l'app et l'e-mail).

`/auth/callback` reste en place pour les liens (magic link, récupération de mot de passe).

Pièges connus :

- `525 5.7.1 Unauthorized IP address` : la restriction « adresses IP autorisées » est active sur le compte Brevo (Paramètres → Sécurité). La désactiver, Supabase envoie depuis des IP variables.
- Sans domaine propre validé dans Brevo, l'expéditeur Gmail est réécrit en `…@brevosend.com`. Un domaine d'envoi authentifié (SPF/DKIM) règle ça.
- Vérification : inscription depuis l'app → événement « delivered » dans Brevo → Transactionnel → Journaux.

## Structure

```
src/
  app/                 routes (App Router)
    (auth)/            login, signup
    (app)/             écrans authentifiés : accueil, analyse, ajouter, objectifs, plus, transactions, budgets, revenus, récurrents, dettes, rapport, calendrier, notifications, paramètres
    onboarding/        configuration initiale (salaire, date de paie, charges)
    auth/callback/     échange du code de confirmation d'email
    manifest.ts        manifest PWA
  actions/             Server Actions (validation Zod + Supabase, RLS)
  services/            accès données côté serveur (getFinanceData, notifications, "today" fuseau utilisateur)
  lib/finance/         moteur de calcul pur : engine.ts (solde, cycle de paie, allocation quotidienne, budgets, objectifs, projections), insights.ts (analyse), debts.ts, cycles.ts, currency.ts
  lib/validation/      schémas Zod
  lib/supabase/        clients navigateur / serveur + types générés
  components/          UI (ui/), layout (bottom nav mobile, sidebar desktop), dashboard, transactions, budgets, goals, income, recurring, debts, calendar, settings, charts
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
- Les **charges récurrentes** génèrent automatiquement la dépense à chaque échéance. Une charge hebdomadaire peut viser plusieurs jours (`recurring_expenses.weekdays`, ISO 1 = lundi … 7 = dimanche, ex. transport du lundi au samedi) : une dépense est créée pour chaque jour sélectionné, le calendrier et « À venir » les listent, et l'équivalent mensuel vaut montant × jours × 4,35. Sans sélection, la charge tombe une fois par semaine, le jour de la date de départ. Logique dans [`src/lib/finance/cycles.ts`](src/lib/finance/cycles.ts) (`advance`, `occurrencesInRange`, `alignToWeekdays`).
- **Dettes** (`debts`) : ce que je dois (`owed`) et ce qu'on me doit (`lent`). Les remboursements sont des transactions liées (`transactions.debt_id`) ; la dette passe « liquidée » quand ils atteignent le capital. La mensualité prévue non encore payée dans le cycle est retirée de l'argent libre. Pour chaque dette : restant, % remboursé, jours/mois avant l'échéance, mensualité requise pour tenir la date, date de liquidation estimée au rythme prévu.
- **Multi-devises** : les montants sont stockés dans leur devise ; l'affichage convertit avec les taux définis dans Paramètres et affiche toujours le taux utilisé.

## Export

Depuis Paramètres → « Recevoir mon rapport par e-mail » ou en bas du Rapport du mois. L'action principale (`emailReport` dans [`src/actions/export.ts`](src/actions/export.ts)) génère les deux formats côté serveur et les envoie **sur l'adresse du compte uniquement**, avec un objet (« Ton rapport MONY · période ») et un message HTML/texte résumant revenus, dépenses, épargne, reste et la liste des pièces jointes ([`src/lib/report/email.ts`](src/lib/report/email.ts)). L'envoi passe par l'API Brevo ([`src/lib/mail/brevo.ts`](src/lib/mail/brevo.ts)) :

| Variable | Rôle |
| --- | --- |
| `BREVO_API_KEY` | **Transport 1, recommandé.** Clé API v3 (`xkeysib-…`), <https://app.brevo.com/settings/keys/api>. Passe en HTTPS, donc fonctionne même quand les ports SMTP sont bloqués. |
| `BREVO_SMTP_KEY` / `BREVO_SMTP_LOGIN` | **Transport 2**, utilisé si `BREVO_API_KEY` est vide. Clé SMTP (`xsmtpsib-…`) et login affichés sur <https://app.brevo.com/settings/keys/smtp> (le login peut être l'e-mail du compte ou une forme `xxxx@smtp-brevo.com`). Relais `smtp-relay.brevo.com:587` via nodemailer ; `BREVO_SMTP_PORT=465` pour TLS implicite. |
| `MAIL_FROM_EMAIL` | expéditeur validé dans Brevo (défaut `martinbitha6@gmail.com`) |
| `MAIL_FROM_NAME` | nom d'expéditeur (défaut `MONY`) |

Sans aucun transport, l'app affiche « envoi non activé » et propose le téléchargement direct. Attention : une clé SMTP n'est **pas** acceptée par l'API HTTP (401), et certains réseaux (box, hébergeur) bloquent les ports 25/465/587/2525 sortants : dans ce cas seul le transport API fonctionne.

Le téléchargement direct sur l'appareil reste disponible en repli (« Télécharger sur cet appareil plutôt »). Deux formats :

- **Rapport Excel** (`GET /api/export?scope=month|cycle|quarter|year|all`) : classeur généré côté serveur avec ExcelJS pour l'utilisateur connecté (RLS). Sept feuilles : Synthèse (bandeau de marque + logo, cartes KPI, situation du jour, période, budgets, épargne/dettes, analyse automatique, panneau latéral « où va ton argent »), Transactions (en-tête figé, filtres, pastilles, totaux, taux de change utilisés), Budgets, Objectifs, Dettes, Charges récurrentes, Graphiques (tendance 6 mois, reste mensuel, camembert des catégories). Les graphiques sont de **vrais graphiques Excel** injectés dans le zip OOXML par [`src/lib/report/charts.ts`](src/lib/report/charts.ts). Boîte à outils de mise en forme : [`src/lib/report/xlsx.ts`](src/lib/report/xlsx.ts) ; assemblage : [`src/lib/report/build.ts`](src/lib/report/build.ts). Le logo embarqué (`src/lib/report/logo.ts`) se régénère avec :

  ```bash
  node -e "const fs=require('fs');const b=fs.readFileSync('public/icons/icon-192.png').toString('base64');fs.writeFileSync('src/lib/report/logo.ts','export const LOGO_MONY = { width: 192, height: 192, b64: \'' + b + '\' } as const;\n')"
  ```

- **CSV brut** (séparateur `;`, BOM UTF-8), généré côté client depuis le store via [`src/lib/export-csv.ts`](src/lib/export-csv.ts).

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
