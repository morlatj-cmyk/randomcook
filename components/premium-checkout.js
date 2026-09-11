"use client";

import { useCallback, useRef, useState } from "react";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { startPremiumCheckout, confirmPremiumCheckout } from "@/app/actions/stripe";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function PremiumCheckout({ onSuccess }) {
  const sessionIdRef = useRef(null);
  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchClientSecret = useCallback(async () => {
    const { clientSecret, sessionId } = await startPremiumCheckout();
    sessionIdRef.current = sessionId;
    return clientSecret;
  }, []);

  const handleComplete = useCallback(async () => {
    setConfirming(true);
    setErrorMsg("");
    try {
      const ok = await confirmPremiumCheckout(sessionIdRef.current);
      if (ok) onSuccess?.();
      else setErrorMsg("Le paiement n'a pas pu être confirmé. Contacte-nous si tu as été débité.");
    } catch {
      setErrorMsg("Une erreur est survenue lors de la confirmation.");
    } finally {
      setConfirming(false);
    }
  }, [onSuccess]);

  return (
    <div className="premium-checkout">
      {errorMsg && <p className="premium-checkout-error" role="alert">{errorMsg}</p>}
      {confirming && <p className="premium-checkout-status" role="status">Confirmation du paiement…</p>}
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ clientSecret: fetchClientSecret, onComplete: handleComplete }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
