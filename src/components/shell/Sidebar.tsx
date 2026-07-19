"use client";

import { useAppState, useAppDispatch } from "@/features/app-state";
import { formatCurrency } from "@/features/format";
import type { AppView } from "@/features/types";

const navItems: { id: AppView; label: string; icon: string }[] = [
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "constitution", label: "Constitution", icon: "📜" },
  { id: "history", label: "History", icon: "📋" },
];

export default function Sidebar() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  return (
    <aside
      className={`
        hidden lg:flex flex-col
        w-[var(--sidebar-width)] h-screen
        bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-subtle)]
        fixed left-0 top-0 z-[var(--z-sticky)]
      `}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-sm">
            P
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-[var(--color-text-primary)] tracking-tight">
              PocketPilot
            </h1>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Financial Decision Companion
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => dispatch({ type: "SET_VIEW", view: item.id })}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)]
              text-[14px] font-medium transition-all duration-[var(--duration-fast)]
              cursor-pointer
              ${
                state.view === item.id
                  ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
              }
            `}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Safe to Spend mini card */}
      {state.safeToSpend && (
        <div className="mx-3 mb-3 p-4 rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]">
          <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            Safe to Spend
          </p>
          <p className="text-xl font-semibold font-mono-numbers text-[var(--color-accent-text)]">
            {formatCurrency(state.safeToSpend.safeAmountPaise)}
          </p>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
            {state.safeToSpend.bufferQuality === "excellent"
              ? "Excellent buffer"
              : state.safeToSpend.bufferQuality === "good"
              ? "Good buffer"
              : state.safeToSpend.bufferQuality === "tight"
              ? "Tight buffer"
              : "Critical"}
          </p>
        </div>
      )}

      {/* Demo reset */}
      <div className="px-3 pb-4">
        <button
          onClick={() => dispatch({ type: "RESET_DEMO" })}
          className="
            w-full flex items-center justify-center gap-2 px-3 py-2
            text-[13px] text-[var(--color-text-muted)]
            rounded-[var(--radius-md)]
            hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]
            transition-colors cursor-pointer
          "
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          Reset Demo
        </button>
      </div>
    </aside>
  );
}
