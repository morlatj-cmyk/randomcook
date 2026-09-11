"use client";

const CATEGORY_LABEL = { express: "Express", normal: "Équilibrée", long: "Gourmande" };

function euro(value) {
  return `${Number(value || 0).toFixed(2).replace(".", ",")} €`;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export default function SavingsView({ savings, loading, user, onGoToScan, onSignIn }) {
  const total = savings.reduce((sum, item) => sum + Number(item.saved || 0), 0);
  const meals = savings.length;
  const average = meals > 0 ? total / meals : 0;

  return (
    <section className="savings-screen" aria-labelledby="savings-title">
      <div className="welcome">
        <span className="section-kicker">TON SUIVI</span>
        <h1 id="savings-title">Tes économies</h1>
        <p>Chaque plat cuisiné est comparé à son équivalent acheté ou livré.</p>
      </div>

      <div className="savings-hero">
        <span className="savings-hero-label">TOTAL ÉCONOMISÉ</span>
        <strong className="savings-hero-value">{euro(total)}</strong>
        <div className="savings-hero-grid">
          <div><strong>{meals}</strong><span>plats cuisinés</span></div>
          <div><strong>{euro(average)}</strong><span>par plat</span></div>
        </div>
      </div>

      {!user && (
        <button type="button" className="savings-signin-note" onClick={onSignIn}>
          <span><strong>Connecte-toi pour synchroniser</strong><small>Tes économies sont pour l&apos;instant gardées sur cet appareil.</small></span>
          <span className="chevron" aria-hidden="true">›</span>
        </button>
      )}

      <div className="section-heading" style={{ marginTop: 28 }}>
        <span>Historique</span><span className="muted-label">{meals} PLATS</span>
      </div>

      {loading ? (
        <p className="scan-hint" role="status">Chargement de tes économies…</p>
      ) : meals === 0 ? (
        <div className="savings-empty">
          <p>Aucun plat cuisiné pour l&apos;instant. Scanne tes ingrédients pour lancer ta première recette.</p>
          <button type="button" className="finish-button" onClick={onGoToScan}>Scanner mes ingrédients</button>
        </div>
      ) : (
        <div className="savings-list">
          {savings.map((item) => (
            <article className="savings-item" key={item.id}>
              <div className="savings-item-head">
                <strong>{item.recipe_title}</strong>
                <span className="savings-item-saved">+ {euro(item.saved)}</span>
              </div>
              <div className="savings-item-meta">
                <span>{CATEGORY_LABEL[item.category] || "Recette"}{item.cuisine_style ? ` · ${item.cuisine_style}` : ""}</span>
                <span>{formatDate(item.created_at)}</span>
              </div>
              <div className="savings-item-compare">
                <span>Maison <strong>{euro(item.home_cost)}</strong></span>
                <span className="arrow" aria-hidden="true">vs</span>
                <span>Acheté <strong>{euro(item.bought_cost)}</strong></span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
