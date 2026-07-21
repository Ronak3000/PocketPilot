"use client";

import React, { useState } from "react";
import type { QuickFillOption } from "@/features/types";

interface QuickFillChipsProps {
  options: QuickFillOption[];
  onSelect: (value: string) => void;
}

export default function QuickFillChips({ options, onSelect }: QuickFillChipsProps) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(option: QuickFillOption) {
    setSelected(option.id);
    onSelect(option.value);
  }

  if (selected) return null; // Disappear after selection

  return (
    <div className="flex flex-wrap gap-2 mt-2 animate-fade-up">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => handleSelect(opt)}
          className="
            text-[13px] px-3 py-1.5 rounded-full
            bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]
            border border-[var(--color-border-default)]
            hover:border-[var(--color-accent)] hover:text-[var(--color-accent-text)]
            hover:bg-[var(--color-accent-subtle)]
            transition-all duration-[var(--duration-fast)] cursor-pointer
          "
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
