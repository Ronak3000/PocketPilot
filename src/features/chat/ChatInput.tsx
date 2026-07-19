"use client";

import React, { useState } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  onDemoPurchase: () => void;
  showDemoButton: boolean;
}

export default function ChatInput({ onSend, onDemoPurchase, showDemoButton }: ChatInputProps) {
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]/95 backdrop-blur-md px-4 py-3 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {showDemoButton && (
          <div className="mb-2 flex items-center gap-2">
            <button
              onClick={onDemoPurchase}
              className="
                text-[13px] px-3 py-1.5 rounded-full
                bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)]
                border border-[var(--color-accent)]/20
                hover:bg-[var(--color-accent)]/20 transition-colors cursor-pointer
              "
            >
              📱 Try: &quot;Can I afford the Galaxy S25 Ultra?&quot;
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask about a purchase…"
              className="
                w-full px-4 py-3 pr-12
                bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]
                rounded-xl text-[14px] text-[var(--color-text-primary)]
                placeholder:text-[var(--color-text-disabled)]
                focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]
                transition-colors
              "
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="
                absolute right-2 top-1/2 -translate-y-1/2
                p-2 rounded-lg
                text-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)]
                disabled:text-[var(--color-text-disabled)] disabled:hover:bg-transparent
                transition-colors cursor-pointer
              "
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
