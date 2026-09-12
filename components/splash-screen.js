"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/logo";

export default function SplashScreen({ onFinish }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const holdMs = reduce ? 500 : 1650;
    const exitMs = reduce ? 200 : 620;

    const leaveTimer = setTimeout(() => setLeaving(true), holdMs);
    const doneTimer = setTimeout(() => onFinish?.(), holdMs + exitMs);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div className={`splash${leaving ? " splash-leaving" : ""}`} role="status" aria-label="Ouverture de RandomCook">
      <div className="splash-inner">
        <span className="splash-mark" aria-hidden="true">
          <Logo size={52} className="splash-mark-logo" />
        </span>
        <span className="splash-wordmark">RandomCook</span>
        <span className="splash-tagline">anti-gaspi cuisine</span>
      </div>
      <span className="splash-progress" aria-hidden="true">
        <span />
      </span>
    </div>
  );
}
