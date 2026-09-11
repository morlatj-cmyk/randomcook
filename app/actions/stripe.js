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
        price_data: {
          currency: PREMIUM_PRODUCT.currency,
          product_data: {
            name: PREMIUM_PRODUCT.name,
            description: PREMIUM_PRODUCT.description,
          },
          unit_amount: PREMIUM_PRODUCT.priceInCents,
          recurring: { interval: PREMIUM_PRODUCT.interval },
        },
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
