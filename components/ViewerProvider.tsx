"use client";

import { createContext, useContext } from "react";
import { useImportGuestWatchlist } from "@/lib/watchlist";
import type { Movie, PickMedia } from "@/lib/types";

export type ClientProfile = { id: string; name: string; color: string; defaultMedia: PickMedia };
export type ClientViewer = { email: string; profile: ClientProfile | null; profiles: ClientProfile[]; watchlist: Movie[] };

const ViewerContext = createContext<ClientViewer | null>(null);

export function ViewerProvider({ viewer, children }: { viewer: ClientViewer | null; children: React.ReactNode }) {
  return (
    <ViewerContext.Provider value={viewer}>
      <GuestWatchlistImport />
      {children}
    </ViewerContext.Provider>
  );
}

function GuestWatchlistImport() {
  useImportGuestWatchlist();
  return null;
}

export const useViewer = () => useContext(ViewerContext);
