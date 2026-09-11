"use client";

import { useEffect, useRef, useState } from "react";

const fallbackRecipe = {
  detected_ingredients: [
    { name: "Reste de riz cuit", quantity: "1 bol", confidence: "high" },
    { name: "Jaunes d'œufs", quantity: "2 pièces", confidence: "medium", note: "Identification probable" },
    { name: "Parmesan", quantity: "un fond", confidence: "medium", note: "Quantité difficile à estimer" },
  ],
  warnings: ["Cette recette de secours n'a pas été générée à partir de votre photo."],
  recipe_title: "Crispy rice bowl, sauce poivrée",
  subtitle: "Un riz froid saisi puis lié hors du feu pour une texture brillante et croustillante.",
  cook_time_minutes: 11,
  money_saved_estimate: 14.5,
  chef_technique: "Maillard & émulsion résiduelle",
  steps: [
    { step_number: 1, title: "Former la croûte", instruction: "Chauffe une cuillère d'huile dans une poêle. Ajoute le riz froid, aplatis-le et laisse-le saisir sans le remuer pendant 3 minutes.", timer_seconds: 180 },
    { step_number: 2, title: "Préparer le liant", instruction: "Bats les jaunes avec le parmesan finement râpé et beaucoup de poivre noir. Garde le mélange prêt, hors du feu.", timer_seconds: 0 },
    { step_number: 3, title: "Lier hors du feu", instruction: "Ajoute un peu d'eau chaude au riz, puis le mélange œuf-parmesan. Remue vivement jusqu'à obtenir une sauce brillante.", timer_seconds: 45 },
  ],
};

