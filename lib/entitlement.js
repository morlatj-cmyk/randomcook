import crypto from "crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Source de vérité serveur pour les droits d'accès. Le statut premium et le
// quota de scans ne dépendent JAMAIS de valeurs envoyées par le client.
export const FREE_DAILY_SCANS = 2;

const COOKIE_NAME = "rc_scan_usage";
const COOKIE_MAX_AGE = 60 * 60 * 48; // 48 h, couvre le passage de minuit

export function todayKey() {
  return new Date().toISOString().slice(0, 10); // jour UTC
}

function adminClient() {
  return createAdminClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
}

// Détermine l'utilisateur connecté et son statut premium à partir de la session
// (cookie d'auth Supabase), en lisant sa propre ligne d'abonnement.
export async function resolveUserAndPremium() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, isPremium: false };

  const { data } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  return { user, isPremium: data?.status === "active" };
}

// --- Comptage par utilisateur connecté (table scan_usage) ---

export async function readUserScanCount(userId, day) {
  const { data } = await adminClient()
    .from("scan_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();
  return data?.count || 0;
}

export async function incrementUserScan(userId, day) {
  const { data } = await adminClient().rpc("increment_scan_usage", {
    p_user_id: userId,
    p_day: day,
  });
  return typeof data === "number" ? data : null;
}

// --- Repli cookie signé pour les visiteurs anonymes ---

function signingKey() {
  return process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function sign(value) {
  const sig = crypto.createHmac("sha256", signingKey()).update(value).digest("base64url");
  return `${value}.${sig}`;
}

function unsign(signed) {
  if (!signed || typeof signed !== "string" || !signed.includes(".")) return null;
  const idx = signed.lastIndexOf(".");
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", signingKey()).update(value).digest("base64url");
  // Comparaison à temps constant pour éviter une attaque temporelle.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return value;
}

export async function readAnonScanCount(day) {
  const store = await cookies();
  const value = unsign(store.get(COOKIE_NAME)?.value);
  if (!value) return 0;
  const [cookieDay, rawCount] = value.split(":");
  if (cookieDay !== day) return 0;
  const count = parseInt(rawCount, 10);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

// Renvoie l'objet cookie signé à poser sur la réponse ({ name, value, options }).
export function makeAnonScanCookie(day, count) {
  return {
    name: COOKIE_NAME,
    value: sign(`${day}:${count}`),
    options: {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    },
  };
}
