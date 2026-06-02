import { PlanSlug } from "@/lib/types";
import { PLAN_COLORS, PLAN_ICONS, PLAN_LABELS } from "@/lib/constants";

export function PlanBadge({ slug }: { slug: PlanSlug }) {
  const color = PLAN_COLORS[slug];
  return (
    <span style={{
      background: `${color}18`,
      color,
      border: `1px solid ${color}40`,
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
    }}>
      {PLAN_ICONS[slug]} {PLAN_LABELS[slug]}
    </span>
  );
}
