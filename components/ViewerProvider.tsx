"use client";

import { createContext, useContext } from "react";
import type { PickMedia } from "@/lib/types";

export type ClientProfile = { id: string; name: string; color: string; defaultMedia: PickMedia };
export type ClientViewer = { email: string; profile: ClientProfile | null; profiles: ClientProfile[] };

const ViewerContext = createContext<ClientViewer | null>(null);

export function ViewerProvider({ viewer, children }: { viewer: ClientViewer | null; children: React.ReactNode }) {
  return <ViewerContext.Provider value={viewer}>{children}</ViewerContext.Provider>;
}

export const useViewer = () => useContext(ViewerContext);
