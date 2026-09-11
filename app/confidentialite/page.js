import Link from "next/link";
import Logo from "@/components/logo";

export const metadata = {
  title: "Politique de confidentialité — RandomCook",
  description:
    "Comment RandomCook collecte, utilise et protège tes données personnelles, conformément au RGPD.",
};

export default function ConfidentialitePage() {
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
        <span className="section-kicker">CONFIDENTIALITÉ &amp; DONNÉES</span>
        <h1>Politique de confidentialité</h1>
        <p className="legal-updated">Dernière mise à jour : 11 septembre 2026</p>

        <p>
          RandomCook t&apos;aide à cuisiner à partir de ce que tu as déjà, pour lutter contre le
          gaspillage alimentaire. Nous limitons la collecte de données au strict nécessaire.
        </p>

        <h2>Données que nous collectons</h2>
        <ul>
          <li><strong>Compte</strong> : ton adresse e-mail et ton nom, fournis lors de la connexion.</li>
          <li><strong>Usage anti-gaspi</strong> : les économies enregistrées et le nombre de plats cuisinés.</li>
          <li><strong>Photos de scan</strong> : les images de tes ingrédients sont analysées pour générer des recettes puis ne sont pas conservées.</li>
        </ul>

        <h2>Pourquoi</h2>
        <p>
          Ces données servent uniquement à faire fonctionner l&apos;application : te connecter,
          générer des recettes et synchroniser tes économies entre tes appareils. Nous ne vendons
          jamais tes données.
        </p>

        <h2>Hébergement</h2>
        <p>
          Tes données sont stockées de façon sécurisée chez notre sous-traitant Supabase. La
          génération de recettes utilise un service d&apos;IA qui traite temporairement le contenu
          de ton scan.
        </p>

        <h2>Conservation</h2>
        <p>
          Tes données sont conservées tant que ton compte existe. Tu peux supprimer ton compte à
          tout moment depuis l&apos;onglet Compte de l&apos;application, ce qui efface définitivement
          toutes tes données associées.
        </p>

        <h2>Tes droits (RGPD)</h2>
        <p>
          Tu disposes d&apos;un droit d&apos;accès, de rectification, de portabilité et de
          suppression de tes données. La suppression est accessible directement depuis
          l&apos;application, et tu peux nous contacter pour exercer les autres droits.
        </p>

        <h2>Contact</h2>
        <p>
          Pour toute question relative à tes données : <a href="mailto:privacy@randomcook.app">privacy@randomcook.app</a>
        </p>

        <Link href="/" className="legal-page-back">Retour à l&apos;application</Link>
      </article>
    </main>
  );
}
