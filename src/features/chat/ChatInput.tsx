"use client";

import React, { useState } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  showDemoButton: boolean;
}

export default function ChatInput({ onSend, showDemoButton }: ChatInputProps) {
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }

  const suggestionPills = [
    { label: "Check affordability", icon: "📊", action: () => onSend("Can I afford a new iPhone 15 for ₹79,900?") },
    { label: "Plan a purchase", icon: "🛍️", action: () => onSend("I want to buy a laptop next month for ₹85,000") },
    { label: "Track a goal", icon: "🎯", action: () => onSend("I spent ₹1,200 on groceries today") },
  ];

  return (
    <div className="bg-[var(--color-bg-primary)] px-4 py-4 lg:px-8 border-t border-[var(--color-border-subtle)] lg:border-none">
      <div className="max-w-3xl mx-auto flex flex-col items-center">
        <form onSubmit={handleSubmit} className="w-full relative flex items-center mb-4 shadow-sm">
          <div className="absolute left-4 text-[#3b82f6] text-[18px]">✨</div>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask anything about money..."
            className="
              w-full pl-12 pr-16 py-4
              bg-white border border-[var(--color-border-subtle)]
              rounded-full text-[15px] text-[var(--color-text-primary)] font-medium
              placeholder:text-[var(--color-text-muted)]
              focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-subtle)]
              transition-all
            "
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="
              absolute right-2 top-1/2 -translate-y-1/2
              w-10 h-10 rounded-full flex items-center justify-center
              bg-[var(--color-accent)] text-white shadow-md
              disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none
              hover:bg-[var(--color-accent-hover)]
              transition-all cursor-pointer
            "
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </form>

        {showDemoButton && (
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {suggestionPills.map((pill, idx) => (
              <button
                key={idx}
                onClick={pill.action}
                className="
                  flex items-center gap-2 px-4 py-2 bg-white border border-[var(--color-border-subtle)]
                  rounded-full text-[13px] font-medium text-[var(--color-text-secondary)]
                  hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:shadow-sm
                  transition-all cursor-pointer
                "
              >
                <span>{pill.icon}</span> {pill.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
