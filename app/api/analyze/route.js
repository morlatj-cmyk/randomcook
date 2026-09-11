import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export const maxDuration = 45;

export async function POST(req) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Aucune image fournie" }, { status: 400 });
    }

    // Mode secours si la clé API n'est pas encore configurée sur Vercel
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        detected_ingredients: ["Reste de riz cuit", "2 jaunes d'œufs", "Fond de parmesan dur"],
        recipe_title: "Crispy Rice Bowl & Nappe Poivrée à la Romaine",
        subtitle: "Caraméliser un riz froid sans le rendre pâteux et lier une sauce sans crème",
        cook_time_minutes: 11,
        money_saved_estimate: 14.50,
        chef_technique: "Réaction de Maillard & Chaleur résiduelle",
        steps: [
          {
            step_number: 1,
            title: "Saisie haute température (Maillard)",
            instruction: "Mets 1 cuillère d'huile dans une poêle très chaude. Dépose le riz froid et aplatis-le avec une spatule. Ne touche plus à rien pendant 3 min pour former une croûte croustillante.",
            timer_seconds: 180
          },
          {
            step_number: 2,
            title: "Préparation de l'émulsion (Hors du feu)",
            instruction: "Dans un bol, bats les 2 jaunes avec le parmesan très finement râpé et beaucoup de poivre noir. Ne remets pas sur le feu pour éviter les grumeaux.",
            timer_seconds: 0
          },
          {
            step_number: 3,
            title: "Liage minute et glaçage",
            instruction: "Hors du feu, verse 2 cuillères à soupe d'eau chaude sur le riz, puis l'appareil œuf/parmesan. Remue vivement pour créer une sauce brillante.",
            timer_seconds: 45
          }
        ]
      });
    }

    const systemPrompt = `
Tu es un chef cuisinier gastronomique pédagogue expert en cuisine zéro-déchet et chimie culinaire.
Tu analyses la photo d'un frigo ou de restes sur un plan de travail.

CONSIGNES STRICTES :
1. Repère 3 à 5 ingrédients exploitables réels visibles sur l'image.
2. N'ajoute aucun produit frais introuvable. Suppose seulement sel, poivre, eau, huile/beurre.
3. Rédige UNE recette de 10 à 15 min max appliquant de vrais principes culinaires (réaction de Maillard, émulsion hors du feu, réduction des sucs, glaçage).
4. Renvoie UNIQUEMENT un objet JSON valide avec cette structure exacte :
{
  "detected_ingredients": ["ingrédient 1", "ingrédient 2"],
  "recipe_title": "Titre bistronomique précis",
  "subtitle": "Explication de la technique utilisée",
  "cook_time_minutes": 12,
  "money_saved_estimate": 14.50,
  "chef_technique": "Nom de la technique (ex: Émulsion résiduelle)",
  "steps": [
    {
      "step_number": 1,
      "title": "Nom de l'action",
      "instruction": "Geste technique précis.",
      "timer_seconds": 180
    }
  ]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Voici mon frigo. Trouve une recette de chef précise avec ces restes." },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "low"
              }
            }
          ]
        }
      ]
    });

    const parsedData = JSON.parse(response.choices[0].message.content);
    return NextResponse.json(parsedData);

  } catch (error) {
    console.error("Erreur serveur :", error);
    return NextResponse.json({ error: "Erreur pendant le traitement de l'image" }, { status: 500 });
  }
}