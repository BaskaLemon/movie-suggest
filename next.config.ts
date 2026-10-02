import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // TMDB already serves resized posters (w185…w1280), so skip Vercel's optimiser and its
    // monthly quota; images load straight from TMDB's CDN.
    unoptimized: true,
    remotePatterns: [new URL("https://image.tmdb.org/t/p/**")],
  },
};

export default nextConfig;
