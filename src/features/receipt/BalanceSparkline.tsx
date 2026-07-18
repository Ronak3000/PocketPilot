"use client";

import type { ProjectedBalance } from "@/features/types";
import { formatCurrency } from "@/features/format";

interface BalanceSparklineProps {
  balances: ProjectedBalance[];
  floorPaise: number;
  className?: string;
}

export default function BalanceSparkline({
  balances,
  floorPaise,
  className = "",
}: BalanceSparklineProps) {
  if (balances.length === 0) return null;

  const width = 600;
  const height = 160;
  const padding = { top: 16, right: 16, bottom: 24, left: 16 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = balances.map((b) => b.balancePaise);
  const minVal = Math.min(...values, floorPaise) * 0.9;
  const maxVal = Math.max(...values) * 1.1;
  const range = maxVal - minVal || 1;

  function x(i: number) {
    return padding.left + (i / (balances.length - 1)) * chartW;
  }

  function y(val: number) {
    return padding.top + chartH - ((val - minVal) / range) * chartH;
  }

  // Build path
  const linePath = balances
    .map((b, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(b.balancePaise).toFixed(1)}`)
    .join(" ");

  // Area fill path
  const areaPath = `${linePath} L ${x(balances.length - 1).toFixed(1)} ${(padding.top + chartH).toFixed(1)} L ${padding.left} ${(padding.top + chartH).toFixed(1)} Z`;

  // Floor line
  const floorY = y(floorPaise);

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label="Projected balance chart"
      >
        {/* Area gradient fill */}
        <defs>
          <linearGradient id="balance-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Area */}
        <path d={areaPath} fill="url(#balance-gradient)" />

        {/* Floor line */}
        <line
          x1={padding.left}
          y1={floorY}
          x2={width - padding.right}
          y2={floorY}
          stroke="var(--color-breach)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.5"
        />
        <text
          x={width - padding.right}
          y={floorY - 4}
          textAnchor="end"
          fontSize="9"
          fill="var(--color-breach)"
          opacity="0.7"
        >
          Floor {formatCurrency(floorPaise)}
        </text>

        {/* Balance line */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Start / End labels */}
        <text x={padding.left} y={height - 4} fontSize="9" fill="var(--color-text-muted)">
          Today
        </text>
        <text x={width - padding.right} y={height - 4} textAnchor="end" fontSize="9" fill="var(--color-text-muted)">
          +{balances.length} days
        </text>
      </svg>
    </div>
  );
}
