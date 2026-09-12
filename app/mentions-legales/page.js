import Link from "next/link";
import Logo from "@/components/logo";

export const metadata = {
  title: "Mentions légales — RandomCook",
  description:
    "Mentions légales de RandomCook : éditeur, directeur de la publication, hébergement et contact.",
};

export default function MentionsLegalesPage() {
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
        <span className="section-kicker">INFORMATIONS LÉGALES</span>
        <h1>Mentions légales</h1>
        <p className="legal-updated">Dernière mise à jour : 12 septembre 2026</p>

        <p className="legal-fill-note">
          Les éléments entre crochets doivent être complétés avec les informations réelles de
          l&apos;éditeur avant toute publication publique ou soumission sur l&apos;App Store.
        </p>

        <h2>Éditeur de l&apos;application</h2>
        <p>
          L&apos;application RandomCook est éditée par&nbsp;:
        </p>
        <ul>
          <li><strong>Nom / raison sociale</strong> : [À COMPLÉTER — nom de l&apos;éditeur ou de la société]</li>
          <li><strong>Forme juridique</strong> : [À COMPLÉTER — ex. auto-entrepreneur, SAS, SARL]</li>
          <li><strong>Adresse</strong> : [À COMPLÉTER — adresse postale complète]</li>
          <li><strong>Immatriculation</strong> : [À COMPLÉTER — SIREN / SIRET, ou RCS le cas échéant]</li>
          <li><strong>Numéro de TVA intracommunautaire</strong> : [À COMPLÉTER si applicable]</li>
          <li><strong>E-mail de contact</strong> : <a href="mailto:support@randomcook.app">support@randomcook.app</a></li>
        </ul>

        <h2>Directeur de la publication</h2>
        <p>[À COMPLÉTER — nom du directeur ou de la directrice de la publication]</p>

        <h2>Hébergement</h2>
        <p>
          L&apos;application est hébergée par <strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133,
          Walnut, CA 91789, États-Unis.
        </p>
        <p>
          Les données de compte et d&apos;usage sont stockées par notre sous-traitant{" "}
          <strong>Supabase</strong> (Supabase, Inc.). La génération de recettes s&apos;appuie sur un
          fournisseur d&apos;intelligence artificielle tiers auquel le contenu du scan est transmis
          de façon temporaire (voir la{" "}
          <Link href="/confidentialite">politique de confidentialité</Link>).
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des éléments de l&apos;application (marque, logo, textes, interface) est
          protégé. Toute reproduction sans autorisation est interdite. Les recettes générées te sont
          fournies à titre indicatif&nbsp;: vérifie toujours la fraîcheur et la bonne conservation
          des aliments avant de cuisiner.
        </p>

        <h2>Contact</h2>
        <p>
          Pour toute question&nbsp;: <a href="mailto:support@randomcook.app">support@randomcook.app</a>
        </p>

        <Link href="/" className="legal-page-back">Retour à l&apos;application</Link>
      </article>
    </main>
  );
}
