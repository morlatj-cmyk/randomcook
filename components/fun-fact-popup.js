"use client";

import { useMemo, useState } from "react";

const FUN_FACTS = [
  "Chaque année, environ un tiers de la nourriture produite dans le monde finit à la poubelle. Cuisiner tes restes, c'est déjà agir.",
  "En France, on jette en moyenne 30 kg de nourriture par personne et par an, dont 7 kg encore emballés.",
  "Réutiliser tes ingrédients au lieu de les jeter peut alléger ton budget courses de plusieurs centaines d'euros par an.",
  "Le gaspillage alimentaire représente près de 10 % des émissions mondiales de gaz à effet de serre.",
  "Si le gaspillage alimentaire était un pays, il serait le troisième plus gros émetteur de CO₂ au monde.",
  "Un frigo bien rangé, les plus anciens produits devant, réduit fortement les oublis au fond des étagères.",
  "La plupart des légumes un peu fatigués sont parfaits pour une soupe, un bouillon ou une poêlée.",
  "Les fanes de carottes, radis ou betteraves se transforment en pesto, en soupe ou en chips au four.",
  "La date « à consommer de préférence avant » indique la qualité, pas la sécurité : souvent, c'est encore très bon après.",
  "Congeler un aliment juste avant sa date limite prolonge sa vie de plusieurs semaines, voire mois.",
  "Le pain rassis renaît en pain perdu, croûtons, chapelure ou pudding : rien ne se perd.",
  "Un citron pressé n'est pas fini : son zeste parfume plats et desserts, et sa peau nettoie même l'évier.",
  "Les épluchures de pommes de terre deviennent des chips croustillantes avec un filet d'huile au four.",
  "Cuisiner à partir de ce que tu as déjà évite les achats impulsifs et double emplois.",
  "Une banane trop mûre est l'ingrédient parfait d'un banana bread ou d'un smoothie naturellement sucré.",
  "Les herbes fraîches en trop se congèlent dans un bac à glaçons avec un peu d'huile d'olive.",
  "Produire 1 kg de nourriture demande beaucoup d'eau : la jeter, c'est aussi gaspiller cette eau invisible.",
  "Un yaourt reste souvent consommable une à deux semaines après sa date, s'il a été bien conservé au frais.",
  "Les restes de riz font d'excellents riz sautés, galettes ou puddings dès le lendemain.",
  "Congeler par petites portions permet de ne décongeler que ce dont tu as vraiment besoin.",
  "Les trognons et parures de légumes se gardent au congélateur pour un bouillon maison zéro déchet.",
  "Un œuf qui coule au fond d'un verre d'eau est frais ; s'il flotte, il vaut mieux s'en passer.",
  "Les agrumes, pommes et bananes accélèrent le mûrissement des fruits voisins : sépare-les pour les garder plus longtemps.",
  "Cuisiner « anti-gaspi » développe la créativité : les meilleures recettes naissent souvent d'un frigo presque vide.",
  "Un plat de restes réinventé coûte quasiment zéro euro de plus et évite un aller-retour au supermarché.",
  "Les blancs d'œufs en trop se congèlent parfaitement et servent pour meringues, financiers ou omelettes.",
  "Râper un peu de fromage sec trop dur au-dessus d'un plat lui redonne toute sa saveur.",
  "Garder ses courses visibles, plutôt que cachées au fond du placard, réduit nettement les oublis.",
  "Le marc de café et les épluchures peuvent nourrir un compost et faire pousser tes prochaines herbes.",
  "Réduire son gaspillage de moitié, c'est un geste simple qui a un vrai impact climatique à grande échelle.",
];

export default function FunFactPopup({ onClose }) {
  const [leaving, setLeaving] = useState(false);
  const fact = useMemo(() => FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)], []);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => onClose?.(), 240);
  };

  return (
    <div
      className={`funfact-overlay${leaving ? " funfact-leaving" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="funfact-title"
      onClick={dismiss}
    >
      <div className="funfact-card" onClick={(event) => event.stopPropagation()}>
        <span className="funfact-badge">LE SAVAIS-TU ?</span>
        <h2 id="funfact-title">Anti-gaspi&nbsp;: petit geste, grand impact</h2>
        <p className="funfact-text">{fact}</p>
        <button type="button" className="funfact-button" onClick={dismiss}>
          C&apos;est parti pour cuisiner
        </button>
      </div>
    </div>
  );
}
