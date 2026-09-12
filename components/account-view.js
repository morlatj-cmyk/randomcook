"use client";

import { useState } from "react";
import AuthPanel from "@/components/auth-panel";
import {
  getSubscriptionInfo,
  cancelPremiumSubscription,
  resumePremiumSubscription,
} from "@/app/actions/stripe";

function formatDate(ms) {
  if (!ms) return "";
  try {
    return new Date(ms).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

const PREMIUM_PERKS = [
  { title: "Recettes illimitées", detail: "Plus de limite de scans par jour." },
  { title: "Suivi avancé des économies", detail: "Statistiques mensuelles et objectifs personnalisés." },
  { title: "Listes de courses malines", detail: "Complète tes ingrédients manquants en un tap." },
  { title: "Mode chef", detail: "Variantes gastronomiques et accords suggérés." },
];

function euro(value) {
  return `${Number(value || 0).toFixed(2).replace(".", ",")} €`;
}

export default function AccountView({ user, isPremium, totalSaved, mealsCount, onEmailSignIn, onEmailSignUp, onSignOut, onUpgrade, onDeleteAccount }) {
  const meta = user?.user_metadata || {};
  const displayName = meta.full_name || meta.name || (user?.email ? user.email.split("@")[0] : "");
  const avatarUrl = meta.avatar_url || meta.picture || "";
  const initial = (displayName || user?.email || "?").charAt(0).toUpperCase();

  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [manageOpen, setManageOpen] = useState(false);
  const [subInfo, setSubInfo] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState("");
  const [cancelStep, setCancelStep] = useState(0);
  const [working, setWorking] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);

  const loadSubInfo = async () => {
    setSubLoading(true);
    setSubError("");
    try {
      setSubInfo(await getSubscriptionInfo());
    } catch {
      setSubError("Impossible de charger les détails de ton abonnement. Réessaie.");
    } finally {
      setSubLoading(false);
    }
  };

  const openManage = () => {
    setCancelStep(0);
    setCancelDone(false);
    setSubError("");
    setManageOpen(true);
    loadSubInfo();
  };

  const closeManage = () => {
    if (working) return;
    setManageOpen(false);
    setCancelStep(0);
  };

  const confirmCancel = async () => {
    setWorking(true);
    setSubError("");
    try {
      const info = await cancelPremiumSubscription();
      setSubInfo(info);
      setCancelStep(0);
      setCancelDone(true);
    } catch {
      setSubError("La résiliation a échoué. Réessaie dans un instant.");
      setCancelStep(0);
    } finally {
      setWorking(false);
    }
  };

  const reactivate = async () => {
    setWorking(true);
    setSubError("");
    try {
      const info = await resumePremiumSubscription();
      setSubInfo(info);
      setCancelDone(false);
    } catch {
      setSubError("La réactivation a échoué. Réessaie dans un instant.");
    } finally {
      setWorking(false);
    }
  };

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
          <AuthPanel
            onEmailSignIn={onEmailSignIn}
            onEmailSignUp={onEmailSignUp}
          />
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
          <button type="button" className="manage-sub-button" onClick={openManage}>Gérer mon abonnement</button>
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
        <a href="/cgv" target="_blank" rel="noopener noreferrer" className="legal-row">
          <span>Conditions générales de vente</span>
          <span className="legal-chevron" aria-hidden="true">›</span>
        </a>
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
              <h3>Paiement</h3>
              <p>L&apos;abonnement Premium est traité par notre prestataire de paiement Stripe. Nous ne voyons ni ne stockons jamais ton numéro de carte : seules les données strictement nécessaires (statut de l&apos;abonnement, historique de facturation) sont conservées pour la gestion de ton compte.</p>
              <h3>Conservation</h3>
              <p>Tes données sont conservées tant que ton compte existe. Tu peux supprimer ton compte à tout moment, ce qui efface définitivement toutes tes données associées.</p>
              <h3>Tes droits (RGPD)</h3>
              <p>Tu disposes d&apos;un droit d&apos;accès, de rectification, de portabilité et de suppression de tes données. La suppression est accessible directement depuis cet écran.</p>
              <h3>Contact</h3>
              <p>Pour toute question : privacy@randomcook.app</p>
              <p><a href="/confidentialite" target="_blank" rel="noopener noreferrer" style={{ color: "var(--sage)" }}>Voir la version web complète ↗</a></p>
              <p><a href="/cgv" target="_blank" rel="noopener noreferrer" style={{ color: "var(--sage)" }}>Conditions générales de vente ↗</a></p>
            </div>
          </div>
        </div>
      )}

      {manageOpen && (
        <div className="legal-overlay" role="dialog" aria-modal="true" aria-labelledby="manage-title" onClick={closeManage}>
          <div className="legal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="legal-sheet-head">
              <h2 id="manage-title">Gérer mon abonnement</h2>
              <button type="button" className="legal-close" onClick={closeManage} aria-label="Fermer" disabled={working}>×</button>
            </div>
            <div className="legal-sheet-body">
              <div className="sub-plan-row">
                <div>
                  <strong>RandomCook Premium</strong>
                  <small>Scans illimités et toutes les fonctionnalités</small>
                </div>
                <span className="sub-plan-price">4,99&nbsp;€<em>/mois</em></span>
              </div>

              {subLoading ? (
                <p className="sub-status" role="status">Chargement des détails…</p>
              ) : subError ? (
                <p className="sub-status sub-status-error" role="alert">{subError}</p>
              ) : subInfo ? (
                cancelDone || subInfo.cancelAtPeriodEnd ? (
                  <>
                    <div className="sub-status sub-status-warn">
                      <strong>Résiliation programmée</strong>
                      <span>Ton accès Premium reste actif jusqu&apos;au {formatDate(subInfo.periodEnd)}. Tu ne seras plus débité ensuite.</span>
                    </div>
                    <button type="button" className="premium-button" onClick={reactivate} disabled={working}>
                      {working ? "Réactivation…" : "Réactiver mon abonnement"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="sub-status">
                      <strong>Abonnement actif</strong>
                      <span>Prochain renouvellement le {formatDate(subInfo.periodEnd)}.</span>
                    </div>
                    <button type="button" className="sub-cancel-link" onClick={() => setCancelStep(1)} disabled={working}>
                      Résilier mon abonnement
                    </button>
                  </>
                )
              ) : null}
            </div>
          </div>
        </div>
      )}

      {cancelStep === 1 && (
        <div className="legal-overlay legal-overlay-top" role="dialog" aria-modal="true" aria-labelledby="retain1-title" onClick={() => setCancelStep(0)}>
          <div className="legal-confirm" onClick={(e) => e.stopPropagation()}>
            <h2 id="retain1-title">Attends une seconde…</h2>
            <p>En résiliant, tu perds l&apos;accès à&nbsp;:</p>
            <ul className="retention-perks">
              {PREMIUM_PERKS.map((perk) => (
                <li key={perk.title}><span aria-hidden="true">✕</span>{perk.title}</li>
              ))}
            </ul>
            <div className="legal-confirm-actions">
              <button type="button" className="legal-cancel" onClick={() => setCancelStep(2)}>Continuer</button>
              <button type="button" className="premium-button retention-keep" onClick={() => setCancelStep(0)}>Garder Premium</button>
            </div>
          </div>
        </div>
      )}

      {cancelStep === 2 && (
        <div className="legal-overlay legal-overlay-top" role="dialog" aria-modal="true" aria-labelledby="retain2-title" onClick={() => setCancelStep(0)}>
          <div className="legal-confirm" onClick={(e) => e.stopPropagation()}>
            <h2 id="retain2-title">Tu as déjà économisé {euro(totalSaved)}</h2>
            <p>Grâce à Premium, tu cuisines ce que tu as et tu jettes moins. À 4,99&nbsp;€/mois, ton abonnement se rembourse en général dès le premier plat sauvé du gaspillage.</p>
            <div className="legal-confirm-actions">
              <button type="button" className="legal-cancel" onClick={() => setCancelStep(3)}>Continuer la résiliation</button>
              <button type="button" className="premium-button retention-keep" onClick={() => setCancelStep(0)}>Rester Premium</button>
            </div>
          </div>
        </div>
      )}

      {cancelStep === 3 && (
        <div className="legal-overlay legal-overlay-top" role="dialog" aria-modal="true" aria-labelledby="retain3-title" onClick={() => !working && setCancelStep(0)}>
          <div className="legal-confirm" onClick={(e) => e.stopPropagation()}>
            <h2 id="retain3-title">Confirmer la résiliation&nbsp;?</h2>
            <p>Ton Premium restera actif jusqu&apos;à la fin de la période déjà payée{subInfo?.periodEnd ? ` (le ${formatDate(subInfo.periodEnd)})` : ""}. Aucun nouveau prélèvement ne sera effectué. Tu peux réactiver à tout moment.</p>
            {subError && <p className="scan-hint" role="alert" style={{ color: "var(--accent)" }}>{subError}</p>}
            <div className="legal-confirm-actions">
              <button type="button" className="premium-button retention-keep" onClick={() => setCancelStep(0)} disabled={working}>Garder Premium</button>
              <button type="button" className="legal-delete" onClick={confirmCancel} disabled={working}>{working ? "Résiliation…" : "Résilier"}</button>
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
