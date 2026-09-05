import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/marketing/legal";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description:
    "Les conditions d'utilisation du service MONY : compte, usage du service, données, responsabilité et résiliation.",
  alternates: { canonical: "/conditions" },
};

const CONTACT_EMAIL = "martinbitha6@gmail.com";

export default function TermsPage() {
  return (
    <LegalPage
      title="Conditions d'utilisation"
      updated="5 septembre 2026"
      intro={
        <>
          Ces conditions encadrent l&apos;utilisation de MONY, une application de suivi de budget
          personnel. En créant un compte ou en utilisant le service, tu acceptes ces conditions.
          Si tu n&apos;es pas d&apos;accord avec l&apos;une d&apos;elles, n&apos;utilise pas MONY.
        </>
      }
    >
      <LegalSection number="1" title="Le service">
        <p>
          MONY est une application web de gestion de budget personnel : tu y saisis tes revenus,
          dépenses, charges récurrentes, objectifs d&apos;épargne et dettes, et MONY calcule à
          partir de ces données ton solde, ton reste à dépenser et diverses analyses. Le service
          est édité par Martin Bitha (« nous », « l&apos;éditeur »).
        </p>
        <p>
          Le service est actuellement fourni <strong>gratuitement</strong>. Nous nous réservons le
          droit de faire évoluer l&apos;offre à l&apos;avenir ; toute évolution payante te serait
          annoncée à l&apos;avance et ne s&apos;appliquerait jamais rétroactivement.
        </p>
      </LegalSection>

      <LegalSection number="2" title="Ton compte">
        <p>
          Pour utiliser MONY, tu crées un compte avec une adresse e-mail valide et un mot de passe.
          L&apos;adresse est vérifiée par un code envoyé par e-mail.
        </p>
        <ul>
          <li>Tu es responsable de la confidentialité de tes identifiants et de toute activité effectuée depuis ton compte.</li>
          <li>Tu t&apos;engages à fournir des informations exactes et à les maintenir à jour.</li>
          <li>Un compte est personnel : il ne peut pas être vendu, cédé ou partagé.</li>
          <li>Tu dois avoir l&apos;âge légal requis dans ton pays pour consentir à ces conditions, ou l&apos;accord d&apos;un représentant légal.</li>
        </ul>
      </LegalSection>

      <LegalSection number="3" title="Ce que MONY n'est pas">
        <p>
          MONY est un outil de suivi et d&apos;organisation. Les chiffres, projections et messages
          affichés sont calculés uniquement à partir des données que <strong>tu</strong> as saisies.
        </p>
        <ul>
          <li>
            MONY <strong>n&apos;est pas un conseiller financier</strong> : rien dans
            l&apos;application ne constitue un conseil en investissement, un conseil fiscal ou une
            recommandation personnalisée au sens réglementaire.
          </li>
          <li>MONY n&apos;est pas un établissement bancaire ou de paiement : aucun argent ne transite par le service.</li>
          <li>
            MONY ne se connecte pas à tes comptes bancaires : l&apos;exactitude des données — et
            donc des calculs — dépend de ce que tu saisis.
          </li>
        </ul>
        <p>
          Les décisions que tu prends sur la base des informations affichées relèvent de ta seule
          responsabilité.
        </p>
      </LegalSection>

      <LegalSection number="4" title="Utilisation acceptable">
        <p>Tu t&apos;engages à ne pas :</p>
        <ul>
          <li>utiliser le service à des fins illégales ou frauduleuses ;</li>
          <li>tenter d&apos;accéder aux données d&apos;autres utilisateurs ou de contourner les mesures de sécurité ;</li>
          <li>perturber le fonctionnement du service (surcharge volontaire, ingénierie inverse, extraction automatisée massive) ;</li>
          <li>revendre ou exploiter commercialement le service sans notre accord écrit.</li>
        </ul>
      </LegalSection>

      <LegalSection number="5" title="Tes données">
        <p>
          Les données que tu saisis (transactions, budgets, objectifs, dettes, paramètres) restent{" "}
          <strong>ta propriété</strong>. Nous les hébergeons et les traitons uniquement pour faire
          fonctionner le service, dans les conditions décrites par la{" "}
          <Link href="/confidentialite" className="font-semibold text-fg underline-offset-4 hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>
        <ul>
          <li>Tu peux exporter tes données à tout moment (Excel, CSV) depuis l&apos;application.</li>
          <li>Tu peux demander la suppression de ton compte et des données associées (voir section 8).</li>
        </ul>
      </LegalSection>

      <LegalSection number="6" title="Disponibilité et évolution du service">
        <p>
          Nous faisons de notre mieux pour que MONY soit disponible et fiable, mais le service est
          fourni « en l&apos;état », sans garantie de disponibilité continue. Des interruptions
          peuvent survenir (maintenance, incident, dépendance à des services tiers d&apos;hébergement
          ou d&apos;envoi d&apos;e-mails).
        </p>
        <p>
          Nous pouvons faire évoluer, ajouter ou retirer des fonctionnalités. En cas de changement
          majeur défavorable ou d&apos;arrêt du service, nous t&apos;informerons dans un délai
          raisonnable pour te permettre d&apos;exporter tes données.
        </p>
      </LegalSection>

      <LegalSection number="7" title="Responsabilité">
        <p>
          Dans les limites permises par la loi, notre responsabilité ne saurait être engagée pour
          les dommages indirects : perte de données causée par un cas de force majeure, décision
          financière prise sur la base des chiffres affichés, indisponibilité temporaire du service,
          ou conséquence d&apos;une saisie erronée de ta part.
        </p>
        <p>
          Rien dans ces conditions n&apos;exclut une responsabilité qui ne peut pas être limitée par
          la loi applicable.
        </p>
      </LegalSection>

      <LegalSection number="8" title="Suspension et résiliation">
        <ul>
          <li>
            <strong>Par toi :</strong> tu peux cesser d&apos;utiliser MONY à tout moment et demander
            la suppression de ton compte en nous écrivant à {CONTACT_EMAIL}. La suppression est
            définitive.
          </li>
          <li>
            <strong>Par nous :</strong> nous pouvons suspendre ou fermer un compte en cas de
            violation grave ou répétée de ces conditions, après notification lorsque c&apos;est
            possible.
          </li>
        </ul>
      </LegalSection>

      <LegalSection number="9" title="Propriété intellectuelle">
        <p>
          Le nom MONY, le logo, l&apos;interface et le code de l&apos;application sont protégés.
          Ces conditions ne te transfèrent aucun droit de propriété intellectuelle : tu reçois un
          droit d&apos;utilisation personnel, non exclusif et non transférable du service.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Modification des conditions">
        <p>
          Nous pouvons mettre à jour ces conditions pour refléter l&apos;évolution du service ou de
          la réglementation. La date de dernière mise à jour figure en haut de cette page ; en cas
          de changement significatif, nous t&apos;en informerons (par e-mail ou dans
          l&apos;application). Continuer à utiliser MONY après l&apos;entrée en vigueur des
          nouvelles conditions vaut acceptation.
        </p>
      </LegalSection>

      <LegalSection number="11" title="Contact">
        <p>
          Pour toute question sur ces conditions ou sur le service : <strong>{CONTACT_EMAIL}</strong>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
