"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";

import { stripe } from "@/lib/stripe";
import { PREMIUM_PRODUCT } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";

// Crée une session Checkout intégrée pour l'abonnement premium, rattachée à
// l'utilisateur connecté. Renvoie le client_secret (pour l'iframe Stripe) et
// l'id de session (pour la confirmation serveur après paiement).
export async function startPremiumCheckout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Connexion requise pour vous abonner.");

  const session = await stripe.checkout.sessions.create({
    // `embedded_page` remplace `embedded` depuis l'API 2026-03-25.dahlia (stripe v21+).
    ui_mode: "embedded_page",
    redirect_on_completion: "never",
    mode: "subscription",
    customer_email: user.email ?? undefined,
    client_reference_id: user.id,
    metadata: { user_id: user.id },
    subscription_data: { metadata: { user_id: user.id } },
    line_items: [
      {
        price: PREMIUM_PRODUCT.stripePriceId,
        quantity: 1,
      },
    ],
  });

  return { clientSecret: session.client_secret, sessionId: session.id };
}

// Vérifie côté serveur que la session appartient bien à l'utilisateur et
// qu'elle est réglée, puis active l'abonnement dans la base (clé service role,
// donc jamais falsifiable depuis le navigateur).
export async function confirmPremiumCheckout(sessionId) {
  if (!sessionId) return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.client_reference_id !== user.id) return false;
  if (session.status !== "complete") return false;

  const admin = createAdminClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const { error } = await admin.from("subscriptions").upsert({
    user_id: user.id,
    status: "active",
    stripe_customer_id:
      typeof session.customer === "string" ? session.customer : null,
    stripe_subscription_id:
      typeof session.subscription === "string" ? session.subscription : null,
    updated_at: new Date().toISOString(),
  });

  return !error;
}

// Récupère l'abonnement Stripe rattaché à l'utilisateur connecté (id lu depuis
// sa propre ligne, jamais depuis une entrée utilisateur). Renvoie le statut, la
// date de fin de période courante et l'indicateur de résiliation programmée.
async function requireUserSubscriptionId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Connexion requise.");

  const admin = createAdminClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
  const { data } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return { userId: user.id, subscriptionId: data?.stripe_subscription_id || null, admin };
}

function subscriptionSummary(subscription) {
  // En API dahlia, current_period_end vit au niveau des items d'abonnement.
  const item = subscription.items?.data?.[0];
  const periodEndSec = item?.current_period_end || subscription.cancel_at || null;
  return {
    active: subscription.status === "active" || subscription.status === "trialing",
    status: subscription.status,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    periodEnd: periodEndSec ? periodEndSec * 1000 : null,
  };
}

export async function getSubscriptionInfo() {
  const { subscriptionId } = await requireUserSubscriptionId();
  if (!subscriptionId) return { active: false, status: "none", cancelAtPeriodEnd: false, periodEnd: null };

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscriptionSummary(subscription);
}

// Résiliation « douce » : l'abonnement s'arrête à la fin de la période déjà
// payée (l'utilisateur garde Premium jusque-là), il ne sera plus débité ensuite.
export async function cancelPremiumSubscription() {
  const { subscriptionId } = await requireUserSubscriptionId();
  if (!subscriptionId) throw new Error("Aucun abonnement actif à résilier.");

  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
  return subscriptionSummary(subscription);
}

// Annule une résiliation programmée : l'abonnement reprend son cours normal.
export async function resumePremiumSubscription() {
  const { subscriptionId } = await requireUserSubscriptionId();
  if (!subscriptionId) throw new Error("Aucun abonnement à réactiver.");

  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
  return subscriptionSummary(subscription);
}
