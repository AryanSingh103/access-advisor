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

function FeatureIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-8 h-8 rounded-lg bg-[#534AB7] flex items-center justify-center text-white mb-3 flex-shrink-0">
      {children}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F8FB] font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-[22px] h-[22px] rounded-[5px] bg-[#534AB7] flex items-center justify-center text-white">
            <AccessibilityIcon />
          </div>
          <span className="text-[15px] font-medium text-gray-900">AccessAdvisor</span>
        </Link>

        <div className="flex items-center gap-6 text-[14px] text-gray-600">
          <a href="#how-it-works" className="hover:text-[#534AB7] transition-colors">
            How it works
          </a>
          <a href="#docs" className="hover:text-[#534AB7] transition-colors">
            Docs
          </a>
          <a href="#pricing" className="hover:text-[#534AB7] transition-colors">
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/api/auth/signin"
            className="text-[14px] text-gray-600 hover:text-[#534AB7] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/api/auth/signin"
            className="px-4 py-1.5 rounded-md bg-[#534AB7] text-white text-[14px] font-medium hover:bg-[#3C3489] transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-col items-center text-center px-8 pt-20 pb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEEDFE] text-[#3C3489] text-[13px] font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#534AB7] inline-block" />
          RAG-powered · WCAG 2.1 grounded
        </div>

        <h1 className="text-[34px] font-medium text-gray-900 leading-tight max-w-2xl mb-4">
          Catch accessibility issues before they ship
        </h1>

        <p className="text-[15px] text-gray-500 max-w-xl leading-relaxed mb-8">
          AccessAdvisor reviews your GitHub pull requests and live URLs against the official
          WCAG 2.1 specification — citing exact criteria, not guesses. Every violation comes
          with a concrete fix.
        </p>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#534AB7] text-white text-[14px] font-medium hover:bg-[#3C3489] transition-colors"
          >
            <GitHubIcon />
            Connect GitHub repo
          </Link>
          <span className="text-[13px] text-gray-400">or</span>
          <Link
            href="/scan"
            className="px-5 py-2.5 rounded-md border border-[#534AB7] text-[#534AB7] text-[14px] font-medium hover:bg-[#EEEDFE] transition-colors"
          >
            Scan a URL instead
          </Link>
        </div>
      </main>

      {/* Feature row */}
      <section
        id="how-it-works"
        className="max-w-4xl mx-auto px-8 pb-20 grid grid-cols-3 gap-8"
      >
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <FeatureIcon>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
            </svg>
          </FeatureIcon>
          <h3 className="text-[15px] font-medium text-gray-900 mb-1">PR reviews, automatically</h3>
          <p className="text-[14px] text-gray-500 leading-relaxed">
            Connect a repo and AccessAdvisor posts inline comments on accessibility issues
            directly in your pull request.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <FeatureIcon>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </FeatureIcon>
          <h3 className="text-[15px] font-medium text-gray-900 mb-1">Cited, not guessed</h3>
          <p className="text-[14px] text-gray-500 leading-relaxed">
            Every violation is grounded in retrieved WCAG 2.1 specification excerpts — no
            hallucinated criteria, no invented rules.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <FeatureIcon>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </FeatureIcon>
          <h3 className="text-[15px] font-medium text-gray-900 mb-1">Scan any live URL</h3>
          <p className="text-[14px] text-gray-500 leading-relaxed">
            Paste any URL and get a full accessibility audit streamed back in real time — no
            repo required.
          </p>
        </div>
      </section>
    </div>
  );
}
