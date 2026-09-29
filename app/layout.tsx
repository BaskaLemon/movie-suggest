import type { Metadata } from "next";
import { Bebas_Neue, Poppins } from "next/font/google";
import { AmbientBackground } from "@/components/AmbientBackground";
import { Header } from "@/components/Header";
import { SideRail } from "@/components/SideRail";
import { hasTmdb } from "@/lib/catalog";
import "./globals.css";

const body = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const display = Bebas_Neue({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: { default: "Reelpick: what should I watch tonight?", template: "%s · Reelpick" },
  description: "Pick a mood, a genre and an era, and get one movie to watch tonight.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} antialiased`}>
      <body className="min-h-dvh font-sans">
        <AmbientBackground />
        <Header />
        <SideRail />
        <main className="lg:pl-20">{children}</main>
        <footer className="mt-24 border-t border-line px-4 py-10 text-sm text-muted sm:px-8 lg:pl-28">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>
              <span className="font-display text-lg tracking-wider text-ink">REELPICK</span> · Movie data from{" "}
              <a className="underline decoration-line underline-offset-4 hover:text-ink" href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">
                TMDB
              </a>
              . This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>
            {!hasTmdb && (
              <p className="rounded-full border border-line px-3 py-1 text-xs">
                Demo catalogue. Set <code className="text-ink">TMDB_API_KEY</code> for posters and the full library.
              </p>
            )}
          </div>
        </footer>
      </body>
    </html>
  );
}
