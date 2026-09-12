import { generateObject, gateway } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const ingredientSchema = z.object({
  name: z.string().min(1).max(80),
  quantity: z.string().max(60),
  confidence: z.enum(["high", "medium", "low"]),
  note: z.string().max(140),
});

const recipeIngredientSchema = z.object({
  name: z.string().min(1).max(60),
  quantity: z.string().min(1).max(40),
  essential: z.boolean(),
});

const stepSchema = z.object({
  step_number: z.number().int().min(1),
  title: z.string().min(1).max(80),
  instruction: z.string().min(1).max(700),
  pro_tip: z.string().max(240),
  is_cooking_time: z.boolean(),
  timer_seconds: z.number().int().min(0).max(7200),
});

const costIngredientSchema = z.object({
  name: z.string().min(1).max(60),
  cost: z.number().min(0).max(60),
});

const costBreakdownSchema = z.object({
  servings: z.number().int().min(1).max(12),
  ingredient_costs: z.array(costIngredientSchema).min(1).max(14),
  home_cost: z.number().min(0).max(200),
  bought_cost: z.number().min(0).max(400),
  bought_reference: z.string().min(1).max(120),
  money_saved_estimate: z.number().min(0).max(300),
});

const shoppingSuggestionSchema = z.object({
  name: z.string().min(1).max(60),
  role: z.string().min(1).max(40),
  cost: z.string().min(1).max(30),
  impact: z.string().min(1).max(240),
});

const chefModeSchema = z.object({
  technique: z.string().min(1).max(280),
  plating: z.string().min(1).max(280),
  pairing: z.string().min(1).max(180),
});

const singleRecipeSchema = z.object({
  category: z.enum(["express", "normal", "long"]),
  cuisine_style: z.string().min(1).max(60),
  recipe_title: z.string().min(1).max(100),
  subtitle: z.string().min(1).max(180),
  cook_time_minutes: z.number().int().min(1).max(120),
  cost_breakdown: costBreakdownSchema,
  chef_technique: z.string().min(1).max(80),
  required_equipment: z.array(z.string().max(40)).max(6),
  ingredients: z.array(recipeIngredientSchema).min(2).max(16),
  steps: z.array(stepSchema).min(2).max(12),
  shopping_suggestions: z.array(shoppingSuggestionSchema).min(2).max(4),
  chef_mode: chefModeSchema,
  make_ahead: z.string().max(280),
  common_mistake: z.string().max(280),
});

const responseSchema = z.object({
  detected_ingredients: z.array(ingredientSchema).min(1).max(12),
  warnings: z.array(z.string().max(160)).max(5),
  suitable_courses: z.array(z.enum(["plat", "dessert"])).min(1).max(2),
  generated_course: z.enum(["plat", "dessert"]),
  recipes: z.array(singleRecipeSchema).min(1).max(3),
});

