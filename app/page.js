"use client";

import { useEffect, useRef, useState } from "react";

const EQUIPMENT = [
  { id: "Poêle", label: "Poêle", icon: "◗" },
  { id: "Casserole", label: "Casserole", icon: "◑" },
  { id: "Marmite", label: "Marmite", icon: "◍" },
  { id: "Four", label: "Four", icon: "▤" },
  { id: "Rien du tout", label: "Rien du tout", icon: "○" },
];

const CATEGORY_META = {
  express: { label: "Express", hint: "10 min ou moins" },
  normal: { label: "Équilibrée", hint: "environ 20 min" },
  long: { label: "Gourmande", hint: "plus longue" },
};

const fallbackData = {
  detected_ingredients: [
    { name: "Reste de riz cuit", quantity: "1 bol", confidence: "high", note: "" },
    { name: "Jaunes d'œufs", quantity: "2 pièces", confidence: "medium", note: "Identification probable" },
    { name: "Parmesan", quantity: "un fond", confidence: "medium", note: "Quantité difficile à estimer" },
  ],
  warnings: ["Ces recettes de secours n'ont pas été générées à partir de votre photo."],
  recipes: [
    {
      category: "express",
      cuisine_style: "Comfort food",
      recipe_title: "Bol de riz express au parmesan",
      subtitle: "Un riz froid réveillé en quelques minutes, lié hors du feu.",
      cook_time_minutes: 8,
      money_saved_estimate: 6.5,
      chef_technique: "Émulsion résiduelle",
      required_equipment: ["Poêle"],
      steps: [
        { step_number: 1, title: "Saisir le riz", instruction: "Chauffe un filet d'huile, ajoute le riz froid et laisse-le tiédir 2 minutes.", is_cooking_time: true, timer_seconds: 120 },
        { step_number: 2, title: "Lier hors du feu", instruction: "Hors du feu, ajoute les jaunes et le parmesan, remue vivement jusqu'à une sauce brillante.", is_cooking_time: false, timer_seconds: 0 },
      ],
    },
    {
      category: "normal",
      cuisine_style: "Poêlée asiatique",
      recipe_title: "Riz sauté croustillant, œuf coulant",
      subtitle: "Un riz doré à la poêle avec un œuf poêlé et beaucoup de poivre.",
      cook_time_minutes: 20,
      money_saved_estimate: 9,
      chef_technique: "Réaction de Maillard",
      required_equipment: ["Poêle"],
      steps: [
        { step_number: 1, title: "Croûte de riz", instruction: "Étale le riz dans une poêle chaude et laisse une croûte se former sans remuer, 4 minutes.", is_cooking_time: true, timer_seconds: 240 },
        { step_number: 2, title: "Assaisonner", instruction: "Ajoute le parmesan, mélange puis réserve au chaud.", is_cooking_time: false, timer_seconds: 0 },
        { step_number: 3, title: "Œuf poêlé", instruction: "Cuis un œuf au plat et pose-le sur le riz. Poivre généreusement.", is_cooking_time: true, timer_seconds: 180 },
      ],
    },
    {
      category: "long",
      cuisine_style: "Gratin de bistro",
      recipe_title: "Gratin de riz doré au four",
      subtitle: "Un riz gratiné lentement pour une surface croustillante et un cœur fondant.",
      cook_time_minutes: 35,
      money_saved_estimate: 12,
      chef_technique: "Gratinage",
      required_equipment: ["Four"],
      steps: [
        { step_number: 1, title: "Préchauffer", instruction: "Préchauffe le four à 200°C.", is_cooking_time: false, timer_seconds: 0 },
        { step_number: 2, title: "Monter le plat", instruction: "Mélange le riz, les jaunes et le parmesan, verse dans un plat et lisse la surface.", is_cooking_time: false, timer_seconds: 0 },
        { step_number: 3, title: "Gratiner", instruction: "Enfourne 25 minutes jusqu'à une belle croûte dorée.", is_cooking_time: true, timer_seconds: 1500 },
      ],
    },
  ],
};

