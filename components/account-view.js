"use client";

const PREMIUM_PERKS = [
  { title: "Recettes illimitées", detail: "Plus de limite de scans par jour." },
  { title: "Suivi avancé des économies", detail: "Statistiques mensuelles et objectifs personnalisés." },
  { title: "Listes de courses malines", detail: "Complète tes ingrédients manquants en un tap." },
  { title: "Mode chef", detail: "Variantes gastronomiques et accords suggérés." },
];

function euro(value) {
  return `${Number(value || 0).toFixed(2).replace(".", ",")} €`;
}

export default function AccountView({ user, authLoading, totalSaved, mealsCount, onSignIn, onSignOut, onUpgrade, authError }) {
  const meta = user?.user_metadata || {};
  const displayName = meta.full_name || meta.name || (user?.email ? user.email.split("@")[0] : "");
  const avatarUrl = meta.avatar_url || meta.picture || "";
  const initial = (displayName || user?.email || "?").charAt(0).toUpperCase();

  return (
    <section className="account-screen" aria-labelledby="account-title">
      <div className="welcome">
        <span className="section-kicker">TON COMPTE</span>
        <h1 id="account-title">{user ? "Ton profil" : "Connexion"}</h1>
        <p>{user ? "Gère ton compte et ton abonnement." : "Connecte-toi pour synchroniser tes économies sur tous tes appareils."}</p>
      </div>

      {user ? (
        <div className="account-card">
          <div className="account-identity">
            {avatarUrl ? (
              <img className="account-avatar" src={avatarUrl || "/placeholder.svg"} alt="" width={52} height={52} referrerPolicy="no-referrer" />
            ) : (
              <span className="account-avatar account-avatar-fallback" aria-hidden="true">{initial}</span>
            )}
            <div className="account-identity-copy">
              <strong>{displayName}</strong>
              <small>{user.email}</small>
            </div>
          </div>
          <div className="account-metrics">
            <div><strong>{euro(totalSaved)}</strong><span>économisés</span></div>
            <div><strong>{mealsCount}</strong><span>plats cuisinés</span></div>
          </div>
          <button type="button" className="account-signout" onClick={onSignOut}>Se déconnecter</button>
        </div>
      ) : (
        <div className="account-card">
          <button type="button" className="google-button" onClick={onSignIn} disabled={authLoading}>
            <span className="google-mark" aria-hidden="true">G</span>
            {authLoading ? "Connexion…" : "Continuer avec Google"}
          </button>
          {authError && <p className="scan-hint" role="alert" style={{ color: "var(--accent)" }}>{authError}</p>}
          <p className="account-legal">En continuant, tu acceptes de sauvegarder tes économies sur ton compte.</p>
        </div>
      )}

      <div className="premium-card">
        <div className="premium-head">
          <span className="premium-tag">PREMIUM</span>
          <div className="premium-price"><strong>4,99 €</strong><span>/ mois</span></div>
        </div>
        <h2>Passe au plan supérieur</h2>
        <p>Débloque tout le potentiel anti-gaspi de RandomCook.</p>
        <ul className="premium-perks">
          {PREMIUM_PERKS.map((perk) => (
            <li key={perk.title}>
              <span className="premium-check" aria-hidden="true">✓</span>
              <span><strong>{perk.title}</strong><small>{perk.detail}</small></span>
            </li>
          ))}
        </ul>
        <button type="button" className="premium-button" onClick={onUpgrade}>Passer à Premium</button>
      </div>
    </section>
  );
}
