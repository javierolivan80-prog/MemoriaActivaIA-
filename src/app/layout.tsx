import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

// One humanist sans across the whole type scale — display through caption —
// instead of a display serif paired with a separate UI sans. Figtree reads
// warm and rounded without being a novelty face, and stays legible for a
// mixed-age audience at every size the app uses.
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Memoria Activa",
  description:
    "Compañía real por teléfono para quien más quieres, con memoria de cada conversación.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${figtree.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
