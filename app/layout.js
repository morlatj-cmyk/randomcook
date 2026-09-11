import "./globals.css";

export const metadata = {
  title: "RandomCook — Les bons restes méritent mieux",
  description: "Photographie ton frigo et transforme tes restes en recette de chef, rapide et anti-gaspi.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="bg-[#f4f1e9]">
      <body>{children}</body>
    </html>
  );
}
