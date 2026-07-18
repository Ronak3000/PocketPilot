"use client";

import { AppStateProvider } from "@/features/app-state";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppStateProvider>{children}</AppStateProvider>;
}
