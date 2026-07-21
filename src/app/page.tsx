"use client";

import { useEffect, useRef } from "react";
import { useAppState } from "@/features/app-state";
import AppShell from "@/components/shell/AppShell";
import OnboardingFlow from "@/features/onboarding/OnboardingFlow";
import ChatWorkspace from "@/features/chat/ChatWorkspace";
import ConstitutionPanel from "@/features/constitution/ConstitutionPanel";
import HistoryPanel from "@/features/history/HistoryPanel";
import { useState } from "react";

export default function Home() {
  const state = useAppState();
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const prevView = useRef(state.view);

  // Increment the refresh key every time the user navigates TO the history view
  useEffect(() => {
    if (state.view === "history" && prevView.current !== "history") {
      setHistoryRefreshKey((k) => k + 1);
    }
    prevView.current = state.view;
  }, [state.view]);

  return (
    <AppShell>
      {state.view === "onboarding" && <OnboardingFlow />}

      {/* ChatWorkspace stays mounted after onboarding so useChat state (messages)
          is never lost when switching to History or Constitution view. */}
      {state.isOnboarded && (
        <div className={state.view === "chat" ? "" : "hidden"}>
          <ChatWorkspace />
        </div>
      )}

      {state.view === "constitution" && <ConstitutionPanel />}
      {state.view === "history" && <HistoryPanel refreshKey={historyRefreshKey} />}
    </AppShell>
  );
}
