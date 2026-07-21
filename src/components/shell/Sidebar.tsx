"use client";

import { useAppState, useAppDispatch } from "@/features/app-state";
import type { AppView } from "@/features/types";

const navItems: { id: AppView; label: string; icon: React.ReactNode }[] = [
  {
    id: "chat",
    label: "Copilot",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    )
  },
  {
    id: "constitution",
    label: "Constitution",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    )
  },
  {
    id: "history",
    label: "History",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    )
  },
];

export default function Sidebar() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  // We map "chat" to "Copilot" in UI. Other views might just reset to chat for now or do nothing.
  const activeView = state.view === "chat" || state.view === "onboarding" ? "chat" : state.view;

  return (
    <aside
      className={`
        hidden lg:flex flex-col
        w-[var(--sidebar-width)] h-screen
        bg-white border-r border-[var(--color-border-subtle)]
        fixed left-0 top-0 z-[var(--z-sticky)]
      `}
    >
      {/* Logo Area */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-2">
          {/* Blue Paper Plane Logo */}
          <div className="text-[var(--color-accent)] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M2 12L22 2L12 22L10.5 13.5L2 12Z" />
            </svg>
          </div>
          <h1 className="text-[18px] font-bold text-[var(--color-text-primary)] tracking-tight flex items-center gap-1">
            PocketPilot <span className="text-[14px]">✨</span>
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-2">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "chat" || item.id === "constitution" || item.id === "history") {
                  dispatch({ type: "SET_VIEW", view: item.id as AppView });
                } else {
                  // Fallback for demo navigation
                  dispatch({ type: "SET_VIEW", view: "chat" });
                }
              }}
              className={`
                relative w-full flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-md)]
                text-[15px] font-medium transition-all duration-[var(--duration-fast)]
                cursor-pointer
                ${
                  isActive
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
                }
              `}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--color-accent)] rounded-r-md" />
              )}
              <span className={`flex items-center justify-center ${isActive ? "text-[var(--color-accent)]" : "text-slate-400"}`}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Robot Mascot / Help Area */}
      <div className="px-4 pb-6">
        <div className="bg-white border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-4 shadow-sm relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />

          <div className="relative z-10 flex flex-col items-start gap-3">
            {/* Robot Avatar Placeholder */}
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[24px]">
              🤖
            </div>
            <div className="w-full">
              <p className="text-[13px] font-medium text-[var(--color-text-primary)] leading-tight mb-3">
                Here to help you<br/>spend smarter.
              </p>
              <button
                onClick={() => dispatch({ type: "RESET_DEMO" })}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-red-500 hover:text-red-600 transition-colors w-full p-2 bg-red-50 rounded-lg justify-center border border-red-100"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Reset App Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
