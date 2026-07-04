import Link from "next/link";

function AccessibilityIcon() {
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
    >
      <circle cx="12" cy="5" r="2" />
      <path d="M12 22V12m0 0l-4 4m4-4l4 4" />
      <path d="M8 12H4m12 0h4" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58 0-.28-.01-1.02-.02-2-3.34.73-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 013-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F0F12] font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 bg-[#18181B] border-b border-[#27272A]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-[22px] h-[22px] rounded-[5px] bg-[#534AB7] flex items-center justify-center text-white">
            <AccessibilityIcon />
          </div>
          <span className="text-[15px] font-medium text-[#FAFAFA]">AccessAdvisor</span>
        </Link>

        <div className="flex items-center gap-6 text-[14px] text-[#A1A1AA]">
          <a href="#how-it-works" className="hover:text-[#A89FF5] transition-colors">
            How it works
          </a>
          <a href="#docs" className="hover:text-[#A89FF5] transition-colors">
            Docs
          </a>
          <a href="#pricing" className="hover:text-[#A89FF5] transition-colors">
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/api/auth/signin"
            className="text-[14px] text-[#A1A1AA] hover:text-[#A89FF5] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/api/auth/signin"
            className="px-4 py-1.5 rounded-md bg-[#534AB7] text-white text-[14px] font-medium hover:bg-[#6358C5] transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-col items-center text-center px-8 pt-20 pb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E1B3A] text-[#A89FF5] text-[13px] font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#534AB7] inline-block" />
          RAG-powered · WCAG 2.1 grounded
        </div>

        <h1 className="text-[34px] font-medium text-[#FAFAFA] leading-tight max-w-2xl mb-4">
          Catch accessibility issues before they ship
        </h1>

        <p className="text-[15px] text-[#71717A] max-w-xl leading-relaxed mb-8">
          AccessAdvisor reviews your GitHub pull requests and live URLs against the official
          WCAG 2.1 specification — citing exact criteria, not guesses. Every violation comes
          with a concrete fix.
        </p>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#534AB7] text-white text-[14px] font-medium hover:bg-[#6358C5] transition-colors"
          >
            <GitHubIcon />
            Connect GitHub repo
          </Link>
          <span className="text-[13px] text-[#52525B]">or</span>
          <Link
            href="/scan"
            className="px-5 py-2.5 rounded-md border border-[#534AB7] text-[#A89FF5] text-[14px] font-medium hover:bg-[#1E1B3A] transition-colors"
          >
            Scan a URL instead
          </Link>
        </div>
      </main>

      {/* How it works */}
      <section id="how-it-works" className="max-w-4xl mx-auto px-8 pb-24">
        <h2 className="text-[18px] font-medium text-[#FAFAFA] text-center mb-10">How it works</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-[#18181B] rounded-xl p-6 border border-[#27272A]">
            <div className="w-7 h-7 rounded-full bg-[#534AB7] flex items-center justify-center text-white text-[13px] font-medium mb-4">
              1
            </div>
            <h3 className="text-[15px] font-medium text-[#FAFAFA] mb-2">
              Connect your repo or paste a URL
            </h3>
            <p className="text-[14px] text-[#71717A] leading-relaxed">
              Link a GitHub repo for PR reviews and full repo audits, or drop in any live URL
              for instant scanning.
            </p>
          </div>

          <div className="bg-[#18181B] rounded-xl p-6 border border-[#27272A]">
            <div className="w-7 h-7 rounded-full bg-[#534AB7] flex items-center justify-center text-white text-[13px] font-medium mb-4">
              2
            </div>
            <h3 className="text-[15px] font-medium text-[#FAFAFA] mb-2">
              RAG pipeline retrieves WCAG 2.1 criteria
            </h3>
            <p className="text-[14px] text-[#71717A] leading-relaxed">
              Your code or page is matched against the real WCAG 2.1 specification using
              semantic search — no guessing, only cited standards.
            </p>
          </div>

          <div className="bg-[#18181B] rounded-xl p-6 border border-[#27272A]">
            <div className="w-7 h-7 rounded-full bg-[#534AB7] flex items-center justify-center text-white text-[13px] font-medium mb-4">
              3
            </div>
            <h3 className="text-[15px] font-medium text-[#FAFAFA] mb-2">
              Violations stream back with exact fixes
            </h3>
            <p className="text-[14px] text-[#71717A] leading-relaxed">
              Every issue is labeled with its criterion number, level (A/AA/AAA), and a
              specific line-level fix you can apply immediately.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
