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

const stepSchema = z.object({
  step_number: z.number().int().min(1),
  title: z.string().min(1).max(80),
  instruction: z.string().min(1).max(500),
  is_cooking_time: z.boolean(),
  timer_seconds: z.number().int().min(0).max(7200),
});

const singleRecipeSchema = z.object({
  category: z.enum(["express", "normal", "long"]),
  cuisine_style: z.string().min(1).max(60),
  recipe_title: z.string().min(1).max(100),
  subtitle: z.string().min(1).max(180),
  cook_time_minutes: z.number().int().min(1).max(120),
  money_saved_estimate: z.number().min(0).max(100),
  chef_technique: z.string().min(1).max(80),
  required_equipment: z.array(z.string().max(40)).max(6),
  steps: z.array(stepSchema).min(2).max(9),
});

const responseSchema = z.object({
  detected_ingredients: z.array(ingredientSchema).min(1).max(12),
  warnings: z.array(z.string().max(160)).max(5),
  recipes: z.array(singleRecipeSchema).min(1).max(3),
});

const systemPrompt = `Tu es RandomCook, un chef anti-gaspillage. Analyse la photo avec prudence puis propose des recettes concrètes.

ANALYSE DES INGRÉDIENTS
- Décris uniquement les ingrédients réellement visibles sur la photo. Ne devine pas les aliments masqués ou hors champ.
- Pour chaque ingrédient : un nom court, une quantité estimée visuellement, un niveau de confiance high, medium ou low.
- Renseigne le champ note seulement si l'identification est incertaine, sinon laisse une chaîne vide.
- Tu peux supposer uniquement sel, poivre, eau et huile/beurre comme basiques non photographiés.
- Les warnings signalent une image floue, un ingrédient ambigu ou une quantité incertaine.

MATÉRIEL DISPONIBLE
- On te donne le matériel de cuisine dont dispose l'utilisateur.
- Chaque recette ne doit utiliser QUE ce matériel. Si le four n'est pas disponible, ne propose aucune cuisson au four. Si "Rien du tout" est indiqué, propose uniquement des recettes sans cuisson (assemblage à froid).
- Renseigne required_equipment avec le matériel réellement utilisé par la recette.

TROIS RECETTES
Propose jusqu'à 3 recettes basées principalement sur les ingrédients détectés, une par catégorie quand c'est possible :
- "express" : très rapide, 10 minutes ou moins, gestes minimalistes.
- "normal" : environ 20 minutes, préparation plus travaillée.
- "long" : plus longue et gourmande (par exemple une cuisson au four) si le matériel le permet, sinon une version mijotée plus élaborée avec le matériel disponible.

DIVERSITÉ OBLIGATOIRE (règle la plus importante)
- Les 3 recettes doivent être franchement DIFFÉRENTES les unes des autres : type de plat, technique et style culinaire distincts. Interdit de proposer deux variantes du même plat (par exemple tacos ET wraps, ou deux poêlées, ou deux gratins). Si deux idées se ressemblent, remplace-en une.
- Varie les FORMATS de plat : par exemple une soupe/velouté, un plat mijoté ou une sauce, un gratin ou un plat au four, une salade tiède, une poêlée, une omelette/frittata, des galettes/croquettes, un curry, un risotto, une quiche, des farcis, etc. Chaque recette doit appartenir à un format différent.
- Varie les ORIGINES culinaires quand c'est cohérent (française, italienne, asiatique, méditerranéenne, indienne, tex-mex...) sans jamais forcer un plat aberrant pour les ingrédients détectés.
- Renseigne cuisine_style avec le style ou l'origine RÉEL du plat proposé, qui doit être cohérent avec la recette (un tajine est "Cuisine marocaine", un risotto "Cuisine italienne", un curry "Cuisine indienne"). Les 3 valeurs doivent être distinctes.
- AU MOINS une des recettes doit être une idée VRAIMENT originale et inattendue à laquelle l'utilisateur ne penserait pas spontanément (une association ou une technique qui sort de l'évidence), tout en restant réaliste, savoureuse et cohérente avec les ingrédients. Évite les plats les plus évidents pour les ingrédients détectés.
- Toutes les recettes restent crédibles et réalisables : la surprise vient de l'idée, jamais d'associations incohérentes.

MINUTEURS DE CUISSON
- is_cooking_time vaut true UNIQUEMENT pour une cuisson ou une chauffe réelle qui demande de surveiller le temps : cuire des pâtes dans l'eau bouillante, saisir à la poêle, mijoter, cuire au four, faire réduire, faire bouillir, etc.
- is_cooking_time vaut false pour toute étape d'assemblage, de préparation à froid ou de dressage : couper, mélanger, assaisonner, lier hors du feu, émulsionner, dresser, réserver, préchauffer le four à vide.
- Quand is_cooking_time vaut true, renseigne timer_seconds avec la durée réelle de cuisson. Quand is_cooking_time vaut false, mets impérativement timer_seconds à 0.

Réponds avec l'objet structuré demandé, en français, sans inventer d'ingrédients absents de la photo.`;

export async function POST(request) {
  try {
    const body = await request.json();
    const imageBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64 : "";
    const equipment = Array.isArray(body?.equipment)
      ? body.equipment.filter((item) => typeof item === "string").slice(0, 6)
      : [];

    if (!imageBase64) return NextResponse.json({ error: "Aucune image fournie" }, { status: 400 });
    if (imageBase64.length > 8_000_000) return NextResponse.json({ error: "Image trop volumineuse" }, { status: 413 });

    const equipmentLabel = equipment.length > 0 ? equipment.join(", ") : "Non précisé";

    const { object } = await generateObject({
      model: gateway(process.env.RANDOMCOOK_MODEL || "openai/gpt-4o-mini"),
      schema: responseSchema,
      temperature: 0.85,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: `Matériel de cuisine disponible : ${equipmentLabel}. Identifie les ingrédients visibles puis propose les recettes anti-gaspillage adaptées à ce matériel.` },
          { type: "image", image: Buffer.from(imageBase64, "base64"), mediaType: "image/jpeg" },
        ],
      }],
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("[v0] Analyse photo impossible", error);
    return NextResponse.json({ error: "L'analyse IA est momentanément indisponible" }, { status: 502 });
  }
}
