"use client";

import { useAppState, useAppDispatch } from "@/features/app-state";
import type { AppView } from "@/features/types";

const navItems: { id: AppView; label: string; icon: string }[] = [
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "constitution", label: "Rules", icon: "📜" },
  { id: "history", label: "History", icon: "📋" },
];

export default function MobileNav() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  if (state.view === "onboarding") return null;

  return (
    <nav
      className="
        lg:hidden fixed bottom-0 left-0 right-0
        h-[var(--mobile-nav-height)]
        bg-[var(--color-bg-secondary)]/95 backdrop-blur-md
        border-t border-[var(--color-border-subtle)]
        flex items-center justify-around
        z-[var(--z-sticky)]
        px-4
      "
    >
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => dispatch({ type: "SET_VIEW", view: item.id })}
          className={`
            flex flex-col items-center gap-1 py-2 px-4
            rounded-[var(--radius-md)] transition-colors
            cursor-pointer
            ${
              state.view === item.id
                ? "text-[var(--color-accent-text)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            }
          `}
        >
          <span className="text-lg">{item.icon}</span>
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
      <button
        onClick={() => dispatch({ type: "RESET_DEMO" })}
        className="flex flex-col items-center gap-1 py-2 px-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer"
      >
        <span className="text-lg">↺</span>
        <span className="text-[10px] font-medium">Reset</span>
      </button>
    </nav>
  );
}
