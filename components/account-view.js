"use client";

import { useState } from "react";

const PREMIUM_PERKS = [
  { title: "Recettes illimitées", detail: "Plus de limite de scans par jour." },
  { title: "Suivi avancé des économies", detail: "Statistiques mensuelles et objectifs personnalisés." },
  { title: "Listes de courses malines", detail: "Complète tes ingrédients manquants en un tap." },
  { title: "Mode chef", detail: "Variantes gastronomiques et accords suggérés." },
];

function euro(value) {
  return `${Number(value || 0).toFixed(2).replace(".", ",")} €`;
}

export default function AccountView({ user, authLoading, isPremium, totalSaved, mealsCount, onSignIn, onSignOut, onUpgrade, onDeleteAccount, authError }) {
  const meta = user?.user_metadata || {};
  const displayName = meta.full_name || meta.name || (user?.email ? user.email.split("@")[0] : "");
  const avatarUrl = meta.avatar_url || meta.picture || "";
  const initial = (displayName || user?.email || "?").charAt(0).toUpperCase();

  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await onDeleteAccount();
      setConfirmOpen(false);
    } catch (err) {
      setDeleteError(err?.message || "Une erreur est survenue. Réessaie.");
    } finally {
      setDeleting(false);
    }
  };

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

      {isPremium ? (
        <div className="premium-card premium-card-active">
          <div className="premium-head">
            <span className="premium-tag">PREMIUM ACTIF</span>
            <span className="premium-active-check" aria-hidden="true">✓</span>
          </div>
          <h2>Tu es Premium</h2>
          <p>Toutes les fonctionnalités sont débloquées. Merci de soutenir RandomCook&nbsp;!</p>
          <ul className="premium-perks">
            {PREMIUM_PERKS.map((perk) => (
              <li key={perk.title}>
                <span className="premium-check" aria-hidden="true">✓</span>
                <span><strong>{perk.title}</strong><small>{perk.detail}</small></span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
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
      )}

      <div className="legal-card">
        <span className="section-kicker">CONFIDENTIALITÉ &amp; DONNÉES</span>
        <button type="button" className="legal-row" onClick={() => setPrivacyOpen(true)}>
          <span>Politique de confidentialité</span>
          <span className="legal-chevron" aria-hidden="true">›</span>
        </button>
        {user && (
          <button type="button" className="legal-row legal-row-danger" onClick={() => { setDeleteError(""); setConfirmOpen(true); }}>
            <span>Supprimer mon compte</span>
            <span className="legal-chevron" aria-hidden="true">›</span>
          </button>
        )}
      </div>

      {privacyOpen && (
        <div className="legal-overlay" role="dialog" aria-modal="true" aria-labelledby="privacy-title" onClick={() => setPrivacyOpen(false)}>
          <div className="legal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="legal-sheet-head">
              <h2 id="privacy-title">Politique de confidentialité</h2>
              <button type="button" className="legal-close" onClick={() => setPrivacyOpen(false)} aria-label="Fermer">×</button>
            </div>
            <div className="legal-sheet-body">
              <p className="legal-updated">Dernière mise à jour : 11 septembre 2026</p>
              <p>RandomCook t&apos;aide à cuisiner à partir de ce que tu as déjà, pour lutter contre le gaspillage alimentaire. Nous limitons la collecte de données au strict nécessaire.</p>
              <h3>Données que nous collectons</h3>
              <ul>
                <li><strong>Compte</strong> : ton adresse e-mail et ton nom, fournis lors de la connexion.</li>
                <li><strong>Usage anti-gaspi</strong> : les économies enregistrées et le nombre de plats cuisinés.</li>
                <li><strong>Photos de scan</strong> : les images de tes ingrédients sont analysées pour générer des recettes puis ne sont pas conservées.</li>
              </ul>
              <h3>Pourquoi</h3>
              <p>Ces données servent uniquement à faire fonctionner l&apos;application : te connecter, générer des recettes et synchroniser tes économies entre tes appareils. Nous ne vendons jamais tes données.</p>
              <h3>Hébergement</h3>
              <p>Tes données sont stockées de façon sécurisée chez notre sous-traitant Supabase. La génération de recettes utilise un service d&apos;IA qui traite temporairement le contenu de ton scan.</p>
              <h3>Conservation</h3>
              <p>Tes données sont conservées tant que ton compte existe. Tu peux supprimer ton compte à tout moment, ce qui efface définitivement toutes tes données associées.</p>
              <h3>Tes droits (RGPD)</h3>
              <p>Tu disposes d&apos;un droit d&apos;accès, de rectification, de portabilité et de suppression de tes données. La suppression est accessible directement depuis cet écran.</p>
              <h3>Contact</h3>
              <p>Pour toute question : privacy@randomcook.app</p>
              <p><a href="/confidentialite" target="_blank" rel="noopener noreferrer" style={{ color: "var(--sage)" }}>Voir la version web complète ↗</a></p>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="legal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={() => !deleting && setConfirmOpen(false)}>
          <div className="legal-confirm" onClick={(e) => e.stopPropagation()}>
            <h2 id="confirm-title">Supprimer ton compte&nbsp;?</h2>
            <p>Cette action est définitive. Ton compte, tes économies et ton historique de plats seront effacés et ne pourront pas être récupérés.</p>
            {deleteError && <p className="scan-hint" role="alert" style={{ color: "var(--accent)" }}>{deleteError}</p>}
            <div className="legal-confirm-actions">
              <button type="button" className="legal-cancel" onClick={() => setConfirmOpen(false)} disabled={deleting}>Annuler</button>
              <button type="button" className="legal-delete" onClick={handleDelete} disabled={deleting}>{deleting ? "Suppression…" : "Supprimer définitivement"}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
