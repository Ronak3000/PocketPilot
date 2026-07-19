"use client";

import React, { createContext, useContext, useReducer, type Dispatch } from "react";
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
  | { type: "RESET_DEMO" };

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
