"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SavingsView from "@/components/savings-view";
import AccountView from "@/components/account-view";
import SplashScreen from "@/components/splash-screen";
import FunFactPopup from "@/components/fun-fact-popup";
import Logo from "@/components/logo";
import MixingLoader from "@/components/mixing-loader";

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

const FREE_DAILY_SCANS = 3;
const PREMIUM_FLAG_KEY = "rc_premium";
const GOAL_KEY = "rc_monthly_goal";
const SCAN_KEY = "rc_scans";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readScanCount() {
  try {
    const raw = JSON.parse(localStorage.getItem(SCAN_KEY) || "{}");
    return raw.date === todayKey() ? Number(raw.count || 0) : 0;
  } catch {
    return 0;
  }
}

function writeScanCount(count) {
  try {
    localStorage.setItem(SCAN_KEY, JSON.stringify({ date: todayKey(), count }));
  } catch {
    /* stockage indisponible : on ignore */
  }
}

const fallbackData = {
  detected_ingredients: [
    { name: "Reste de riz cuit", quantity: "1 bol", confidence: "high", note: "" },
    { name: "Jaunes d'œufs", quantity: "2 pièces", confidence: "medium", note: "Identification probable" },
    { name: "Parmesan", quantity: "un fond", confidence: "medium", note: "Quantité difficile à estimer" },
  ],
  warnings: ["Ces recettes de secours n'ont pas été générées à partir de votre photo."],
  suitable_courses: ["plat"],
  generated_course: "plat",
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
        { step_number: 1, title: "Saisir le riz", instruction: "Chauffe un filet d'huile, ajoute le riz froid et laisse-le tiédir 2 minutes.", pro_tip: "", is_cooking_time: true, timer_seconds: 120 },
        { step_number: 2, title: "Lier hors du feu", instruction: "Hors du feu, ajoute les jaunes et le parmesan, remue vivement jusqu'à une sauce brillante.", pro_tip: "", is_cooking_time: false, timer_seconds: 0 },
      ],
      shopping_suggestions: [
        { name: "Pâte de miso blanc", role: "umami", cost: "≈ 3 €", impact: "Une pointe de miso fondue dans le riz apporte une profondeur salée qui fait croire à un long mijotage." },
        { name: "Vinaigre de riz", role: "acidité", cost: "≈ 2 €", impact: "Quelques gouttes en finition réveillent le gras des jaunes et allègent la sensation en bouche." },
      ],
      chef_mode: {
        technique: "Termine hors du feu en fouettant une noisette de beurre froid pour monter la liaison et obtenir un riz nappant et brillant.",
        plating: "Dresse en dôme à l'emporte-pièce, creuse un léger puits et râpe le parmesan au-dessus au dernier moment.",
        pairing: "Un blanc sec tendu, type chablis ou pinot blanc d'Alsace bien frais.",
      },
      make_ahead: "Le riz peut être cuit la veille et conservé au frais ; la liaison aux jaunes se fait uniquement au moment de servir.",
      common_mistake: "Ajouter les jaunes sur feu vif : ils coagulent et grainent. Toujours lier hors du feu.",
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
        { step_number: 1, title: "Croûte de riz", instruction: "Étale le riz dans une poêle chaude et laisse une croûte se former sans remuer, 4 minutes.", pro_tip: "", is_cooking_time: true, timer_seconds: 240 },
        { step_number: 2, title: "Assaisonner", instruction: "Ajoute le parmesan, mélange puis réserve au chaud.", pro_tip: "", is_cooking_time: false, timer_seconds: 0 },
        { step_number: 3, title: "Œuf poêlé", instruction: "Cuis un œuf au plat et pose-le sur le riz. Poivre généreusement.", pro_tip: "", is_cooking_time: true, timer_seconds: 180 },
      ],
      shopping_suggestions: [
        { name: "Huile de sésame grillé", role: "profondeur", cost: "≈ 3 €", impact: "Un filet hors du feu diffuse un parfum torréfié qui signe instantanément un vrai riz sauté." },
        { name: "Togarashi", role: "texture croquante", cost: "≈ 2 €", impact: "Ce mélange japonais apporte piquant et graines croustillantes en contraste avec l'œuf coulant." },
      ],
      chef_mode: {
        technique: "Fais sauter le riz par petites quantités à feu très vif pour qu'il reste détaché et légèrement croustillant, façon wok.",
        plating: "Monte le riz en dôme, dépose l'œuf au sommet et laisse le jaune couler à la découpe pour l'effet visuel.",
        pairing: "Une bière blonde légère bien fraîche ou un thé vert glacé non sucré.",
      },
      make_ahead: "Le riz se saute idéalement froid : prépare-le la veille, l'humidité en moins garantit le croustillant.",
      common_mistake: "Remuer sans arrêt : le riz ne caramélise pas. Laisse-le immobile pour former la croûte.",
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
        { step_number: 1, title: "Préchauffer", instruction: "Préchauffe le four à 200°C.", pro_tip: "", is_cooking_time: false, timer_seconds: 0 },
        { step_number: 2, title: "Monter le plat", instruction: "Mélange le riz, les jaunes et le parmesan, verse dans un plat et lisse la surface.", pro_tip: "", is_cooking_time: false, timer_seconds: 0 },
        { step_number: 3, title: "Gratiner", instruction: "Enfourne 25 minutes jusqu'à une belle croûte dorée.", pro_tip: "", is_cooking_time: true, timer_seconds: 1500 },
      ],
      shopping_suggestions: [
        { name: "Chapelure panko", role: "texture croquante", cost: "≈ 2 €", impact: "Parsemée sur le dessus, elle crée une croûte nettement plus croustillante que le fromage seul." },
        { name: "Zestes de citron confit", role: "fraîcheur aromatique", cost: "≈ 3 €", impact: "Quelques éclats coupent la richesse du gratin et apportent une touche parfumée inattendue." },
      ],
      chef_mode: {
        technique: "Termine 2 minutes sous le gril pour une croûte irrégulière et bien dorée, puis laisse reposer 5 minutes pour que le cœur se tienne à la découpe.",
        plating: "Sers une part nette à l'aide d'une spatule, croûte vers le haut, sur assiette chaude avec un trait d'huile.",
        pairing: "Un rouge léger servi frais, type gamay, et une salade verte acidulée.",
      },
      make_ahead: "Le plat peut être monté à l'avance et conservé au frais, puis enfourné au dernier moment.",
      common_mistake: "Servir le gratin brûlant à la sortie du four : il s'effondre. Laisse-le reposer avant de couper.",
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

  const [showSplash, setShowSplash] = useState(true);
  const [showFunFact, setShowFunFact] = useState(false);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [course, setCourse] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [error, setError] = useState("");
  const [activeTimers, setActiveTimers] = useState({});
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [monthlyGoal, setMonthlyGoal] = useState(0);
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

  useEffect(() => {
    setScanCount(readScanCount());
    try {
      setMonthlyGoal(Number(localStorage.getItem(GOAL_KEY) || 0));
      if (localStorage.getItem(PREMIUM_FLAG_KEY) === "1") setIsPremium(true);
    } catch {
      /* stockage indisponible : on ignore */
    }
  }, []);

  useEffect(() => {
    if (user?.user_metadata?.is_premium) setIsPremium(true);
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

  const activatePremium = async () => {
    setIsPremium(true);
    try {
      localStorage.setItem(PREMIUM_FLAG_KEY, "1");
    } catch {
      /* stockage indisponible : on ignore */
    }
    if (user) {
      try {
        await supabaseRef.current.auth.updateUser({ data: { is_premium: true } });
      } catch {
        /* mise à jour du profil impossible : le mode démo reste actif localement */
      }
    }
    setPremiumOpen(false);
  };

  const saveGoal = (value) => {
    const next = Math.max(0, Math.round(Number(value) || 0));
    setMonthlyGoal(next);
    try {
      localStorage.setItem(GOAL_KEY, String(next));
    } catch {
      /* stockage indisponible : on ignore */
    }
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
        body: JSON.stringify({ imageBase64, equipment, isPremium }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Analyse impossible");
      setData(payload);
      setSelectedIngredients((payload.detected_ingredients || []).map((item) => item.name));
      setCourse(payload.generated_course || null);
    } catch {
      setError("L'analyse n'a pas abouti. Des idées de secours sont prêtes à cuisiner.");
      setData(fallbackData);
      setSelectedIngredients(fallbackData.detected_ingredients.map((item) => item.name));
      setCourse(fallbackData.generated_course);
    } finally {
      setLoading(false);
    }
  };

  const toggleIngredient = (name) =>
    setSelectedIngredients((previous) =>
      previous.includes(name) ? previous.filter((item) => item !== name) : [...previous, name]
    );

  const regenerateRecipes = async (courseOverride) => {
    if (selectedIngredients.length === 0 || regenerating) return;
    const requestedCourse = courseOverride ?? course;
    if (courseOverride) setCourse(courseOverride);
    setRegenerating(true);
    setError("");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: selectedIngredients, equipment, isPremium, course: requestedCourse || undefined }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Régénération impossible");
      setData((previous) => ({
        ...previous,
        recipes: payload.recipes,
        suitable_courses: payload.suitable_courses?.length ? payload.suitable_courses : previous?.suitable_courses,
        generated_course: payload.generated_course || previous?.generated_course,
        warnings: payload.warnings?.length ? payload.warnings : previous?.warnings || [],
      }));
      setCourse(payload.generated_course || requestedCourse || null);
      setSelectedRecipe(null);
    } catch {
      setError("Impossible de régénérer les recettes. Réessaie dans un instant.");
    } finally {
      setRegenerating(false);
    }
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!isPremium && readScanCount() >= FREE_DAILY_SCANS) {
      if (inputRef.current) inputRef.current.value = "";
      setPremiumOpen(true);
      return;
    }
    setTab("home");
    setError("");
    setLoading(true);
    if (!isPremium) {
      const nextCount = readScanCount() + 1;
      writeScanCount(nextCount);
      setScanCount(nextCount);
    }
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
    setSelectedIngredients([]);
    setCourse(null);
    setRegenerating(false);
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
    if (!isPremium && readScanCount() >= FREE_DAILY_SCANS) {
      setPremiumOpen(true);
      return;
    }
    if (equipment.length > 0) requestAnimationFrame(() => inputRef.current?.click());
  };

  const formatTime = (seconds) =>
    `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  const hasEquipment = equipment.length > 0;
  const scanRemaining = isPremium ? Infinity : Math.max(0, FREE_DAILY_SCANS - scanCount);
  const scanBlocked = !isPremium && scanRemaining <= 0;
  const onHomeTab = tab === "home";
  const showHome = onHomeTab && !data && !loading;
  const showList = onHomeTab && data && !loading && !selectedRecipe;
  const showDetail = onHomeTab && data && !loading && selectedRecipe;
  const showLoading = onHomeTab && loading;

  return (
    <main className="app-shell">
      {showSplash && <SplashScreen onFinish={() => { setShowSplash(false); setShowFunFact(true); }} />}
      {showFunFact && <FunFactPopup onClose={() => setShowFunFact(false)} />}
      {regenerating && (
        <div className="mixing-overlay">
          <MixingLoader />
        </div>
      )}
      <header className="app-bar">
        <div className="app-brand">
          <span className="brand-mark" aria-hidden="true"><Logo size={22} /></span>
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

          {scanBlocked ? (
            <button type="button" className="scan-card scan-card-premium" onClick={() => setPremiumOpen(true)}>
              <span className="scan-icon" aria-hidden="true">✦</span>
              <span className="scan-card-copy">
                <strong>Limite quotidienne atteinte</strong>
                <small>Passe à Premium pour des scans illimités</small>
              </span>
              <span className="chevron" aria-hidden="true">›</span>
            </button>
          ) : (
            <label className={`scan-card${hasEquipment ? "" : " locked"}`} aria-disabled={!hasEquipment}>
              <span className="scan-icon" aria-hidden="true">+</span>
              <span className="scan-card-copy">
                <strong>Scanner mes ingrédients</strong>
                <small>{hasEquipment ? "Photo ou galerie" : "Sélectionne d'abord ton matériel"}</small>
              </span>
              <span className="chevron" aria-hidden="true">›</span>
              <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} disabled={!hasEquipment} />
            </label>
          )}
          {!hasEquipment && (
            <p className="scan-hint" role="status">Choisis au moins un équipement ci-dessus pour débloquer le scan.</p>
          )}
          {hasEquipment && !scanBlocked && (
            <p className="scan-hint" role="status">
              {isPremium
                ? "Scans illimités avec Premium."
                : `Il te reste ${scanRemaining} scan${scanRemaining > 1 ? "s" : ""} aujourd'hui.`}
            </p>
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
            <div className="section-heading">
              <span>Ingrédients détectés</span>
              <button
                type="button"
                className="ingredient-selectall"
                onClick={() =>
                  setSelectedIngredients(
                    selectedIngredients.length === data.detected_ingredients.length
                      ? []
                      : data.detected_ingredients.map((item) => item.name)
                  )
                }
              >
                {selectedIngredients.length === data.detected_ingredients.length ? "Tout retirer" : "Tout utiliser"}
              </button>
            </div>
            <p className="ingredient-help">Touche un ingrédient pour l&apos;inclure ou l&apos;exclure, puis régénère tes recettes.</p>
            <div className="ingredient-list">
              {data.detected_ingredients.map((ingredient) => {
                const active = selectedIngredients.includes(ingredient.name);
                return (
                  <button
                    type="button"
                    key={ingredient.name}
                    className={`ingredient-item selectable${active ? " selected" : ""}`}
                    aria-pressed={active}
                    onClick={() => toggleIngredient(ingredient.name)}
                  >
                    <span className="ingredient-check" aria-hidden="true">{active ? "✓" : ""}</span>
                    <span className="ingredient-body"><strong>{ingredient.name}</strong><small>{ingredient.quantity}{ingredient.note ? ` · ${ingredient.note}` : ""}</small></span>
                    <em className={`confidence ${ingredient.confidence}`}>{ingredient.confidence === "high" ? "Sûr" : ingredient.confidence === "medium" ? "Probable" : "À vérifier"}</em>
                  </button>
                );
              })}
            </div>
            {data.suitable_courses?.length > 1 && (
              <div className="course-choice">
                <span className="course-choice-label">Que veux-tu préparer&nbsp;?</span>
                <div className="course-options" role="group" aria-label="Type de recette">
                  {data.suitable_courses.map((option) => {
                    const active = course === option;
                    return (
                      <button
                        type="button"
                        key={option}
                        className={`course-option${active ? " active" : ""}`}
                        aria-pressed={active}
                        disabled={regenerating || selectedIngredients.length === 0}
                        onClick={() => { if (!active) regenerateRecipes(option); }}
                      >
                        <span className="course-option-icon" aria-hidden="true">{option === "dessert" ? "◗" : "◆"}</span>
                        {option === "dessert" ? "Dessert" : "Plat salé"}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {data.suitable_courses?.length === 1 && (
              <p className="course-single" role="status">
                Avec ces ingrédients, on part sur {data.suitable_courses[0] === "dessert" ? "un dessert" : "un plat salé"}.
              </p>
            )}
            <button
              type="button"
              className="regen-button"
              onClick={() => regenerateRecipes()}
              disabled={selectedIngredients.length === 0 || regenerating}
            >
              {regenerating
                ? "Régénération en cours…"
                : `Régénérer · ${selectedIngredients.length} ingrédient${selectedIngredients.length > 1 ? "s" : ""}${course ? (course === "dessert" ? " · dessert" : " · plat") : ""}`}
            </button>
            {selectedIngredients.length === 0 && (
              <p className="scan-hint" role="status">Sélectionne au moins un ingrédient pour régénérer.</p>
            )}
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
                    <span>{item.required_equipment?.length > 0 ? item.required_equipment.join(" · ") : "Aucun matériel requis"}</span>
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
            <span><small>MATÉRIEL</small><strong>{selectedRecipe.required_equipment?.length > 0 ? selectedRecipe.required_equipment.join(", ") : "Aucun matériel requis"}</strong></span>
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

          {selectedRecipe.shopping_suggestions?.length > 0 && (
            <div className="premium-section">
              <div className="section-heading"><span>Coup de main du chef</span><span className="muted-label premium-label">PREMIUM</span></div>
              {isPremium ? (
                <div className="shopping-list">
                  {selectedRecipe.shopping_suggestions.map((suggestion) => (
                    <div className="shopping-item" key={suggestion.name}>
                      <span className="shopping-plus" aria-hidden="true">+</span>
                      <span className="shopping-body">
                        <span className="shopping-head">
                          <strong>{suggestion.name}</strong>
                          {suggestion.role && <em className="shopping-role">{suggestion.role}</em>}
                          {suggestion.cost && <span className="shopping-cost">{suggestion.cost}</span>}
                        </span>
                        <small>{suggestion.impact || suggestion.reason}</small>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <button type="button" className="premium-lock" onClick={() => setPremiumOpen(true)}>
                  <span className="premium-lock-icon" aria-hidden="true">✦</span>
                  <span><strong>{selectedRecipe.shopping_suggestions.length} achats de chef pour sublimer ce plat</strong><small>Des ajouts pointus (umami, acidité, texture) qu&apos;on ne devine pas seul. Débloque-les avec Premium.</small></span>
                  <span className="chevron" aria-hidden="true">›</span>
                </button>
              )}
            </div>
          )}

          {selectedRecipe.chef_mode && (
            <div className="premium-section">
              <div className="section-heading"><span>Mode chef</span><span className="muted-label premium-label">PREMIUM</span></div>
              {isPremium ? (
                <div className="chef-mode">
                  {selectedRecipe.chef_mode.technique && <div className="chef-mode-row"><span className="chef-mode-tag">TECHNIQUE</span><p>{selectedRecipe.chef_mode.technique}</p></div>}
                  {selectedRecipe.chef_mode.plating && <div className="chef-mode-row"><span className="chef-mode-tag">DRESSAGE</span><p>{selectedRecipe.chef_mode.plating}</p></div>}
                  {(selectedRecipe.chef_mode.pairing || selectedRecipe.chef_mode.variation) && <div className="chef-mode-row"><span className="chef-mode-tag">ACCORD</span><p>{selectedRecipe.chef_mode.pairing || selectedRecipe.chef_mode.variation}</p></div>}
                </div>
              ) : (
                <button type="button" className="premium-lock" onClick={() => setPremiumOpen(true)}>
                  <span className="premium-lock-icon" aria-hidden="true">✦</span>
                  <span><strong>Technique, dressage et accord de restaurant</strong><small>Passe en Mode chef avec Premium.</small></span>
                  <span className="chevron" aria-hidden="true">›</span>
                </button>
              )}
            </div>
          )}

          {isPremium && (selectedRecipe.make_ahead || selectedRecipe.common_mistake) && (
            <div className="premium-section">
              <div className="section-heading"><span>Notes du chef</span><span className="muted-label premium-label">PREMIUM</span></div>
              <div className="chef-notes">
                {selectedRecipe.make_ahead && <div className="chef-note"><span>À PRÉPARER À L&apos;AVANCE</span><p>{selectedRecipe.make_ahead}</p></div>}
                {selectedRecipe.common_mistake && <div className="chef-note warn"><span>ERREUR À ÉVITER</span><p>{selectedRecipe.common_mistake}</p></div>}
              </div>
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
                    {isPremium && step.pro_tip && (
                      <p className="step-tip"><span>ASTUCE CHEF</span>{step.pro_tip}</p>
                    )}
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
          isPremium={isPremium}
          monthlyGoal={monthlyGoal}
          onSetGoal={saveGoal}
          onUpgrade={() => setPremiumOpen(true)}
          onGoToScan={goToScan}
          onSignIn={() => setTab("account")}
        />
      )}

      {tab === "account" && (
        <AccountView
          user={user}
          authLoading={authLoading}
          isPremium={isPremium}
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
            <span className="premium-tag">PREMIUM · 4,99 € / MOIS</span>
            <h2 id="premium-modal-title">RandomCook Premium</h2>
            <p>Scans illimités, suivi avancé des économies, listes de courses malines et Mode chef sur chaque recette.</p>
            <button type="button" className="premium-button" onClick={activatePremium}>Activer l&apos;essai (démo)</button>
            <button type="button" className="premium-modal-later" onClick={() => setPremiumOpen(false)}>Le paiement sécurisé arrive bientôt · plus tard</button>
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
