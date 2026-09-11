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
  timer_seconds: z.number().int().min(0).max(7200),
});

const singleRecipeSchema = z.object({
  category: z.enum(["express", "normal", "long"]),
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
      temperature: 0.2,
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
