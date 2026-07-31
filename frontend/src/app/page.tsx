import Link from "next/link";
import "./landing.css";
import { AppHeader } from "@/components/AppHeader";
import { SynapseField } from "@/components/landing/SynapseField";
import { CursorLight } from "@/components/landing/CursorLight";
import { LensDemo } from "@/components/landing/LensDemo";
import { CountUp } from "@/components/landing/CountUp";

export default function LandingPage() {
  return (
    <div className="aa-landing">
      <SynapseField />
      <div className="aa-aurora aa-aurora-a" aria-hidden="true" />
      <div className="aa-aurora aa-aurora-b" aria-hidden="true" />
      <div className="aa-grid" aria-hidden="true" />
      <CursorLight />

      <AppHeader>
        <div className="flex items-center gap-6">
          <nav className="aa-nav" aria-label="Main">
            <Link href="/dashboard">
              <span className="aa-idx">01</span>PR Review
            </Link>
            <Link href="/scan">
              <span className="aa-idx">02</span>URL Scan
            </Link>
            <Link href="/scan/repo">
              <span className="aa-idx">03</span>Repo Audit
            </Link>
            <a href="#how-it-works">
              <span className="aa-idx">04</span>How it works
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

      <main className="aa-main">
        <section>
          <p className="aa-eyebrow">WCAG 2.1 · RAG-grounded · zero hallucination</p>
          <h1 className="aa-h1">
            <span className="aa-line">Your site looks fine.</span>
            <span className="aa-line aa-accent">The lens knows better.</span>
          </h1>
          <p className="aa-sub">
            AccessAdvisor reviews your pull requests, URLs and repos against the{" "}
            <b>real WCAG 2.1 specification</b> — every finding cited down to the Success
            Criterion. No guesses.
          </p>
          <div className="aa-cta-row">
            <Link href="/dashboard" className="aa-btn-primary">
              <span className="aa-shine" aria-hidden="true" />
              Run your first audit <span className="aa-arrow">→</span>
            </Link>
            <Link href="/scan" className="aa-btn-ghost">
              Scan a URL instead
            </Link>
          </div>
          <div className="aa-stats">
            <div className="aa-stat">
              <div className="aa-num">
                <CountUp to={650} />
                <em>+</em>
              </div>
              <div className="aa-lbl">spec passages indexed</div>
            </div>
            <div className="aa-stat">
              <div className="aa-num">
                <CountUp to={78} />
              </div>
              <div className="aa-lbl">success criteria</div>
            </div>
            <div className="aa-stat">
              <div className="aa-num">
                <CountUp to={100} />
                <em>%</em>
              </div>
              <div className="aa-lbl">findings cited</div>
            </div>
          </div>
        </section>

        <LensDemo />
      </main>

      <section id="how-it-works" className="aa-how">
        <h2>How it works</h2>
        <div className="aa-how-grid">
          <div className="aa-how-card">
            <div className="aa-how-num">01</div>
            <h3>Connect your repo or paste a URL</h3>
            <p>
              Link a GitHub repo for PR reviews and full repo audits, or drop in any live URL
              for instant scanning.
            </p>
          </div>
          <div className="aa-how-card">
            <div className="aa-how-num">02</div>
            <h3>RAG pipeline retrieves WCAG 2.1 criteria</h3>
            <p>
              Your code or page is matched against the real WCAG 2.1 specification using
              semantic search — no guessing, only cited standards.
            </p>
          </div>
          <div className="aa-how-card">
            <div className="aa-how-num">03</div>
            <h3>Violations stream back with exact fixes</h3>
            <p>
              Every issue is labeled with its criterion number, level (A/AA/AAA), and a
              specific line-level fix you can apply immediately.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
