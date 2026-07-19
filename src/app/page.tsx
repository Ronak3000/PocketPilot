"use client";

import { useAppState } from "@/features/app-state";
import AppShell from "@/components/shell/AppShell";
import OnboardingFlow from "@/features/onboarding/OnboardingFlow";
import ChatWorkspace from "@/features/chat/ChatWorkspace";
import ConstitutionPanel from "@/features/constitution/ConstitutionPanel";
import HistoryPanel from "@/features/history/HistoryPanel";

export default function Home() {
  const state = useAppState();

  return (
    <AppShell>
      {state.view === "onboarding" && <OnboardingFlow />}
      {state.view === "chat" && <ChatWorkspace />}
      {state.view === "constitution" && <ConstitutionPanel />}
      {state.view === "history" && <HistoryPanel />}
    </AppShell>
  );
}
