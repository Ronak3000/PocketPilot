"use client";

import React, { useState, useRef, useId } from "react";

interface CurrencyInputProps {
  value: number; // paise
  onChange: (paise: number) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  min?: number;
  max?: number;
  className?: string;
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
  label,
  id,
  className = "",
}: CurrencyInputProps) {
  const [localValue, setLocalValue] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive display value: if user is actively typing use local, otherwise derive from prop
  const displayValue = localValue !== null
    ? localValue
    : value > 0
      ? (value / 100).toLocaleString("en-IN")
      : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (raw === "") {
      setLocalValue("");
      onChange(0);
      return;
    }
    const rupees = parseInt(raw, 10);
    if (isNaN(rupees)) return;
    const paise = rupees * 100;
    setLocalValue(rupees.toLocaleString("en-IN"));
    onChange(paise);
  }

  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] font-medium text-[15px]">
          ₹
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="
            w-full pl-8 pr-4 py-2.5
            bg-[var(--color-input-bg)] border border-[var(--color-input-border)]
            rounded-[var(--radius-md)]
            text-[15px] font-mono-numbers text-[var(--color-text-primary)]
            placeholder:text-[var(--color-text-disabled)]
            focus:outline-none focus:border-[var(--color-input-focus)] focus:ring-1 focus:ring-[var(--color-input-focus)]
            transition-colors duration-[var(--duration-fast)]
          "
        />
      </div>
    </div>
  );
}