export default function Home() {
  const [totalSaved, setTotalSaved] = useState(42.5);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
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

  const toggleEquipment = (id) => {
    setEquipment((previous) => {
      if (id === "Rien du tout") return previous.includes(id) ? [] : ["Rien du tout"];
      const withoutNone = previous.filter((item) => item !== "Rien du tout");
      return withoutNone.includes(id) ? withoutNone.filter((item) => item !== id) : [...withoutNone, id];
    });
  };

  const analyzeImage = async (imageBase64) => {
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, equipment }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Analyse impossible");
      setData(payload);
    } catch {
      setError("L'analyse n'a pas abouti. Des idées de secours sont prêtes à cuisiner.");
      setData(fallbackData);
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
      const dataUrl = loadEvent.target.result;
      const rawBase64 = typeof dataUrl === "string" ? dataUrl.split(",")[1] : "";
      const image = new Image();
      image.onload = () => {
        try {
          const scale = Math.min(1, 1000 / image.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          analyzeImage(canvas.toDataURL("image/jpeg", 0.76).split(",")[1]);
        } catch {
          analyzeImage(rawBase64);
        }
      };
      image.onerror = () => analyzeImage(rawBase64);
      image.src = dataUrl;
    };
    reader.onerror = () => {
      setLoading(false);
      setError("Impossible de lire cette image. Essaie une autre photo.");
    };
    reader.readAsDataURL(file);
  };

  const startTimer = (index, seconds) =>
    setActiveTimers((previous) => ({ ...previous, [index]: { remaining: seconds, running: true, done: false } }));

  const reset = () => {
    setData(null);
    setSelectedRecipe(null);
    setError("");
    setActiveTimers({});
    if (inputRef.current) inputRef.current.value = "";
  };

  const backToList = () => {
    setSelectedRecipe(null);
    setActiveTimers({});
  };

  const finishMeal = () => {
    setTotalSaved((previous) => previous + (selectedRecipe?.money_saved_estimate || 0));
    reset();
  };

  const formatTime = (seconds) =>
    `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  const hasEquipment = equipment.length > 0;
  const showHome = !data && !loading;
  const showList = data && !loading && !selectedRecipe;
  const showDetail = data && !loading && selectedRecipe;

  return (
    <main className="app-shell">
      <header className="app-bar">
        <div className="app-brand">
          <span className="brand-mark" aria-hidden="true">RC</span>
          <div><strong>RandomCook</strong><span>anti-gaspi cuisine</span></div>
        </div>
        <div className="saving-pill"><span>Économies</span><strong>{totalSaved.toFixed(2).replace(".", ",")} €</strong></div>
      </header>

      {showHome && (
        <section className="home-screen" aria-labelledby="home-title">
          <div className="welcome">
            <span className="section-kicker">BONJOUR</span>
            <h1 id="home-title">Qu&apos;est-ce qu&apos;on<br />cuisine aujourd&apos;hui&nbsp;?</h1>
            <p>Prends ton frigo en photo. On te propose plusieurs recettes.</p>
          </div>

          <div className="equipment-section">
            <div className="section-heading"><span>Ton matériel</span><span className="muted-label">POUR ADAPTER LES RECETTES</span></div>
            <div className="equipment-grid" role="group" aria-label="Matériel de cuisine disponible">
              {EQUIPMENT.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`equipment-chip${equipment.includes(item.id) ? " selected" : ""}`}
                  aria-pressed={equipment.includes(item.id)}
                  onClick={() => toggleEquipment(item.id)}
                >
                  <span aria-hidden="true">{item.icon}</span>{item.label}
                </button>
              ))}
            </div>
          </div>

          <label className={`scan-card${hasEquipment ? "" : " locked"}`} aria-disabled={!hasEquipment}>
            <span className="scan-icon" aria-hidden="true">+</span>
            <span className="scan-card-copy">
              <strong>Scanner mes ingrédients</strong>
              <small>{hasEquipment ? "Photo ou galerie" : "Sélectionne d'abord ton matériel"}</small>
            </span>
            <span className="chevron" aria-hidden="true">›</span>
            <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} disabled={!hasEquipment} />
          </label>
          {!hasEquipment && (
            <p className="scan-hint" role="status">Choisis au moins un équipement ci-dessus pour débloquer le scan.</p>
          )}

          <div className="stats-row">
            <div><strong>{totalSaved.toFixed(0)} €</strong><span>économisés</span></div>
            <div><strong>3</strong><span>recettes par scan</span></div>
            <div><strong>0</strong><span>ingrédients jetés</span></div>
          </div>
        </section>
      )}

      {loading && (
        <section className="loading-screen">
          <div className="loading-orbit" aria-hidden="true"><span /></div>
          <span className="section-kicker">ANALYSE EN COURS</span>
          <h1>On regarde<br />ce qu&apos;il y a de bon.</h1>
          <p>Lecture des ingrédients et création de plusieurs recettes adaptées à ton matériel.</p>
        </section>
      )}

      {showList && (
        <section className="list-screen" aria-labelledby="list-title">
          <button className="back-button" onClick={reset} aria-label="Retour à l'accueil">‹ <span>Scanner à nouveau</span></button>
          <div className="welcome">
            <span className="section-kicker">TON SCAN</span>
            <h1 id="list-title">Choisis ta recette</h1>
            <p>Trois idées à partir de tes ingrédients{equipment.length > 0 ? ` et de ton matériel` : ""}.</p>
          </div>

          <div className="ingredient-block">
            <div className="section-heading"><span>Ingrédients détectés</span><span className="muted-label">{data.detected_ingredients.length} ÉLÉMENTS</span></div>
            <div className="ingredient-list">
              {data.detected_ingredients.map((ingredient) => (
                <div className="ingredient-item" key={ingredient.name}>
                  <span><strong>{ingredient.name}</strong><small>{ingredient.quantity}{ingredient.note ? ` · ${ingredient.note}` : ""}</small></span>
                  <em className={`confidence ${ingredient.confidence}`}>{ingredient.confidence === "high" ? "Sûr" : ingredient.confidence === "medium" ? "Probable" : "À vérifier"}</em>
                </div>
              ))}
            </div>
            {data.warnings?.length > 0 && (
              <div className="analysis-notice" role="status">
                <strong>À vérifier</strong>
                {data.warnings.map((warning) => <span key={warning}>{warning}</span>)}
              </div>
            )}
          </div>

          <div className="recipe-choice">
            <div className="section-heading"><span>Recettes proposées</span><span className="muted-label">{data.recipes.length} IDÉES</span></div>
            {data.recipes.map((item) => {
              const meta = CATEGORY_META[item.category] || { label: "Recette", hint: "" };
              return (
                <button key={`${item.category}-${item.recipe_title}`} className="recipe-choice-card" onClick={() => setSelectedRecipe(item)}>
                  <div className="recipe-choice-head">
                    <span className={`category-tag ${item.category}`}>{meta.label}</span>
                    <span className="recipe-choice-time"><strong>{item.cook_time_minutes}</strong> min</span>
                  </div>
                  {item.cuisine_style && <span className="recipe-choice-style">{item.cuisine_style}</span>}
                  <strong className="recipe-choice-title">{item.recipe_title}</strong>
                  <p>{item.subtitle}</p>
                  <div className="recipe-choice-foot">
                    <span>{item.required_equipment?.length > 0 ? item.required_equipment.join(" · ") : "Sans cuisson"}</span>
                    <span className="chevron" aria-hidden="true">›</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {showDetail && (
        <section className="recipe-screen" aria-labelledby="recipe-title">
          <button className="back-button" onClick={backToList} aria-label="Retour aux recettes">‹ <span>Autres recettes</span></button>
          <div className="recipe-title-row">
            <div>
              <span className="section-kicker">{(CATEGORY_META[selectedRecipe.category] || {}).label?.toUpperCase() || "TA RECETTE"}{selectedRecipe.cuisine_style ? ` · ${selectedRecipe.cuisine_style}` : ""}</span>
              <h1 id="recipe-title">{selectedRecipe.recipe_title}</h1>
              <p>{selectedRecipe.subtitle}</p>
            </div>
            <div className="time-pill"><strong>{selectedRecipe.cook_time_minutes}</strong><span>MIN</span></div>
          </div>

          <div className="recipe-stats">
            <span><small>TECHNIQUE</small><strong>{selectedRecipe.chef_technique}</strong></span>
            <span><small>MATÉRIEL</small><strong>{selectedRecipe.required_equipment?.length > 0 ? selectedRecipe.required_equipment.join(", ") : "Aucun"}</strong></span>
            <span><small>ÉCONOMIE</small><strong className="success">+ {Number(selectedRecipe.money_saved_estimate).toFixed(2).replace(".", ",")} €</strong></span>
          </div>

          <div className="steps">
            <div className="section-heading"><span>Préparation</span><span className="muted-label">{selectedRecipe.steps.length} ÉTAPES</span></div>
            {selectedRecipe.steps.map((step, index) => {
              const timer = activeTimers[index];
              return (
                <article className="step" key={step.step_number}>
                  <span className="step-number">{String(step.step_number).padStart(2, "0")}</span>
                  <div className="step-content">
                    <h2>{step.title}</h2>
                    <p>{step.instruction}</p>
                    {step.is_cooking_time && step.timer_seconds > 0 && (
                      <div className="timer-row">
                        {!timer && <button className="timer-button" onClick={() => startTimer(index, step.timer_seconds)}>Minuteur {formatTime(step.timer_seconds)}</button>}
                        {timer && <span className={`timer${timer.done ? " done" : ""}`}>{timer.done ? "Terminé" : formatTime(timer.remaining)}</span>}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <button className="finish-button" onClick={finishMeal}>C&apos;est prêt · +{Number(selectedRecipe.money_saved_estimate).toFixed(2).replace(".", ",")} €</button>
        </section>
      )}

      {error && <p className="notice" role="status">{error}</p>}

      <nav className="bottom-nav" aria-label="Navigation principale">
        <button className="nav-item active"><span aria-hidden="true">⌂</span>Accueil</button>
        <button className="nav-item" disabled={!data && !hasEquipment} onClick={() => (data ? reset() : hasEquipment && inputRef.current?.click())}><span aria-hidden="true">+</span>Scanner</button>
        <button className="nav-item"><span aria-hidden="true">€</span>Économies</button>
      </nav>
    </main>
  );
}
