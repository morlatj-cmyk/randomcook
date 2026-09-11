// Source de vérité de l'offre premium. Le prix réel vit dans Stripe : on
// référence son ID (`stripePriceId`), le client ne choisit jamais le montant.
// Les autres champs servent uniquement à l'affichage dans l'UI.
export const PREMIUM_PRODUCT = {
  id: "premium-monthly",
  stripePriceId: "price_1UEdHbAuWoE4KtAbE4umZMGt",
  name: "RandomCook Premium",
  description:
    "Scans illimités, suivi avancé des économies, listes de courses malines et Mode chef.",
  priceInCents: 499,
  currency: "eur",
  interval: "month",
};
