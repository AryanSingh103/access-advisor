import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

const howItWorks = [
  {
    num: "01",
    title: "Connect your repo or paste a URL",
    body: "Link a GitHub repo for PR reviews and full repo audits, or drop in any live URL for instant scanning.",
  },
  {
    num: "02",
    title: "RAG pipeline retrieves WCAG 2.1 criteria",
    body: "Your code or page is matched against the real WCAG 2.1 specification using semantic search — no guessing, only cited standards.",
  },
  {
    num: "03",
    title: "Violations stream back with exact fixes",
    body: "Every issue is labeled with its criterion number, level (A/AA/AAA), and a specific line-level fix you can apply immediately.",
  },
];

const stats = [
  { label: "spec passages indexed", value: "650+" },
  { label: "success criteria", value: "78" },
  { label: "findings cited", value: "100%" },
];

const navLinks = [
  { href: "/dashboard", label: "PR Review" },
  { href: "/scan", label: "URL Scan" },
  { href: "/scan/repo", label: "Repo Audit" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F0F12] flex flex-col">
      <AppHeader>
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-5" aria-label="Main">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[14px] text-[#A1A1AA] hover:text-[#A89FF5] transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="#how-it-works"
              className="text-[14px] text-[#A1A1AA] hover:text-[#A89FF5] transition-colors"
            >
              How it works
            </a>
          </nav>
          <Link
            href="/signin"
            className="px-4 py-2 rounded-md bg-[#534AB7] text-white text-[13px] font-medium hover:bg-[#6358C5] transition-colors whitespace-nowrap"
          >
            Sign in with GitHub
          </Link>
        </div>
      </AppHeader>

      <main className="max-w-3xl mx-auto px-8 py-12 w-full">
        <p className="text-[13px] text-[#71717A] mb-3">
          WCAG 2.1 · RAG-grounded · zero hallucination
        </p>
        <h1 className="text-[28px] font-medium text-[#FAFAFA] mb-2 leading-tight">
          Your site looks fine.
          <br />
          <span className="text-[#A89FF5]">The lens knows better.</span>
        </h1>
        <p className="text-[14px] text-[#71717A] mb-8 leading-relaxed max-w-xl">
          AccessAdvisor reviews your pull requests, URLs and repos against the real WCAG 2.1
          specification — every finding cited down to the Success Criterion. No guesses.
        </p>

        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-md bg-[#534AB7] text-white text-[14px] font-medium hover:bg-[#6358C5] transition-colors"
          >
            Run your first audit
          </Link>
          <Link
            href="/scan"
            className="px-6 py-3 rounded-md border border-[#27272A] text-[#FAFAFA] text-[14px] font-medium hover:border-[#534AB7]/50 transition-colors"
          >
            Scan a URL instead
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[#18181B] rounded-xl p-4 border border-[#27272A]">
              <p className="text-[20px] font-medium text-[#FAFAFA]">{stat.value}</p>
              <p className="text-[12px] text-[#71717A] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </main>

      <section id="how-it-works" className="max-w-3xl mx-auto px-8 pb-16 w-full">
        <h2 className="text-[18px] font-medium text-[#FAFAFA] mb-4">How it works</h2>
        <div className="space-y-3">
          {howItWorks.map((step) => (
            <div key={step.num} className="bg-[#18181B] rounded-xl p-5 border border-[#27272A]">
              <p className="text-[12px] text-[#71717A] font-medium mb-2">{step.num}</p>
              <h3 className="text-[15px] font-medium text-[#FAFAFA] mb-1">{step.title}</h3>
              <p className="text-[14px] text-[#71717A] leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
