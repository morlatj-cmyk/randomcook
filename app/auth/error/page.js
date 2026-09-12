import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="app-shell">
      <div className="welcome" style={{ marginTop: 40 }}>
        <span className="section-kicker">CONNEXION</span>
        <h1>Connexion impossible</h1>
        <p className="lede">La connexion n&apos;a pas pu aboutir. Réessaie depuis ton compte.</p>
      </div>
      <Link href="/" className="scan-card" style={{ marginTop: 24 }}>
        <span className="scan-card-copy"><strong>Retour à l&apos;accueil</strong><small>Reprendre le scan</small></span>
        <span className="chevron" aria-hidden="true">›</span>
      </Link>
    </main>
  );
}