const basePrompt = `Tu es RandomCook, un chef anti-gaspillage. Analyse les ingrédients avec prudence puis propose des recettes concrètes.

ANALYSE DES INGRÉDIENTS
- Décris uniquement les ingrédients réellement disponibles. En mode photo, ne devine pas les aliments masqués ou hors champ.
- Pour chaque ingrédient : un nom court, une quantité estimée, un niveau de confiance high, medium ou low.
- Renseigne le champ note seulement si l'identification est incertaine, sinon laisse une chaîne vide.
- Tu peux supposer uniquement sel, poivre, eau et huile/beurre comme basiques non listés.
- Les warnings signalent une image floue, un ingrédient ambigu ou une quantité incertaine.

MATÉRIEL DISPONIBLE — RÈGLE STRICTE ET IMPORTANTE
- On te donne le matériel de cuisine dont dispose l'utilisateur.
- Chaque recette ne doit utiliser QUE ce matériel.
- Quand du matériel est fourni (autre que "Rien du tout"), CHAQUE recette proposée doit RÉELLEMENT s'appuyer sur au moins un des appareils listés : il doit exister une étape de cuisson ou de chauffe qui utilise concrètement cet appareil. Ne propose jamais une recette qui n'exploite pas le matériel choisi alors qu'un appareil est disponible.
- required_equipment doit lister EXACTEMENT les appareils réellement utilisés dans les étapes de la recette, ni plus ni moins. N'y mets un appareil que si une étape s'en sert vraiment.
- Si une recette est réellement un assemblage à froid sans aucun appareil, laisse required_equipment vide (tableau vide []).
- Si "Rien du tout" est indiqué, TOUTES les recettes sont sans cuisson et required_equipment est vide pour chacune.

PLAT OU DESSERT — CATÉGORISATION INTELLIGENTE
- Analyse la nature des ingrédients pour déterminer ce qu'on peut RAISONNABLEMENT en faire : un plat salé ("plat"), un dessert sucré ("dessert"), ou les deux.
- suitable_courses liste les types réellement cohérents. Exemples de raisonnement :
  - framboise + yaourt, fruits + fromage blanc, chocolat + œufs → ["dessert"] (ce serait bizarre en plat salé).
  - poulet + oignon + riz, pâtes + tomate, légumes + viande → ["plat"].
  - œufs + farine + lait + beurre, ricotta + citron, pomme + pâte, fruits + œufs + sucre → ["plat", "dessert"] (les deux sont crédibles).
- Ne propose "dessert" que si un dessert appétissant et cohérent est vraiment réalisable ; ne propose "plat" que si un plat salé savoureux est crédible. Ne force jamais un type qui donnerait un résultat étrange.
- generated_course indique le type des recettes que tu renvoies MAINTENANT.
- Un type demandé peut t'être imposé : dans ce cas, TOUTES les recettes renvoyées appartiennent à ce type (generated_course = ce type), à condition qu'il figure dans suitable_courses.
- Si aucun type n'est imposé, choisis le type le plus naturel pour ces ingrédients (dessert si les ingrédients sont clairement sucrés, sinon plat) et renseigne generated_course en conséquence.
- Les recettes d'un dessert doivent être de vrais desserts (sucrés, gourmands) ; celles d'un plat de vrais plats salés. Ne mélange jamais les deux dans une même génération.

TROIS RECETTES
Propose jusqu'à 3 recettes du type demandé (generated_course), basées principalement sur les ingrédients disponibles, une par catégorie de temps quand c'est possible :
- "express" : très rapide, 10 minutes ou moins.
- "normal" : environ 20 minutes, plus travaillée.
- "long" : plus longue et gourmande si le matériel le permet, sinon une version mijotée plus élaborée.

DIVERSITÉ OBLIGATOIRE
- Les 3 recettes doivent être franchement DIFFÉRENTES : type de plat, technique et style distincts. Interdit de proposer deux variantes du même plat.
- Varie les FORMATS (soupe, mijoté, gratin, salade tiède, poêlée, frittata, galettes, curry, risotto, quiche, farcis...) et les ORIGINES culinaires quand c'est cohérent.
- Renseigne cuisine_style avec l'origine RÉELLE et cohérente du plat. Les 3 valeurs doivent être distinctes.
- AU MOINS une recette doit être une idée VRAIMENT originale et inattendue, tout en restant réaliste et savoureuse.

LISTE D'INGRÉDIENTS DOSÉE (ingredients) — PRÉCISION OBLIGATOIRE
- Chaque recette DOIT fournir la liste complète de ses ingrédients avec des quantités PRÉCISES et CHIFFRÉES, dosées pour le nombre exact de portions indiqué dans cost_breakdown.servings.
- Utilise systématiquement une unité mesurable et concrète : grammes (g), millilitres (ml) ou centilitres (cl), cuillères à soupe (c. à s.) / cuillères à café (c. à c.), ou un nombre de pièces précis (ex : "2 œufs", "1 oignon moyen (~150 g)"). N'écris JAMAIS de quantité vague comme "un peu", "un fond", "quelques", "au goût", "selon envie" pour les ingrédients principaux.
- Pour les basiques d'assaisonnement (sel, poivre), tu peux indiquer "à ajuster" mais donne quand même un ordre de grandeur quand c'est utile (ex : "1/2 c. à c. de sel").
- Les quantités de la liste et celles citées dans les étapes (steps) doivent être COHÉRENTES entre elles : si une étape dit "verse 20 cl de crème", la liste indique "20 cl de crème".
- essential vaut true pour un ingrédient indispensable à la recette, false pour un élément d'assaisonnement ou une finition facultative.
- Inclus tous les ingrédients réellement utilisés dans les étapes, y compris les basiques employés (huile, beurre, eau).

ANALYSE DE COÛT (cost_breakdown) — À CALCULER SÉRIEUSEMENT
Compare le coût maison au prix du même plat acheté tout prêt ou livré, en euros (€), pour le nombre de portions (servings).
- ingredient_costs : chaque ingrédient utilisé avec son coût pour la quantité employée, prix moyens supermarché français 2024 (ex : 200 g de poulet ≈ 2,00 €, 1 oignon ≈ 0,20 €, 1 œuf ≈ 0,30 €, portion de riz sec ≈ 0,25 €). Inclus les basiques utilisés.
- home_cost : somme exacte des ingredient_costs, arrondie à deux décimales.
- bought_reference : nomme le plat équivalent acheté/livré servant de comparaison.
- bought_cost : prix réaliste de ce plat équivalent acheté prêt ou livré en France (typiquement 2,5 à 4 fois le coût des ingrédients maison).
- money_saved_estimate : bought_cost moins home_cost, jamais négatif.

LISTE DE COURSES MALINE (shopping_suggestions) — VRAIE VALEUR PREMIUM, RAISONNE COMME UN CHEF
- Propose 2 à 4 achats complémentaires PEU coûteux mais NON ÉVIDENTS qui font passer CE plat précis à un niveau supérieur.
- STRICTEMENT INTERDIT les suggestions banales que tout le monde connaît : miel, sucre, sel, poivre, citron seul, ketchup, mayonnaise, crème simple, fromage râpé basique. Ne propose jamais ce genre de chose.
- Vise des produits précis avec un vrai effet culinaire de chef, par exemple : pâte de miso pour l'umami, vinaigre de xérès ou de riz pour l'acidité, dukkah ou noisettes torréfiées pour le croquant, citron confit, piment d'Alep ou togarashi, anchois à fondre, câpres, tahini, huile de sésame grillé, parmesan affiné 24 mois, herbes fraîches inhabituelles (aneth, estragon), zaatar, fond réduit, etc. — adaptés au plat.
- Chaque suggestion :
  - name : le produit précis.
  - role : sa fonction culinaire en 1 à 3 mots ("acidité", "umami", "texture croquante", "profondeur", "fraîcheur aromatique", "amertume").
  - cost : coût indicatif court, ex "≈ 2 €".
  - impact : explication de chef — QUELLE transformation gustative ou texturale il apporte et POURQUOI ça marche pour ce plat, en une phrase précise et convaincante.
- L'ensemble doit clairement justifier un abonnement : ce sont des conseils qu'un cuisinier lambda n'aurait pas eus.

MODE CHEF (chef_mode) — niveau restaurant
- technique : une vraie technique de chef pour élever le plat (émulsion, déglaçage, beurre monté, cuisson douce, caramélisation contrôlée, infusion à froid...), expliquée concrètement et réalisable avec le matériel disponible, en 1 ou 2 phrases.
- plating : comment dresser l'assiette comme au restaurant (disposition, hauteur, touches finales, contraste de couleurs et textures), en 1 ou 2 phrases.
- pairing : un accord pointu et justifié (vin avec cépage/région, ou boisson/accompagnement précis), en une phrase.

MINUTEURS DE CUISSON
- is_cooking_time vaut true UNIQUEMENT pour une cuisson ou une chauffe réelle à surveiller (cuire des pâtes, saisir, mijoter, cuire au four, réduire, bouillir).
- is_cooking_time vaut false pour l'assemblage, la préparation à froid ou le dressage (couper, mélanger, assaisonner, lier hors du feu, dresser, réserver, préchauffer à vide).
- Quand is_cooking_time vaut true, renseigne timer_seconds avec la durée réelle. Sinon timer_seconds vaut impérativement 0.

Réponds avec l'objet structuré demandé, en français, sans inventer d'ingrédients absents de la liste.`;

