import { generateObject, gateway } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const ingredientSchema = z.object({
  name: z.string().min(1).max(80),
  quantity: z.string().max(60),
  confidence: z.enum(["high", "medium", "low"]),
  note: z.string().max(140).default(""),
});

const recipeSchema = z.object({
  detected_ingredients: z.array(ingredientSchema).min(1).max(12),
  warnings: z.array(z.string().max(160)).max(5),
  recipe_title: z.string().min(1).max(100),
  subtitle: z.string().min(1).max(180),
  cook_time_minutes: z.number().int().min(1).max(45),
  money_saved_estimate: z.number().min(0).max(100),
  chef_technique: z.string().min(1).max(80),
  steps: z.array(z.object({
    step_number: z.number().int().min(1),
    title: z.string().min(1).max(80),
    instruction: z.string().min(1).max(500),
    timer_seconds: z.number().int().min(0).max(3600),
  })).min(2).max(7),
});

const systemPrompt = `Tu es RandomCook, un chef anti-gaspillage. Analyse cette photo avec prudence.
- Décris uniquement les ingrédients réellement visibles. Ne devine pas les aliments masqués ou hors champ.
- Pour chaque ingrédient, indique un nom court, une quantité visuellement estimée et un niveau de confiance high, medium ou low.
- Utilise une note uniquement si l'identification est incertaine.
- Tu peux supposer uniquement sel, poivre, eau et huile/beurre comme basiques non photographiés.
- Les warnings doivent signaler toute image floue, tout ingrédient ambigu ou toute quantité incertaine.
- Crée une recette simple de 1 à 45 minutes basée principalement sur les ingrédients détectés.
- Réponds avec l'objet structuré demandé, sans inventer d'ingrédients.`;

export async function POST(request) {
  try {
    const body = await request.json();
    const imageBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64 : "";
    if (!imageBase64) return NextResponse.json({ error: "Aucune image fournie" }, { status: 400 });
    if (imageBase64.length > 8_000_000) return NextResponse.json({ error: "Image trop volumineuse" }, { status: 413 });

    const { object } = await generateObject({
      model: gateway(process.env.RANDOMCOOK_MODEL || "openai/gpt-4o-mini"),
      schema: recipeSchema,
      temperature: 0.1,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Identifie les ingrédients visibles puis propose une recette anti-gaspillage." },
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

export const dynamic = "force-dynamic";

// Validation conservée côté serveur pour empêcher une sortie IA mal formée de traverser l'API.
void recipeSchema;
