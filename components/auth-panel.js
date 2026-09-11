"use client";

import { useState } from "react";

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.42 2.2-1.12 2.98-.84.94-2.2 1.66-3.34 1.57-.14-1.12.44-2.28 1.1-3 .77-.85 2.15-1.48 3.36-1.55zM20.9 17.1c-.55 1.27-.82 1.83-1.53 2.95-.99 1.57-2.38 3.52-4.1 3.53-1.53.02-1.92-.99-4-.98-2.07.01-2.5.99-4.03.97-1.72-.02-3.04-1.79-4.03-3.35C.3 15.9-.12 11.3 1.87 8.43c.99-1.42 2.55-2.32 4.02-2.32 1.5 0 2.44 1 3.68 1 1.2 0 1.93-1 3.68-1 1.31 0 2.7.71 3.69 1.94-3.25 1.78-2.72 6.4.96 8.05z" />
    </svg>
  );
}

export default function AuthPanel({ onGoogle, onApple, onEmailSignIn, onEmailSignUp, authLoading, authError, onAuthed }) {
  const [mode, setMode] = useState("choice");
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLocalError("");
    setBusy(true);
    try {
      if (signup) {
        const result = await onEmailSignUp(email.trim(), password);
        if (result?.session) onAuthed?.();
        else setCheckEmail(true);
      } else {
        await onEmailSignIn(email.trim(), password);
        onAuthed?.();
      }
    } catch (err) {
      setLocalError(err?.message || "Une erreur est survenue. Réessaie.");
    } finally {
      setBusy(false);
    }
  };

  if (checkEmail) {
    return (
      <div className="auth-panel">
        <div className="auth-check">
          <span className="auth-check-icon" aria-hidden="true">✉</span>
          <h3>Vérifie tes e-mails</h3>
          <p>On vient d&apos;envoyer un lien de confirmation à <strong>{email}</strong>. Clique dessus pour activer ton compte.</p>
        </div>
      </div>
    );
  }

  if (mode === "email") {
    return (
      <form className="auth-panel auth-form" onSubmit={submit}>
        <label className="auth-field">
          <span>E-mail</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com" autoComplete="email" />
        </label>
        <label className="auth-field">
          <span>Mot de passe</span>
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={signup ? "new-password" : "current-password"} />
        </label>
        {localError && <p className="scan-hint" role="alert" style={{ color: "var(--accent)" }}>{localError}</p>}
        <button type="submit" className="auth-submit" disabled={busy}>
          {busy ? "…" : signup ? "Créer mon compte" : "Se connecter"}
        </button>
        <button type="button" className="auth-toggle" onClick={() => { setSignup(!signup); setLocalError(""); }}>
          {signup ? "J'ai déjà un compte — me connecter" : "Pas encore de compte ? En créer un"}
        </button>
        <button type="button" className="auth-back" onClick={() => { setMode("choice"); setLocalError(""); }}>← Autres options</button>
      </form>
    );
  }

  return (
    <div className="auth-panel">
      <button type="button" className="auth-provider auth-google" onClick={onGoogle} disabled={authLoading}>
        <span className="auth-provider-mark" aria-hidden="true">G</span>
        {authLoading ? "Connexion…" : "Continuer avec Google"}
      </button>
      <button type="button" className="auth-provider auth-apple" onClick={onApple} disabled={authLoading}>
        <span className="auth-provider-mark"><AppleMark /></span>
        Continuer avec Apple
      </button>
      <button type="button" className="auth-provider auth-email-btn" onClick={() => setMode("email")}>
        <span className="auth-provider-mark" aria-hidden="true">@</span>
        Continuer avec un e-mail
      </button>
      {authError && <p className="scan-hint" role="alert" style={{ color: "var(--accent)" }}>{authError}</p>}
    </div>
  );
}
