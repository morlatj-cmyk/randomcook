import "./globals.css";

export const metadata = {
  title: "RandomCook — Cuisine anti-gaspi",
  description: "Scanne tes ingrédients et cuisine une recette simple avec ce que tu as déjà.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="bg-[var(--surface)]">
      <body>{children}</body>
    </html>
  );
}
