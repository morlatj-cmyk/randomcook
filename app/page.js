"use client";

import { useEffect, useRef, useState } from "react";

const fallbackRecipe = {
  detected_ingredients: ["Reste de riz cuit", "2 jaunes d'œufs", "Fond de parmesan"],
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
      <header className="topbar">
        <div className="brand"><span className="brand-mark" aria-hidden="true">RC</span><div><p className="eyebrow">Carnet de cuisine anti-gaspi</p><h1>Random<span>Cook</span></h1></div></div>
        <div className="savings"><span>Économies cumulées</span><strong>{totalSaved.toFixed(2).replace(".", ",")} €</strong></div>
      </header>

      <section className="intro"><p className="eyebrow accent">Du frigo à l'assiette</p><h2>Les bons restes<br /><em>méritent mieux.</em></h2><p className="intro-copy">Photographie tes ingrédients. RandomCook compose une recette précise, rapide et inspirée des gestes de la cuisine de chef.</p></section>

      {!recipe && !loading && <section className="scan-panel"><div className="scan-visual"><span className="scan-line" /><span className="camera-glyph" aria-hidden="true">+</span></div><div className="scan-content"><p className="eyebrow">01 / Observer</p><h3>Qu'y a-t-il dans ton frigo ?</h3><p>Une photo suffit. Nous repérons les ingrédients et imaginons la meilleure façon de les révéler.</p><label className="primary-button">Photographier mes ingrédients<input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} /></label><span className="fine-print">JPG ou PNG · image compressée automatiquement</span></div></section>}

      {loading && <section className="loading-panel"><div className="loader" /><div><p className="eyebrow accent">02 / Composer</p><h3>On cherche le bon geste…</h3><p>Lecture des textures, associations et temps de cuisson.</p></div></section>}

      {recipe && !loading && <section className="recipe-card"><div className="recipe-header"><div><p className="eyebrow accent">03 / Cuisiner</p><h2>{recipe.recipe_title}</h2><p className="recipe-subtitle">{recipe.subtitle}</p></div><div className="time-badge"><strong>{recipe.cook_time_minutes}</strong><span>MIN</span></div></div><div className="recipe-meta"><span>Technique</span><strong>{recipe.chef_technique}</strong><span className="meta-separator" /><span>Économie</span><strong className="green">+ {Number(recipe.money_saved_estimate).toFixed(2).replace(".", ",")} €</strong></div><div className="ingredients"><p className="eyebrow">Dans le panier</p><div className="ingredient-list">{recipe.detected_ingredients.map((ingredient) => <span key={ingredient}>{ingredient}</span>)}</div></div><div className="steps"><p className="eyebrow">Le déroulé</p>{recipe.steps.map((step, index) => { const timer = activeTimers[index]; return <article className="step" key={step.step_number}><div className="step-number">{String(step.step_number).padStart(2, "0")}</div><div className="step-body"><h3>{step.title}</h3><p>{step.instruction}</p>{step.timer_seconds > 0 && <div className="timer-row">{timer?.running ? <span className="timer active">{formatTime(timer.remaining)}</span> : timer?.done ? <span className="timer done">Prêt à servir</span> : <button className="timer-button" onClick={() => startTimer(index, step.timer_seconds)}>Lancer · {Math.ceil(step.timer_seconds / 60)} min</button>}</div>}</div></article> })}</div><div className="recipe-actions"><button className="primary-button" onClick={finishMeal}>Terminer et enregistrer l'économie</button><button className="text-button" onClick={reset}>Recommencer avec un autre frigo</button></div></section>}

      {error && <p className="notice" role="status">{error}</p>}
      <footer><span>Une cuisine plus attentive</span><span>·</span><span>Moins de gaspillage, plus de goût</span></footer>
    </main>
  );
}
