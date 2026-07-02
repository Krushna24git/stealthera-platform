import type { ReactNode } from "react";

interface StatTileProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "critical" | "warning" | "ok";
}

export default function StatTile({ label, value, sub, tone = "default" }: StatTileProps) {
  return (
    <div className={`tile${tone !== "default" ? ` tile-${tone}` : ""}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub !== undefined && <div className="tile-sub">{sub}</div>}
    </div>
  );
}