const premiumInstructions = `NIVEAU PREMIUM ACTIVÉ — les recettes doivent être BEAUCOUP plus détaillées, expertes et pédagogiques (l'utilisateur est abonné et attend une vraie plus-value) :
- Chaque recette comporte au moins 5 étapes (jusqu'à 10), précises et progressives.
- Chaque instruction donne les repères sensoriels (couleur, odeur, texture, son), les températures exactes, les temps précis et les quantités/assaisonnements chiffrés. Sois concret, jamais vague.
- Renseigne pro_tip pour au moins 3 étapes : une astuce de chef non évidente (geste technique, timing critique, correction d'erreur, réglage d'assaisonnement).
- Renseigne make_ahead : ce qui peut être préparé à l'avance et comment le conserver, en 1 ou 2 phrases utiles.
- Renseigne common_mistake : l'erreur classique qui rate ce plat et comment l'éviter, en 1 ou 2 phrases.
- shopping_suggestions et chef_mode doivent être particulièrement soignés et pointus.`;

const freeInstructions = `NIVEAU STANDARD (gratuit) :
- Recettes claires en 2 à 5 étapes, instructions simples.
- Laisse pro_tip vide ("") pour chaque étape, ainsi que make_ahead ("") et common_mistake ("").`;

export async function POST(request) {
  try {
    const body = await request.json();
    const imageBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64 : "";
    const equipment = Array.isArray(body?.equipment)
      ? body.equipment.filter((item) => typeof item === "string").slice(0, 6)
      : [];
    const ingredients = Array.isArray(body?.ingredients)
      ? body.ingredients.filter((item) => typeof item === "string" && item.trim()).slice(0, 12)
      : [];
    const isPremium = body?.isPremium === true;
    const course = body?.course === "plat" || body?.course === "dessert" ? body.course : "";

    if (!imageBase64 && ingredients.length === 0) {
      return NextResponse.json({ error: "Aucune image ni ingrédient fourni" }, { status: 400 });
    }
    if (imageBase64 && imageBase64.length > 8_000_000) {
      return NextResponse.json({ error: "Image trop volumineuse" }, { status: 413 });
    }

    const equipmentLabel = equipment.length > 0 ? equipment.join(", ") : "Non précisé";
    const system = `${basePrompt}\n\n${isPremium ? premiumInstructions : freeInstructions}`;
    const courseLabel = course === "plat" ? "un PLAT salé" : course === "dessert" ? "un DESSERT sucré" : "";
    const courseInstruction = course
      ? ` L'utilisateur veut ${courseLabel} : renvoie UNIQUEMENT des recettes de ce type (generated_course = "${course}"), à condition que ce soit cohérent avec les ingrédients.`
      : " Aucun type n'est imposé : choisis le type le plus naturel (plat ou dessert) selon les ingrédients.";

    const content = [];
    if (ingredients.length > 0) {
      content.push({
        type: "text",
        text: `Ingrédients confirmés par l'utilisateur — utilise UNIQUEMENT ceux-ci (plus les basiques sel, poivre, eau, huile/beurre) : ${ingredients.join(", ")}. Matériel de cuisine disponible : ${equipmentLabel}. Renvoie exactement ces ingrédients dans detected_ingredients (confidence high, note vide), évalue suitable_courses puis propose des recettes anti-gaspillage qui exploitent réellement le matériel disponible.${courseInstruction}`,
      });
    } else {
      content.push({
        type: "text",
        text: `Matériel de cuisine disponible : ${equipmentLabel}. Identifie les ingrédients visibles sur la photo, évalue suitable_courses puis propose des recettes anti-gaspillage qui exploitent réellement ce matériel.${courseInstruction}`,
      });
      content.push({ type: "image", image: Buffer.from(imageBase64, "base64"), mediaType: "image/jpeg" });
    }

    const { object } = await generateObject({
      model: gateway(process.env.RANDOMCOOK_MODEL || "openai/gpt-4o-mini"),
      schema: responseSchema,
      temperature: 0.85,
      system,
      messages: [{ role: "user", content }],
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("[v0] Analyse impossible", error);
    return NextResponse.json({ error: "L'analyse IA est momentanément indisponible" }, { status: 502 });
  }
}
