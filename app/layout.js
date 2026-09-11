import "./globals.css";

export const metadata = {
  title: "RandomCook - Cuisine Anti-Gaspi de Chef",
  description: "Scanne ton frigo, cuisine comme un chef et économise sur tes livraisons.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen font-sans antialiased select-none">
        {children}
      </body>
    </html>
  );
}