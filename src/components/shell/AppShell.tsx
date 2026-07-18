"use client";

import { useAppState } from "@/features/app-state";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const state = useAppState();
  const isOnboarding = state.view === "onboarding";

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {!isOnboarding && <Sidebar />}
      {!isOnboarding && <TopBar />}

      <main
        className={`
          min-h-screen
          ${isOnboarding ? "" : "lg:ml-[var(--sidebar-width)]"}
          ${isOnboarding ? "" : "pb-[var(--mobile-nav-height)] lg:pb-0"}
        `}
      >
        {children}
      </main>

      {!isOnboarding && <MobileNav />}
    </div>
  );
}
