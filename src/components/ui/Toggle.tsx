"use client";

import React, { useId } from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export default function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  id,
}: ToggleProps) {
  const generatedId = useId();
  const toggleId = id || generatedId;

  return (
    <label
      htmlFor={toggleId}
      className={`
        inline-flex items-center gap-2.5
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <button
        id={toggleId}
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
          relative inline-flex h-5 w-9 items-center rounded-full
          transition-colors duration-[var(--duration-normal)] ease-[var(--ease-out)]
          focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2
          ${
            checked
              ? "bg-[var(--color-accent)]"
              : "bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]"
          }
        `}
      >
        <span
          className={`
            inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm
            transition-transform duration-[var(--duration-normal)] ease-[var(--ease-spring)]
            ${checked ? "translate-x-[18px]" : "translate-x-[3px]"}
          `}
        />
      </button>
      {label && (
        <span className="text-[14px] text-[var(--color-text-secondary)]">
          {label}
        </span>
      )}
    </label>
  );
}
