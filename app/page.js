"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SavingsView from "@/components/savings-view";
import AccountView from "@/components/account-view";

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
      cost_breakdown: {
        servings: 2,
        ingredient_costs: [
          { name: "Riz cuit", cost: 0.5 },
          { name: "Jaunes d'œufs", cost: 0.6 },
          { name: "Parmesan", cost: 1.2 },
          { name: "Huile d'olive", cost: 0.2 },
        ],
        home_cost: 2.5,
        bought_cost: 9,
        bought_reference: "Bol équivalent en traiteur",
        money_saved_estimate: 6.5,
      },
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
      cost_breakdown: {
        servings: 2,
        ingredient_costs: [
          { name: "Riz cuit", cost: 0.5 },
          { name: "Œufs", cost: 0.6 },
          { name: "Parmesan", cost: 1.2 },
          { name: "Huile", cost: 0.2 },
        ],
        home_cost: 2.5,
        bought_cost: 11.5,
        bought_reference: "Plat de riz sauté en livraison",
        money_saved_estimate: 9,
      },
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
      cost_breakdown: {
        servings: 4,
        ingredient_costs: [
          { name: "Riz cuit", cost: 1 },
          { name: "Œufs", cost: 0.9 },
          { name: "Parmesan", cost: 1.8 },
          { name: "Beurre", cost: 0.3 },
        ],
        home_cost: 4,
        bought_cost: 16,
        bought_reference: "Gratin équivalent en barquette",
        money_saved_estimate: 12,
      },
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

function euro(value) {
  return `${Number(value || 0).toFixed(2).replace(".", ",")} €`;
}

