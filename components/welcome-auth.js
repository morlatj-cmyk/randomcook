"use client";

import Logo from "@/components/logo";
import AuthPanel from "@/components/auth-panel";

export default function WelcomeAuth({ onSkip, onEmailSignIn, onEmailSignUp }) {
  return (
    <div className="welcome-overlay">
      <div className="welcome-content">
        <span className="welcome-mark" aria-hidden="true"><Logo size={44} /></span>
        <h1>Bienvenue sur RandomCook</h1>
        <p>Connecte-toi pour sauvegarder tes économies anti-gaspi et les retrouver sur tous tes appareils.</p>
        <AuthPanel
          onEmailSignIn={onEmailSignIn}
          onEmailSignUp={onEmailSignUp}
          onAuthed={onSkip}
        />
        <button type="button" className="welcome-skip" onClick={onSkip}>Plus tard</button>
      </div>
    </div>
  );
}
