"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [totalSaved, setTotalSaved] = useState(42.50);
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [activeTimers, setActiveTimers] = useState({});

  // Déclencheur et compression de la photo
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const base64Clean = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
        sendToAnalyze(base64Clean);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const sendToAnalyze = async (base64) => {
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setRecipe(data);
    } catch (err) {
      alert("Erreur lors de l'analyse. Démo de secours activée.");
    } finally {
      setLoading(false);
    }
  };

  // Minuteurs
  const startTimer = (stepIndex, durationSeconds) => {
    if (activeTimers[stepIndex]?.running) return;

    playChime(440);
    setActiveTimers((prev) => ({
      ...prev,
      [stepIndex]: { remaining: durationSeconds, running: true, done: false },
    }));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers((prev) => {
        const updated = { ...prev };
        let changed = false;

        Object.keys(updated).forEach((idx) => {
          if (updated[idx].running && updated[idx].remaining > 0) {
            updated[idx].remaining -= 1;
            changed = true;
            if (updated[idx].remaining === 0) {
              updated[idx].running = false;
              updated[idx].done = true;
              playChime(650);
            }
          }
        });

        return changed ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const playChime = (freq) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {}
  };

  const finishMeal = () => {
    const saved = recipe?.money_saved_estimate || 14.50;
    setTotalSaved((prev) => prev + saved);
    alert(`Bravo ! ${saved.toFixed(2)} € économisés vs Deliveroo.`);
    setRecipe(null);
    setActiveTimers({});
  };

  return (
    <main className="flex justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        
        {/* Header & Économies */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">👨‍🍳</span>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">
                Random<span className="text-amber-400">Cook</span>
              </h1>
              <p className="text-[10px] text-slate-400">Haute cuisine & Anti-Gaspillage</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Économisé</span>
            <div className="text-base font-black text-emerald-400">
              {totalSaved.toFixed(2).replace(".", ",")} €
            </div>
          </div>
        </div>

        {/* Écran 1 : Scan Photo */}
        {!recipe && !loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-3xl flex items-center justify-center mx-auto text-3xl">
              📸
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Scanne ton frigo</h2>
              <p className="text-xs text-slate-400">
                Prends une photo de ton frigo ou de tes restes sur le plan de travail.
              </p>
            </div>

            <label className="block w-full cursor-pointer">
              <span className="block w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black py-4 px-4 rounded-2xl transition shadow-xl text-sm">
                Ouvrir l'appareil photo
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>
          </div>
        )}

        {/* Écran de Chargement */}
        {loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <div className="animate-spin w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full mx-auto"></div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Analyse visuelle des textures & aliments...</h3>
              <p className="text-xs text-slate-400">Calcul des réactions thermiques et techniques de chef</p>
            </div>
          </div>
        )}

        {/* Écran 2 : Fiche Recette */}
        {recipe && !loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-5">
            <div className="border-b border-slate-800 pb-4">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
                  ⚡ {recipe.cook_time_minutes} min • {recipe.chef_technique}
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                  + {recipe.money_saved_estimate.toFixed(2)} €
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-2">{recipe.recipe_title}</h2>
              <p className="text-xs text-slate-400 mt-1">{recipe.subtitle}</p>
            </div>

            {/* Ingrédients détectés */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Ingrédients reconnus :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {recipe.detected_ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="bg-slate-800 text-slate-200 border border-slate-700 text-xs px-2.5 py-1 rounded-lg"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>

            {/* Étapes & Minuteurs */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Technique de préparation :
              </span>
              <div className="space-y-2.5">
                {recipe.steps.map((step, idx) => {
                  const timerState = activeTimers[idx];
                  return (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2"
                    >
                      <div className="text-xs font-bold text-amber-400">
                        {step.step_number}. {step.title}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {step.instruction}
                      </p>

                      {step.timer_seconds > 0 && (
                        <div className="flex items-center space-x-2 pt-1">
                          {!timerState?.running && !timerState?.done && (
                            <button
                              onClick={() => startTimer(idx, step.timer_seconds)}
                              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5"
                            >
                              <span>⏱️ Lancer {Math.ceil(step.timer_seconds / 60)} min</span>
                            </button>
                          )}
                          {timerState?.running && (
                            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-3 py-1.5 rounded-lg animate-pulse">
                              ⏳ {Math.floor(timerState.remaining / 60).toString().padStart(2, "0")}:
                              {(timerState.remaining % 60).toString().padStart(2, "0")}
                            </span>
                          )}
                          {timerState?.done && (
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                              ✅ C'est prêt !
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Validation & Clôture */}
            <button
              onClick={finishMeal}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-2xl transition text-xs shadow-lg shadow-emerald-950/40"
            >
              🎉 Plat terminé ! Enregistrer l'économie
            </button>
            <button
              onClick={() => setRecipe(null)}
              className="w-full text-slate-500 hover:text-slate-300 text-xs py-1"
            >
              Scanner un autre frigo
            </button>
          </div>
        )}

      </div>
    </main>
  );
}