export default function Home() {
  const [totalSaved, setTotalSaved] = useState(42.5);
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState("");
  const [activeTimers, setActiveTimers] = useState({});
  const inputRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers((previous) => {
        const next = { ...previous };
        let changed = false;
        Object.keys(next).forEach((key) => {
          if (next[key].running && next[key].remaining > 0) {
            next[key] = { ...next[key], remaining: next[key].remaining - 1 };
            changed = true;
            if (next[key].remaining === 0) next[key] = { ...next[key], running: false, done: true };
          }
        });
        return changed ? next : previous;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const analyzeImage = async (imageBase64) => {
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64 }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analyse impossible");
      setRecipe(data);
    } catch {
      setError("L'analyse n'a pas abouti. Une idée de secours est prête à cuisiner.");
      setRecipe(fallbackRecipe);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 1000 / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        analyzeImage(canvas.toDataURL("image/jpeg", 0.76).split(",")[1]);
      };
      image.src = loadEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  const startTimer = (index, seconds) => setActiveTimers((previous) => ({ ...previous, [index]: { remaining: seconds, running: true, done: false } }));
  const reset = () => { setRecipe(null); setError(""); setActiveTimers({}); if (inputRef.current) inputRef.current.value = ""; };
  const finishMeal = () => { setTotalSaved((previous) => previous + (recipe?.money_saved_estimate || 14.5)); reset(); };
  const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return (
    <main className="app-shell">
      <header className="app-bar">
        <div className="app-brand"><span className="brand-mark" aria-hidden="true">RC</span><div><strong>RandomCook</strong><span>anti-gaspi cuisine</span></div></div>
        <div className="saving-pill"><span>Économies</span><strong>{totalSaved.toFixed(2).replace(".", ",")} €</strong></div>
      </header>

      {!recipe && !loading && (
        <section className="home-screen" aria-labelledby="home-title">
          <div className="welcome"><span className="section-kicker">BONJOUR</span><h1 id="home-title">Qu&apos;est-ce qu&apos;on<br />cuisine aujourd&apos;hui&nbsp;?</h1><p>Prends ton frigo en photo. On s&apos;occupe du reste.</p></div>
          <label className="scan-card"><span className="scan-icon" aria-hidden="true">+</span><span className="scan-card-copy"><strong>Scanner mes ingrédients</strong><small>Photo ou galerie</small></span><span className="chevron" aria-hidden="true">›</span><input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} /></label>
          <div className="quick-section"><div className="section-heading"><span>Raccourcis</span><span className="muted-label">POUR BIEN DÉMARRER</span></div><div className="tip-card"><span className="tip-icon" aria-hidden="true">i</span><div><strong>Une photo suffit</strong><p>Cadre tous tes ingrédients ensemble, même ceux qui commencent à fatiguer.</p></div></div></div>
          <div className="stats-row"><div><strong>{totalSaved.toFixed(0)} €</strong><span>économisés</span></div><div><strong>0</strong><span>ingrédients jetés</span></div><div><strong>11 min</strong><span>recette moyenne</span></div></div>
        </section>
      )}

      {loading && <section className="loading-screen"><div className="loading-orbit" aria-hidden="true"><span /></div><span className="section-kicker">ANALYSE EN COURS</span><h1>On regarde<br />ce qu&apos;il y a de bon.</h1><p>Lecture des ingrédients et recherche de la meilleure association.</p></section>}

      {recipe && !loading && <section className="recipe-screen" aria-labelledby="recipe-title"><button className="back-button" onClick={reset} aria-label="Retour à l'accueil">‹ <span>Scanner à nouveau</span></button><div className="recipe-title-row"><div><span className="section-kicker">TA RECETTE</span><h1 id="recipe-title">{recipe.recipe_title}</h1><p>{recipe.subtitle}</p></div><div className="time-pill"><strong>{recipe.cook_time_minutes}</strong><span>MIN</span></div></div><div className="recipe-stats"><span><small>TECHNIQUE</small><strong>{recipe.chef_technique}</strong></span><span><small>ÉCONOMIE</small><strong className="success">+ {Number(recipe.money_saved_estimate).toFixed(2).replace(".", ",")} €</strong></span></div><div className="ingredient-block"><div className="section-heading"><span>Ingrédients détectés</span><span className="muted-label">{recipe.detected_ingredients.length} ÉLÉMENTS</span></div><div className="ingredient-list">{recipe.detected_ingredients.map((ingredient) => <div className="ingredient-item" key={ingredient.name}><span><strong>{ingredient.name}</strong><small>{ingredient.quantity}{ingredient.note ? ` · ${ingredient.note}` : ""}</small></span><em className={`confidence ${ingredient.confidence}`}>{ingredient.confidence === "high" ? "Sûr" : ingredient.confidence === "medium" ? "Probable" : "À vérifier"}</em></div>)}</div>{recipe.warnings?.length > 0 && <div className="analysis-notice" role="status"><strong>À vérifier</strong>{recipe.warnings.map((warning) => <span key={warning}>{warning}</span>)}</div>}</div><div className="steps"><div className="section-heading"><span>Préparation</span><span className="muted-label">{recipe.steps.length} ÉTAPES</span></div>{recipe.steps.map((step, index) => { const timer = activeTimers[index]; return <article className="step" key={step.step_number}><span className="step-number">{String(step.step_number).padStart(2, "0")}</span><div className="step-content"><h2>{step.title}</h2><p>{step.instruction}</p>{step.timer_seconds > 0 && <div className="timer-row">{timer?.running ? <span className="timer active">{formatTime(timer.remaining)}</span> : timer?.done ? <span className="timer done">Prêt à servir</span> : <button className="timer-button" onClick={() => startTimer(index, step.timer_seconds)}>Lancer · {Math.ceil(step.timer_seconds / 60)} min</button>}</div>}</div></article>; })}</div><button className="finish-button" onClick={finishMeal}>Terminer la recette <span>→</span></button></section>}

      {error && <p className="notice" role="status">{error}</p>}
      <nav className="bottom-nav" aria-label="Navigation principale"><button className="nav-item active"><span aria-hidden="true">⌂</span>Accueil</button><button className="nav-item" onClick={() => recipe ? reset() : inputRef.current?.click()}><span aria-hidden="true">+</span>Scanner</button><button className="nav-item"><span aria-hidden="true">€</span>Économies</button></nav>
    </main>
  );
}
