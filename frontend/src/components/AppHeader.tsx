import Link from "next/link";

export function AccessibilityIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="2" />
      <path d="M12 22V12m0 0l-4 4m4-4l4 4" />
      <path d="M8 12H4m12 0h4" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="w-[22px] h-[22px] rounded-[5px] bg-[#534AB7] flex items-center justify-center text-white">
        <AccessibilityIcon />
      </div>
      <span className="text-[15px] font-medium text-[#FAFAFA]">AccessAdvisor</span>
    </Link>
  );
}

export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-[#18181B] border-b border-[#27272A]">
      <Logo />
      {children}
    </header>
  );
}
