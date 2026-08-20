"use client";

import Link from "next/link";
import { Suspense, use, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { AppHeader } from "@/components/AppHeader";
import { WcagBadge } from "@/components/WcagBadge";
import { analyzePR, postComments } from "@/lib/api";
import type { Violation } from "@/lib/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PRAnalysisPage({ params }: PageProps) {
  return (
    <Suspense fallback={null}>
      <PRAnalysisContent params={params} />
    </Suspense>
  );
}

function PRAnalysisContent({ params }: PageProps) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const repoParam = searchParams.get("repo") ?? "";
  const prParam = /^\d+$/.test(id) ? id : "";

  const [violations, setViolations] = useState<Violation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [posted, setPosted] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repo, setRepo] = useState(repoParam);
  const [prNumber, setPrNumber] = useState(prParam);

  const { status } = useSession();

  const handleAnalyze = async () => {
    if (status !== "authenticated") {
      setError("Please sign in with GitHub first.");
      return;
    }
    if (!repo || !prNumber) {
      setError("Please enter a repository and PR number.");
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setViolations([]);
    setPosted(null);

    try {
      const result = await analyzePR(repo, parseInt(prNumber));
      setViolations(result.violations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-run when arriving from the dashboard with repo + PR prefilled.
  const autoRan = useRef(false);
  useEffect(() => {
    if (!repoParam || !prParam || status !== "authenticated") return;
    const timer = setTimeout(() => {
      if (autoRan.current) return;
      autoRan.current = true;
      handleAnalyze();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handlePostComments = async () => {
    if (!repo || !prNumber || violations.length === 0) return;
    setIsPosting(true);
    setError(null);

    try {
      const result = await postComments(repo, parseInt(prNumber), violations);
      setPosted(result.comments_posted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comments.");
    } finally {
      setIsPosting(false);
    }
  };

  const levelOrder: Record<string, number> = { A: 0, AA: 1, AAA: 2 };
  const sorted = [...violations].sort(
    (a, b) => (levelOrder[a.level] ?? 3) - (levelOrder[b.level] ?? 3)
  );

  return (
    <div className="min-h-screen bg-[#0F0F12] flex flex-col">
      <AppHeader>
        <Link href="/dashboard" className="text-[14px] text-[#A89FF5] hover:underline">
          ← Back to dashboard
        </Link>
      </AppHeader>

      <main className="flex-1 px-8 py-6">
        {/* PR header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#0F2D1A] text-[#4ADE80]">
                Open
              </span>
              <h1 className="text-[18px] font-medium text-[#FAFAFA]">Pull Request Analysis</h1>
            </div>
            <p className="text-[14px] text-[#71717A]">
              Analyze a GitHub PR for WCAG 2.1 accessibility violations
            </p>
          </div>
          <div className="flex gap-2">
            {violations.length > 0 && (
              <button
                onClick={handlePostComments}
                disabled={isPosting}
                className="px-4 py-2 rounded-md bg-[#534AB7] text-white text-[14px] font-medium hover:bg-[#6358C5] transition-colors disabled:opacity-50"
              >
                {isPosting ? "Posting..." : posted !== null ? `${posted} posted` : "Post to GitHub"}
              </button>
            )}
          </div>
        </div>

        {/* Input form */}
        <div className="bg-[#18181B] rounded-xl p-5 border border-[#27272A] mb-6">
          <h2 className="text-[15px] font-medium text-[#FAFAFA] mb-3">PR details</h2>

          {status === "unauthenticated" ? (
            <div className="flex items-center justify-between gap-4 rounded-md bg-[#1E1B3A] px-4 py-3">
              <p className="text-[13px] text-[#A89FF5]">
                Sign in with GitHub to analyze pull requests and post review comments.
              </p>
              <button
                onClick={() => signIn("github")}
                className="px-4 py-2 rounded-md bg-[#534AB7] text-white text-[13px] font-medium hover:bg-[#6358C5] transition-colors whitespace-nowrap"
              >
                Sign in with GitHub
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="owner/repo"
                  aria-label="Repository (owner/repo)"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="px-3 py-2 text-[14px] bg-[#0F0F12] border border-[#27272A] text-[#FAFAFA] placeholder-[#71717A] rounded-md focus:outline-none focus:border-[#534AB7]"
                />
                <input
                  type="number"
                  placeholder="PR number"
                  aria-label="PR number"
                  value={prNumber}
                  onChange={(e) => setPrNumber(e.target.value)}
                  className="px-3 py-2 text-[14px] bg-[#0F0F12] border border-[#27272A] text-[#FAFAFA] placeholder-[#71717A] rounded-md focus:outline-none focus:border-[#534AB7]"
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || status === "loading"}
                className="px-5 py-2 rounded-md bg-[#534AB7] text-white text-[14px] font-medium hover:bg-[#6358C5] transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze PR"}
              </button>
              {error && <p className="mt-2 text-[13px] text-[#F87171]">{error}</p>}
            </>
          )}
        </div>

        {isAnalyzing && (
          <div aria-live="polite" className="flex items-center gap-2 text-[14px] text-[#71717A] mb-4">
            <div className="w-4 h-4 rounded-full border-2 border-[#534AB7] border-t-transparent animate-spin" aria-hidden="true" />
            Analyzing PR files against WCAG 2.1...
          </div>
        )}

        {/* Two-column layout */}
        {violations.length > 0 && (
          <div className="flex gap-6">
            {/* Left: file summary */}
            <div className="flex-1 min-w-0">
              <h2 className="text-[15px] font-medium text-[#FAFAFA] mb-3">Files analyzed</h2>
              <div className="bg-[#18181B] rounded-xl border border-[#27272A] overflow-hidden">
                {Array.from(new Set(violations.map((v) => v.file_path))).map((file) => {
                  const fileViolations = violations.filter((v) => v.file_path === file);
                  return (
                    <div
                      key={file}
                      className="px-5 py-3 border-b border-[#27272A] last:border-0 flex items-center justify-between"
                    >
                      <span className="text-[13px] font-mono text-[#D4D4D8] truncate">{file}</span>
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-[#2D1515] text-[#F87171] flex-shrink-0">
                        {fileViolations.length} issue{fileViolations.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: violation cards */}
            <div className="w-[380px] flex-shrink-0">
              <h2 className="text-[15px] font-medium text-[#FAFAFA] mb-3">
                {violations.length} violation{violations.length !== 1 ? "s" : ""} found
              </h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {sorted.map((v, i) => (
                  <div key={i} className="bg-[#18181B] rounded-xl p-4 border border-[#27272A]">
                    <div className="mb-2">
                      <WcagBadge
                        criterion={v.criterion}
                        name={v.description.slice(0, 30)}
                        level={v.level as "A" | "AA" | "AAA"}
                      />
                    </div>
                    <p className="text-[13px] text-[#D4D4D8] mb-2 leading-relaxed">{v.description}</p>
                    {v.fix && (
                      <div className="bg-[#0F0F12] rounded-md p-3">
                        <p className="text-[11px] text-[#71717A] font-medium uppercase mb-1">Fix</p>
                        <code className="text-[12px] text-[#A89FF5] whitespace-pre-wrap break-all">
                          {v.fix}
                        </code>
                      </div>
                    )}
                    <p className="text-[11px] text-[#71717A] mt-2 font-mono truncate">
                      {v.file_path}
                      {v.line_number ? `:${v.line_number}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!isAnalyzing && violations.length === 0 && !error && (
          <div className="text-center py-16 text-[14px] text-[#71717A]">
            Enter your PR details above and click Analyze PR to get started.
          </div>
        )}
      </main>
    </div>
  );
}