export default function Home() {
  const supabaseRef = useRef(null);
  if (supabaseRef.current === null) supabaseRef.current = createClient();

  const [tab, setTab] = useState("home");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [dbSavings, setDbSavings] = useState([]);
  const [guestSavings, setGuestSavings] = useState([]);
  const [savingsLoading, setSavingsLoading] = useState(false);

  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [error, setError] = useState("");
  const [activeTimers, setActiveTimers] = useState({});
  const [premiumOpen, setPremiumOpen] = useState(false);
  const inputRef = useRef(null);
  const audioContextRef = useRef(null);

  const savings = user ? dbSavings : guestSavings;
  const totalSaved = savings.reduce((sum, item) => sum + Number(item.saved || 0), 0);

  const loadSavings = async () => {
    const supabase = supabaseRef.current;
    setSavingsLoading(true);
    try {
      const { data: rows, error: loadError } = await supabase
        .from("savings")
        .select("id,recipe_title,cuisine_style,category,home_cost,bought_cost,saved,created_at")
        .order("created_at", { ascending: false });
      if (loadError) throw loadError;
      setDbSavings(rows || []);
    } catch {
      setDbSavings([]);
    } finally {
      setSavingsLoading(false);
    }
  };

  useEffect(() => {
    const supabase = supabaseRef.current;
    supabase.auth.getUser().then(({ data: userData }) => setUser(userData?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) loadSavings();
    else setDbSavings([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const signInWithGoogle = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const supabase = supabaseRef.current;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) throw oauthError;
    } catch {
      setAuthError("La connexion Google n'est pas disponible pour le moment.");
      setAuthLoading(false);
    }
  };

  const signOut = async () => {
    await supabaseRef.current.auth.signOut();
    setUser(null);
    setDbSavings([]);
  };

  const playChime = () => {
    try {
      if (typeof window === "undefined") return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) audioContextRef.current = new AudioCtx();
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      [880, 1174.66, 1567.98].forEach((frequency, position) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + position * 0.18;
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.42);
      });
    } catch {
      /* audio indisponible : on ignore silencieusement */
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers((previous) => {
        const next = { ...previous };
        let changed = false;
        Object.keys(next).forEach((key) => {
          if (next[key].running && next[key].remaining > 0) {
            next[key] = { ...next[key], remaining: next[key].remaining - 1 };
            changed = true;
            if (next[key].remaining === 0) {
              next[key] = { ...next[key], running: false, done: true };
              playChime();
            }
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
    setTab("home");
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

  const primeAudio = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) audioContextRef.current = new AudioCtx();
      if (audioContextRef.current.state === "suspended") audioContextRef.current.resume();
    } catch {
      /* ignore */
    }
  };

  const startTimer = (index, seconds) => {
    primeAudio();
    setActiveTimers((previous) => ({ ...previous, [index]: { total: seconds, remaining: seconds, running: true, done: false } }));
  };

  const pauseTimer = (index) =>
    setActiveTimers((previous) => ({ ...previous, [index]: { ...previous[index], running: false } }));

  const resumeTimer = (index) => {
    primeAudio();
    setActiveTimers((previous) => ({ ...previous, [index]: { ...previous[index], running: true } }));
  };

  const restartTimer = (index) => {
    primeAudio();
    setActiveTimers((previous) => ({ ...previous, [index]: { ...previous[index], remaining: previous[index].total, running: true, done: false } }));
  };

  const stopTimer = (index) =>
    setActiveTimers((previous) => {
      const next = { ...previous };
      delete next[index];
      return next;
    });

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

  const finishMeal = async () => {
    const recipe = selectedRecipe;
    const cost = recipe?.cost_breakdown || {};
    const entry = {
      recipe_title: recipe?.recipe_title || "Recette",
      cuisine_style: recipe?.cuisine_style || "",
      category: recipe?.category || "normal",
      home_cost: Number(cost.home_cost || 0),
      bought_cost: Number(cost.bought_cost || 0),
      saved: Number(cost.money_saved_estimate || 0),
    };

    if (user) {
      try {
        await supabaseRef.current.from("savings").insert({ user_id: user.id, ...entry });
        await loadSavings();
      } catch {
        /* si l'enregistrement échoue, on ne bloque pas l'utilisateur */
      }
    } else {
      setGuestSavings((previous) => [
        { id: `guest-${Date.now()}`, created_at: new Date().toISOString(), ...entry },
        ...previous,
      ]);
    }

    reset();
    setTab("savings");
  };

  const goToScan = () => {
    reset();
    setTab("home");
    if (equipment.length > 0) requestAnimationFrame(() => inputRef.current?.click());
  };

  const formatTime = (seconds) =>
    `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  const hasEquipment = equipment.length > 0;
  const onHomeTab = tab === "home";
  const showHome = onHomeTab && !data && !loading;
  const showList = onHomeTab && data && !loading && !selectedRecipe;
  const showDetail = onHomeTab && data && !loading && selectedRecipe;
  const showLoading = onHomeTab && loading;

  return (
    <main className="app-shell">
      <header className="app-bar">
        <div className="app-brand">
          <span className="brand-mark" aria-hidden="true">RC</span>
          <div><strong>RandomCook</strong><span>anti-gaspi cuisine</span></div>
        </div>
        <div className="saving-pill"><span>Économies</span><strong>{euro(totalSaved)}</strong></div>
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
            <div><strong>{savings.length}</strong><span>plats cuisinés</span></div>
            <div><strong>3</strong><span>recettes par scan</span></div>
          </div>
        </section>
      )}

      {showLoading && (
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
              const saved = item.cost_breakdown?.money_saved_estimate;
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
                    {saved != null && <span className="recipe-choice-saved">économie {euro(saved)}</span>}
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
          </div>

          {selectedRecipe.cost_breakdown && (
            <div className="cost-block">
              <div className="section-heading"><span>Coût du plat</span><span className="muted-label">POUR {selectedRecipe.cost_breakdown.servings} PORT.</span></div>
              <div className="cost-compare">
                <div className="cost-cell">
                  <small>FAIT MAISON</small>
                  <strong>{euro(selectedRecipe.cost_breakdown.home_cost)}</strong>
                </div>
                <div className="cost-cell">
                  <small>{(selectedRecipe.cost_breakdown.bought_reference || "Acheté").toUpperCase()}</small>
                  <strong className="struck">{euro(selectedRecipe.cost_breakdown.bought_cost)}</strong>
                </div>
                <div className="cost-cell cost-cell-saved">
                  <small>TU ÉCONOMISES</small>
                  <strong>{euro(selectedRecipe.cost_breakdown.money_saved_estimate)}</strong>
                </div>
              </div>
              <details className="cost-detail">
                <summary>Détail des ingrédients</summary>
                <ul>
                  {selectedRecipe.cost_breakdown.ingredient_costs?.map((ingredient) => (
                    <li key={ingredient.name}><span>{ingredient.name}</span><span>{euro(ingredient.cost)}</span></li>
                  ))}
                </ul>
              </details>
            </div>
          )}

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
                        {!timer && (
                          <button className="timer-button" onClick={() => startTimer(index, step.timer_seconds)}>Minuteur {formatTime(step.timer_seconds)}</button>
                        )}
                        {timer && (
                          <div className={`timer-panel${timer.done ? " done" : ""}`}>
                            <span className="timer-value">{timer.done ? "Terminé" : formatTime(timer.remaining)}</span>
                            <div className="timer-controls">
                              {!timer.done && timer.running && (
                                <button className="timer-control" onClick={() => pauseTimer(index)} aria-label="Mettre en pause">Pause</button>
                              )}
                              {!timer.done && !timer.running && (
                                <button className="timer-control" onClick={() => resumeTimer(index)} aria-label="Reprendre">Reprendre</button>
                              )}
                              <button className="timer-control" onClick={() => restartTimer(index)} aria-label="Redémarrer">Recommencer</button>
                              <button className="timer-control ghost" onClick={() => stopTimer(index)} aria-label="Arrêter le minuteur">Arrêter</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <button className="finish-button" onClick={finishMeal}>C&apos;est prêt · +{euro(selectedRecipe.cost_breakdown?.money_saved_estimate)}</button>
        </section>
      )}

      {tab === "savings" && (
        <SavingsView
          savings={savings}
          loading={user ? savingsLoading : false}
          user={user}
          onGoToScan={goToScan}
          onSignIn={() => setTab("account")}
        />
      )}

      {tab === "account" && (
        <AccountView
          user={user}
          authLoading={authLoading}
          totalSaved={totalSaved}
          mealsCount={savings.length}
          onSignIn={signInWithGoogle}
          onSignOut={signOut}
          onUpgrade={() => setPremiumOpen(true)}
          authError={authError}
        />
      )}

      {error && onHomeTab && <p className="notice" role="status">{error}</p>}

      {premiumOpen && (
        <div className="premium-modal" role="dialog" aria-modal="true" aria-labelledby="premium-modal-title" onClick={() => setPremiumOpen(false)}>
          <div className="premium-modal-card" onClick={(event) => event.stopPropagation()}>
            <span className="premium-tag">PREMIUM</span>
            <h2 id="premium-modal-title">Bientôt disponible</h2>
            <p>Le paiement sécurisé arrive très vite. Tu seras parmi les premiers prévenus au lancement de RandomCook Premium.</p>
            <button type="button" className="premium-button" onClick={() => setPremiumOpen(false)}>J&apos;ai hâte</button>
          </div>
        </div>
      )}

      <nav className="bottom-nav" aria-label="Navigation principale">
        <button className={`nav-item${tab === "home" ? " active" : ""}`} onClick={() => setTab("home")}><span aria-hidden="true">⌂</span>Accueil</button>
        <button className={`nav-item${tab === "savings" ? " active" : ""}`} onClick={() => setTab("savings")}><span aria-hidden="true">€</span>Économies</button>
        <button className={`nav-item${tab === "account" ? " active" : ""}`} onClick={() => setTab("account")}><span aria-hidden="true">◔</span>Compte</button>
      </nav>
    </main>
  );
}
