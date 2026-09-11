import Link from "next/link";
import Logo from "@/components/logo";

export const metadata = {
  title: "Conditions générales de vente — RandomCook",
  description:
    "Conditions générales de vente de l'abonnement Premium RandomCook : prix, reconduction, droit de rétractation, résiliation et remboursement.",
};

export default function CgvPage() {
  return (
    <main className="legal-page">
      <header className="legal-page-bar">
        <Link href="/" className="app-brand" aria-label="Retour à l'accueil RandomCook">
          <span className="brand-mark" aria-hidden="true"><Logo size={22} /></span>
          <span>
            <strong>RandomCook</strong>
            <span>Cuisine anti-gaspi</span>
          </span>
        </Link>
      </header>

      <article className="legal-page-body">
        <span className="section-kicker">ABONNEMENT PREMIUM</span>
        <h1>Conditions générales de vente</h1>
        <p className="legal-updated">Dernière mise à jour : 11 septembre 2026</p>

        <p>
          Les présentes conditions générales de vente (CGV) régissent la souscription à
          l&apos;abonnement Premium de RandomCook. En souscrivant, tu acceptes ces conditions.
        </p>

        <h2>1. Service et prix</h2>
        <p>
          L&apos;abonnement Premium donne accès aux scans illimités et aux fonctionnalités avancées
          de l&apos;application. Il est proposé au prix de <strong>4,99 € TTC par mois</strong>. La
          version gratuite reste utilisable sans paiement, dans la limite de 2 scans par jour.
        </p>

        <h2>2. Paiement</h2>
        <p>
          Le paiement est traité de façon sécurisée par notre prestataire Stripe. Ton numéro de
          carte n&apos;est jamais stocké par RandomCook. Le prélèvement intervient au moment de la
          souscription, puis à chaque échéance mensuelle.
        </p>

        <h2>3. Reconduction</h2>
        <p>
          L&apos;abonnement est reconduit tacitement chaque mois pour une nouvelle période d&apos;un
          mois, tant que tu ne l&apos;as pas résilié. Chaque renouvellement est facturé au tarif en
          vigueur.
        </p>

        <h2>4. Droit de rétractation</h2>
        <p>
          Conformément au droit de la consommation, tu disposes d&apos;un délai de{" "}
          <strong>14 jours</strong> pour te rétracter à compter de la souscription, sans avoir à te
          justifier.
        </p>
        <p>
          Toutefois, l&apos;abonnement Premium étant un contenu numérique fourni immédiatement, tu
          es invité à demander expressément l&apos;accès immédiat au service et à reconnaître que tu
          renonces à ton droit de rétractation une fois le service pleinement exécuté. Si tu
          n&apos;as pas encore utilisé le service, tu conserves ton droit de rétractation pendant 14
          jours.
        </p>

        <h2>5. Résiliation</h2>
        <p>
          Tu peux résilier ton abonnement à tout moment depuis l&apos;onglet Compte de
          l&apos;application ou en nous contactant. La résiliation prend effet à la fin de la période
          mensuelle en cours : tu conserves l&apos;accès Premium jusqu&apos;à cette date, sans
          reconduction ultérieure.
        </p>

        <h2>6. Remboursement</h2>
        <p>
          En cas d&apos;exercice valide du droit de rétractation, tu es remboursé de la somme versée.
          En dehors de ce cas, les périodes déjà entamées ne sont pas remboursées, sauf obligation
          légale contraire ou dysfonctionnement avéré du service.
        </p>

        <h2>7. Contact</h2>
        <p>
          Pour toute question relative à ton abonnement ou pour exercer ton droit de rétractation :{" "}
          <a href="mailto:support@randomcook.app">support@randomcook.app</a>
        </p>

        <Link href="/" className="legal-page-back">Retour à l&apos;application</Link>
      </article>
    </main>
  );
}
