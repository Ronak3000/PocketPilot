"use client";

import React, { createContext, useContext, useReducer, useEffect, type Dispatch } from "react";
import type {
  AppState,
  AppView,
  ChatMessage,
  FinancialProfile,
  MoneyConstitution,
  FutureReceipt,
  ScenarioComparison,
  ActionPlan,
  SafeToSpend,
  HistoryEntry,
} from "@/features/types";

// ── Actions ──

type AppAction =
  | { type: "SET_VIEW"; view: AppView }
  | { type: "SET_PROFILE"; profile: FinancialProfile }
  | { type: "SET_CONSTITUTION"; constitution: MoneyConstitution }
  | { type: "ADD_MESSAGES"; messages: ChatMessage[] }
  | { type: "CLEAR_MESSAGES" }
  | { type: "SET_RECEIPT"; receipt: FutureReceipt | null }
  | { type: "SET_COMPARISON"; comparison: ScenarioComparison | null }
  | { type: "SET_PLAN"; plan: ActionPlan | null }
  | { type: "SET_SAFE_TO_SPEND"; safeToSpend: SafeToSpend }
  | { type: "SET_HISTORY"; history: HistoryEntry[] }
  | { type: "COMPLETE_ONBOARDING" }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "RESET_DEMO" }
  | { type: "HYDRATE_STATE"; state: Partial<AppState> };

// ── Initial State ──

const initialState: AppState = {
  view: "onboarding",
  profile: null,
  constitution: null,
  messages: [],
  activeReceipt: null,
  activeComparison: null,
  activePlan: null,
  safeToSpend: null,
  history: [],
  isOnboarded: false,
  isDemoMode: true,
  isSidebarOpen: false,
};

// ── Reducer ──

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "HYDRATE_STATE":
      return { ...state, ...action.state };

    case "SET_VIEW":
      return { ...state, view: action.view };

    case "SET_PROFILE":
      return { ...state, profile: action.profile };

    case "SET_CONSTITUTION":
      return { ...state, constitution: action.constitution };

    case "ADD_MESSAGES": {
      const existingIds = new Set(state.messages.map((m) => m.id));
      const newMsgs = action.messages.filter((m) => !existingIds.has(m.id));
      return { ...state, messages: [...state.messages, ...newMsgs] };
    }

    case "CLEAR_MESSAGES":
      return { ...state, messages: [] };

    case "SET_RECEIPT":
      return { ...state, activeReceipt: action.receipt };

    case "SET_COMPARISON":
      return { ...state, activeComparison: action.comparison };

    case "SET_PLAN":
      return { ...state, activePlan: action.plan };

    case "SET_SAFE_TO_SPEND":
      return { ...state, safeToSpend: action.safeToSpend };

    case "SET_HISTORY":
      return { ...state, history: action.history };

    case "COMPLETE_ONBOARDING":
      return { ...state, isOnboarded: true, view: "chat" };

    case "TOGGLE_SIDEBAR":
      return { ...state, isSidebarOpen: !state.isSidebarOpen };

    case "RESET_DEMO":
      return { ...initialState };

    default:
      return state;
  }
}

// ── Context ──

const AppStateContext = createContext<AppState>(initialState);
const AppDispatchContext = createContext<Dispatch<AppAction>>(() => {});

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Hydrate from localStorage on mount (SSR-safe)
  useEffect(() => {
    const saved = localStorage.getItem("pocket-pilot-state");
    if (saved) {
      try {
        dispatch({ type: "HYDRATE_STATE", state: JSON.parse(saved) });
      } catch (e) {
        console.error("[PocketPilot] Failed to restore state:", e);
      }
    }
  }, []);

  // Persist key slices whenever they change
  useEffect(() => {
    const { view, profile, constitution, isOnboarded } = state;
    if (!isOnboarded) {
      // After a reset, clear persisted state
      localStorage.removeItem("pocket-pilot-state");
      return;
    }
    localStorage.setItem(
      "pocket-pilot-state",
      JSON.stringify({ view, profile, constitution, isOnboarded }),
    );
  }, [state.view, state.profile, state.constitution, state.isOnboarded]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  return useContext(AppStateContext);
}

export function useAppDispatch(): Dispatch<AppAction> {
  return useContext(AppDispatchContext);
}

export type { AppAction };
