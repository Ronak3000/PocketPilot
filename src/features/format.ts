/**
 * Format paise (integer) to ₹ display string.
 * e.g., 5999900 → "₹59,999"
 */
export function formatCurrency(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString("en-IN")}`;
}

/**
 * Format paise to compact display.
 * e.g., 1500000 → "₹15K", 15000000 → "₹1.5L"
 */
export function formatCurrencyCompact(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 100_000) {
    return `₹${(rupees / 100_000).toFixed(1)}L`;
  }
  if (rupees >= 1_000) {
    return `₹${(rupees / 1_000).toFixed(rupees >= 10_000 ? 0 : 1)}K`;
  }
  return `₹${rupees.toLocaleString("en-IN")}`;
}

/**
 * Format a percentage for display.
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format an ISO date string to a short readable format.
 * e.g., "2025-07-15" → "Jul 15, 2025"
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format an ISO datetime to relative time.
 * e.g., "5 minutes ago", "2 hours ago"
 */
export function formatRelativeTime(isoDateTime: string): string {
  const now = Date.now();
  const then = new Date(isoDateTime).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
