import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/marketing/legal";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment MONY collecte, utilise et protège tes données : ce qui est enregistré, où c'est hébergé, et tes droits (accès, export, suppression).",
  alternates: { canonical: "/confidentialite" },
};

const CONTACT_EMAIL = "martinbitha6@gmail.com";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      updated="5 septembre 2026"
      intro={
        <>
          MONY repose sur un principe simple : <strong className="font-semibold text-fg">tes données financières t&apos;appartiennent</strong>.
          Nous ne collectons que ce qui est nécessaire au fonctionnement du service, nous ne vendons
          rien à personne, et tu peux exporter ou supprimer tes données à tout moment. Cette page
          détaille ce que nous enregistrons, pourquoi, et quels sont tes droits.
        </>
      }
    >
      <LegalSection number="1" title="Qui est responsable du traitement ?">
        <p>
          Le service MONY est édité par Martin Bitha, qui agit comme responsable du traitement des
          données décrites ici. Contact : <strong>{CONTACT_EMAIL}</strong>.
        </p>
      </LegalSection>

      <LegalSection number="2" title="Les données que nous collectons">
        <p>Uniquement ce que tu fournis en utilisant l&apos;application :</p>
        <ul>
          <li>
            <strong>Données de compte :</strong> adresse e-mail, prénom (facultatif), mot de passe
            (stocké uniquement sous forme hachée — nous ne pouvons pas le lire).
          </li>
          <li>
            <strong>Données financières saisies par toi :</strong> revenus, dépenses, comptes,
            charges récurrentes, budgets, objectifs d&apos;épargne, dettes, devises et taux de
            conversion choisis, jour de paie.
          </li>
          <li>
            <strong>Préférences :</strong> devise d&apos;affichage, thème, réglages de
            notifications.
          </li>
          <li>
            <strong>Abonnement aux notifications push</strong> (si tu l&apos;actives) : l&apos;adresse
            technique fournie par ton navigateur pour te délivrer les notifications.
          </li>
        </ul>
        <p>
          MONY <strong>ne se connecte jamais à ta banque</strong> et ne collecte ni numéro de compte
          bancaire, ni numéro de carte, ni identifiants bancaires. Nous n&apos;utilisons pas de
          cookies publicitaires ni d&apos;outils de suivi à des fins marketing ; les seuls cookies
          utilisés servent à maintenir ta session connectée.
        </p>
      </LegalSection>

      <LegalSection number="3" title="Pourquoi nous les utilisons">
        <ul>
          <li>Faire fonctionner le service : calculer ton solde, ton reste à dépenser, tes analyses et tes rapports.</li>
          <li>T&apos;authentifier et sécuriser ton compte (vérification de l&apos;e-mail par code).</li>
          <li>T&apos;envoyer les e-mails que tu demandes (codes de connexion, rapport financier).</li>
          <li>T&apos;envoyer les notifications push que tu as explicitement activées (rappels de charges, alertes de budget).</li>
        </ul>
        <p>
          Nous n&apos;utilisons pas tes données pour de la publicité, nous ne les vendons pas et
          nous ne les partageons pas avec des tiers à des fins commerciales.
        </p>
      </LegalSection>

      <LegalSection number="4" title="Où tes données sont-elles hébergées ?">
        <p>Pour fonctionner, MONY s&apos;appuie sur un petit nombre de sous-traitants techniques :</p>
        <ul>
          <li>
            <strong>Supabase</strong> — hébergement de la base de données et authentification.
            Chaque compte dispose d&apos;un espace isolé : des règles de sécurité au niveau de la
            base de données (Row Level Security) garantissent qu&apos;un utilisateur ne peut lire et
            modifier que ses propres données.
          </li>
          <li>
            <strong>Brevo</strong> — envoi des e-mails transactionnels (codes de vérification,
            rapports envoyés par e-mail à ta demande). Brevo ne reçoit que ton adresse e-mail et le
            contenu du message.
          </li>
          <li>
            <strong>L&apos;hébergeur de l&apos;application web</strong>, qui sert les pages et les
            requêtes de manière chiffrée (HTTPS).
          </li>
        </ul>
        <p>
          Toutes les communications entre ton appareil et le service sont chiffrées (HTTPS). Ces
          prestataires agissent uniquement sur nos instructions, pour faire fonctionner le service.
        </p>
      </LegalSection>

      <LegalSection number="5" title="Combien de temps les gardons-nous ?">
        <p>
          Tes données sont conservées tant que ton compte est actif. Si tu supprimes ton compte,
          l&apos;ensemble de tes données (profil, transactions, budgets, objectifs, dettes,
          abonnements aux notifications) est supprimé définitivement.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Tes droits">
        <p>Tu disposes à tout moment des droits suivants sur tes données :</p>
        <ul>
          <li>
            <strong>Accès et portabilité :</strong> l&apos;application te permet d&apos;exporter
            l&apos;ensemble de tes données financières aux formats Excel et CSV, sans nous demander
            quoi que ce soit.
          </li>
          <li>
            <strong>Rectification :</strong> toutes les données saisies sont modifiables directement
            dans l&apos;application.
          </li>
          <li>
            <strong>Suppression :</strong> tu peux demander la suppression complète de ton compte en
            écrivant à {CONTACT_EMAIL}.
          </li>
          <li>
            <strong>Retrait du consentement :</strong> les notifications push se désactivent à tout
            moment depuis les paramètres de l&apos;application ou de ton navigateur.
          </li>
        </ul>
        <p>
          Pour exercer un droit qui n&apos;est pas couvert par l&apos;application elle-même,
          écris-nous à <strong>{CONTACT_EMAIL}</strong> ; nous répondons dans un délai raisonnable.
        </p>
      </LegalSection>

      <LegalSection number="7" title="Sécurité">
        <ul>
          <li>Mots de passe stockés hachés, jamais en clair.</li>
          <li>Vérification de l&apos;adresse e-mail par code à usage unique.</li>
          <li>Isolation des données par compte, appliquée au niveau de la base de données.</li>
          <li>Chiffrement des échanges (HTTPS) et clés d&apos;accès serveur jamais exposées au navigateur.</li>
        </ul>
        <p>
          Aucun système n&apos;est infaillible, mais nous appliquons ces protections par défaut et
          les faisons évoluer avec le service.
        </p>
      </LegalSection>

      <LegalSection number="8" title="Enfants">
        <p>
          MONY ne s&apos;adresse pas aux enfants. Si tu n&apos;as pas l&apos;âge requis dans ton
          pays pour consentir seul au traitement de tes données, utilise le service avec
          l&apos;accord d&apos;un représentant légal.
        </p>
      </LegalSection>

      <LegalSection number="9" title="Modifications de cette politique">
        <p>
          Si cette politique évolue, la date de mise à jour en haut de page sera modifiée et, en cas
          de changement significatif, nous t&apos;en informerons par e-mail ou dans
          l&apos;application avant son entrée en vigueur.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Contact">
        <p>
          Pour toute question relative à tes données : <strong>{CONTACT_EMAIL}</strong>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
