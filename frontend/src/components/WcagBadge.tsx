interface WcagBadgeProps {
  criterion: string;
  name: string;
  level: "A" | "AA" | "AAA";
}

const levelStyles: Record<string, string> = {
  A: "bg-[#2D1515] text-[#F87171]",
  AA: "bg-[#2D1F0F] text-[#FBBF24]",
  AAA: "bg-[#0F2D1A] text-[#4ADE80]",
};

function criterionToSlug(criterion: string, name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function WcagBadge({ criterion, name, level }: WcagBadgeProps) {
  const slug = criterionToSlug(criterion, name);
  const href = `https://www.w3.org/WAI/WCAG21/Understanding/${slug}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${levelStyles[level] ?? levelStyles["A"]}`}
    >
      <span>SC {criterion}</span>
      <span>·</span>
      <span>Level {level}</span>
    </a>
  );
}
