"use client";

import { useState } from "react";

export default function AuthPanel({ onEmailSignIn, onEmailSignUp, onAuthed }) {
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
    </form>
  );
}
