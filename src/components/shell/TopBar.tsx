"use client";

import { useAppState } from "@/features/app-state";

const viewTitles: Record<string, string> = {
  onboarding: "Welcome",
  chat: "PocketPilot",
  constitution: "Money Constitution",
  history: "History",
};

export default function TopBar() {
  const state = useAppState();

  if (state.view === "onboarding") return null;

  return (
    <header
      className="
        lg:hidden
        sticky top-0
        h-[var(--topbar-height)]
        bg-[var(--color-bg-primary)]/90 backdrop-blur-md
        border-b border-[var(--color-border-subtle)]
        flex items-center justify-between
        px-4
        z-[var(--z-sticky)]
      "
    >
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-xs">
          P
        </div>
        <h1 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          {viewTitles[state.view] || "PocketPilot"}
        </h1>
      </div>
      {state.profile && (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] flex items-center justify-center text-xs font-medium text-[var(--color-text-secondary)]">
            {state.profile.name.charAt(0)}
          </div>
        </div>
      )}
    </header>
  );
}
