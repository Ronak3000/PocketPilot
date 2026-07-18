"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppState, useAppDispatch } from "@/features/app-state";
import { pocketPilotClient } from "@/mocks/adapter";
import { demoChatMessages, demoChatSequence } from "@/mocks/demo-chat-flow";
import type { ChatMessage } from "@/features/types";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

export default function ChatWorkspace() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [demoStep, setDemoStep] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.messages]);

  // Initialize with greeting
  useEffect(() => {
    if (state.messages.length === 0) {
      const greetingMsgs = demoChatMessages["greeting"];
      dispatch({ type: "ADD_MESSAGES", messages: greetingMsgs });
    }
  }, [dispatch, state.messages.length]);

  // Load receipt + scenarios into state when they appear
  useEffect(() => {
    const hasReceipt = state.messages.some((m) => m.type === "receipt");
    if (hasReceipt && !state.activeReceipt) {
      pocketPilotClient.getReceipt("scenario-buy-now-001").then((receipt) => {
        dispatch({ type: "SET_RECEIPT", receipt });
      });
    }
    const hasScenarios = state.messages.some((m) => m.type === "scenarios");
    if (hasScenarios && !state.activeComparison) {
      pocketPilotClient.getScenarios("extracted-001").then((comparison) => {
        dispatch({ type: "SET_COMPARISON", comparison });
      });
    }
    const hasPlan = state.messages.some((m) => m.type === "safe-plan");
    if (hasPlan && !state.activePlan) {
      pocketPilotClient.getSafePlan("receipt-001").then((plan) => {
        dispatch({ type: "SET_PLAN", plan });
      });
    }
  }, [state.messages, state.activeReceipt, state.activeComparison, state.activePlan, dispatch]);

  const advanceDemo = useCallback(async () => {
    if (demoStep >= demoChatSequence.length) return;

    const currentStepName = demoChatSequence[demoStep];
    const msgs = demoChatMessages[currentStepName];

    // User messages appear immediately
    const isUserStep = msgs.some((m) => m.role === "user");

    if (isUserStep) {
      dispatch({ type: "ADD_MESSAGES", messages: msgs });
      setDemoStep((s) => s + 1);
      // Auto-advance to assistant response after user message
      setTimeout(async () => {
        const nextStep = demoStep + 1;
        if (nextStep < demoChatSequence.length) {
          const nextStepName = demoChatSequence[nextStep];
          const nextMsgs = demoChatMessages[nextStepName];

          // If it's the "analyzing" step, show loading then auto-advance
          if (nextStepName === "analyzing") {
            setIsTyping(true);
            dispatch({ type: "ADD_MESSAGES", messages: nextMsgs });
            setDemoStep(nextStep + 1);
            setTimeout(() => {
              setIsTyping(false);
              // Show receipt
              const receiptStep = nextStep + 1;
              if (receiptStep < demoChatSequence.length) {
                const receiptStepName = demoChatSequence[receiptStep];
                dispatch({ type: "ADD_MESSAGES", messages: demoChatMessages[receiptStepName] });
                setDemoStep(receiptStep + 1);
                // Auto-show scenarios
                setTimeout(() => {
                  const scenarioStep = receiptStep + 1;
                  if (scenarioStep < demoChatSequence.length) {
                    dispatch({ type: "ADD_MESSAGES", messages: demoChatMessages[demoChatSequence[scenarioStep]] });
                    setDemoStep(scenarioStep + 1);
                    // Auto-show safe plan
                    setTimeout(() => {
                      const planStep = scenarioStep + 1;
                      if (planStep < demoChatSequence.length) {
                        dispatch({ type: "ADD_MESSAGES", messages: demoChatMessages[demoChatSequence[planStep]] });
                        setDemoStep(planStep + 1);
                      }
                    }, 800);
                  }
                }, 800);
              }
            }, 2000);
          } else {
            setIsTyping(true);
            setTimeout(() => {
              setIsTyping(false);
              dispatch({ type: "ADD_MESSAGES", messages: nextMsgs });
              setDemoStep(nextStep + 1);
            }, 600);
          }
        }
      }, 300);
    } else {
      // For non-user steps triggered externally
      dispatch({ type: "ADD_MESSAGES", messages: msgs });
      setDemoStep((s) => s + 1);
    }
  }, [demoStep, dispatch]);

  function handleSend(text: string) {
    // During demo: advance the scripted flow
    if (demoStep < demoChatSequence.length) {
      advanceDemo();
    } else {
      // Post-demo: just echo user message
      const userMsg: ChatMessage = {
        id: `msg-user-${Date.now()}`,
        role: "user",
        type: "text",
        content: text,
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: "ADD_MESSAGES", messages: [userMsg] });
    }
  }

  function handleQuickFill() {
    advanceDemo();
  }

  function handleDemoPurchase() {
    // Simulate the "ask about phone" step
    if (demoStep === 1) {
      advanceDemo();
    }
  }

  return (
    <div className="flex flex-col h-screen lg:h-screen">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 space-y-4"
      >
        <div className="max-w-2xl mx-auto space-y-4">
          {state.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              receipt={state.activeReceipt}
              comparison={state.activeComparison}
              plan={state.activePlan}
              safeToSpend={state.safeToSpend}
              onQuickFill={handleQuickFill}
            />
          ))}

          {isTyping && (
            <div className="flex items-center gap-1.5 px-4 py-3 animate-fade-in">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" style={{ animation: "pp-dot-bounce 1.4s ease-in-out 0s infinite" }} />
                <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" style={{ animation: "pp-dot-bounce 1.4s ease-in-out 0.2s infinite" }} />
                <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" style={{ animation: "pp-dot-bounce 1.4s ease-in-out 0.4s infinite" }} />
              </div>
              <span className="text-[13px] text-[var(--color-text-muted)] ml-1">PocketPilot is thinking…</span>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onDemoPurchase={handleDemoPurchase}
        showDemoButton={demoStep === 1}
      />
    </div>
  );
}
