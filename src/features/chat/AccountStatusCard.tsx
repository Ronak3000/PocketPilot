import type { PostPurchaseStatus } from "@/features/types";

function formatPaise(paise: number): string {
  return `₹${Math.floor(paise / 100).toLocaleString("en-IN")}`;
}

export function AccountStatusCard({ status }: { status: PostPurchaseStatus }) {
  const { productName, amountPaise, newBalancePaise, recommendations } = status;
  return (
    <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span aria-hidden="true" style={{ fontSize: 22 }}>🧾</span>
        <div>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>Purchase recorded</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
            {productName} · {formatPaise(amountPaise)}
          </p>
        </div>
      </div>
      <div style={{ background: "var(--color-bg-secondary)", borderRadius: 12, padding: 14 }}>
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 4px" }}>New Balance</p>
        <p style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
          {formatPaise(newBalancePaise)}
        </p>
      </div>
      {recommendations.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Recommendations
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {recommendations.map((recommendation) => (
              <div key={recommendation} style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "var(--color-bg-secondary)", padding: 10, borderRadius: 8 }}>
                <span aria-hidden="true" style={{ fontSize: 14 }}>💡</span>
                <p style={{ fontSize: 13, margin: 0, color: "var(--color-text-secondary)", lineHeight: 1.4 }}>{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
