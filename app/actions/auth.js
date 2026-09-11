"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";

// Crée un compte e-mail/mot de passe côté serveur avec l'e-mail déjà confirmé.
// On passe par l'API admin (clé service role) pour NE PAS déclencher l'envoi
// d'un e-mail de confirmation : le fournisseur d'e-mail intégré de Supabase est
// plafonné à quelques envois par heure, ce qui bloquait les inscriptions.
export async function createAccount(email, password) {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !password) return { error: "invalid" };
  if (password.length < 6) return { error: "weak_password" };

  const admin = createAdminClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const { error } = await admin.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
  });

  if (error) {
    const msg = error.message || "";
    if (/already|registered|exist/i.test(msg)) return { error: "exists" };
    if (/password/i.test(msg)) return { error: "weak_password" };
    return { error: "unknown", message: msg };
  }

  return { ok: true };
}
