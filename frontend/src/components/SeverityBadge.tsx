import { humanizeAlertType } from "../utils/format.js";

const TONE: Record<string, string> = {
  critical: "critical",
  warning: "warning",
  info: "info",
};

// Severity is never conveyed by colour alone: the badge always carries the
// alert name (or an explicit "no alerts") as text.
export default function SeverityBadge({
  severity,
  type,
}: {
  severity?: string | null;
  type?: string | null;
}) {
  if (!severity || !type) return <span className="badge ok">no alerts</span>;
  return <span className={`badge ${TONE[severity] ?? "info"}`}>{humanizeAlertType(type)}</span>;
}
