interface WcagBadgeProps {
  criterion: string;
  name: string;
  level: "A" | "AA" | "AAA";
}

const levelStyles: Record<string, string> = {
  A: "bg-[#FCEBEB] text-[#A32D2D]",
  AA: "bg-[#FAEEDA] text-[#854F0B]",
  AAA: "bg-[#EAF3DE] text-[#3B6D11]",
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
