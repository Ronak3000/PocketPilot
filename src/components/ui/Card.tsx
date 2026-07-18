"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  onClick?: () => void;
}

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export default function Card({
  children,
  header,
  className = "",
  padding = "md",
  hover = false,
  onClick,
}: CardProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={`
        bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)]
        rounded-[var(--radius-lg)] overflow-hidden
        transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]
        ${hover ? "hover:border-[var(--color-border-default)] hover:shadow-[var(--shadow-md)] cursor-pointer" : ""}
        ${onClick ? "text-left w-full" : ""}
        ${className}
      `}
    >
      {header && (
        <div className="px-5 py-3 border-b border-[var(--color-border-subtle)]">
          {header}
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
    </Component>
  );
}
