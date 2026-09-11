// Source de vérité de l'offre premium. Le prix est validé côté serveur : le
// client ne choisit jamais le montant, il déclenche seulement l'abonnement.
export const PREMIUM_PRODUCT = {
  id: "premium-monthly",
  name: "RandomCook Premium",
  description:
    "Scans illimités, suivi avancé des économies, listes de courses malines et Mode chef.",
  priceInCents: 499,
  currency: "eur",
  interval: "month",
};
