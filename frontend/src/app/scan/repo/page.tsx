"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { WcagBadge } from "@/components/WcagBadge";
import { scanRepo } from "@/lib/api";
import type { Violation, RepoScanEvent } from "@/lib/api";

function AccessibilityIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2" />
      <path d="M12 22V12m0 0l-4 4m4-4l4 4" />
      <path d="M8 12H4m12 0h4" />
    </svg>
  );
}

interface FileResult {
  file: string;
  violations: Violation[];
  skipped?: boolean;
}

function violationCountStyle(count: number): string {
  if (count === 0) return "bg-[#0F2D1A] text-[#4ADE80]";
  if (count <= 2) return "bg-[#2D1F0F] text-[#FBBF24]";
  return "bg-[#2D1515] text-[#F87171]";
}

function buildReport(results: FileResult[]): string {
  const lines: string[] = ["AccessAdvisor — Repo Scan Report", "=".repeat(40), ""];
  for (const r of results) {
    lines.push(`FILE: ${r.file}`);
    if (r.skipped) {
      lines.push("  (skipped — could not read file)");
    } else if (r.violations.length === 0) {
      lines.push("  No violations found.");
    } else {
      for (const v of r.violations) {
        lines.push(`  [SC ${v.criterion} - ${v.criterion_name ?? ""} (Level ${v.level})]`);
        lines.push(`  ${v.description}`);
        if (v.fix) lines.push(`  Fix: ${v.fix}`);
        lines.push("");
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}

export default function RepoScanPage() {
  const [repo, setRepo] = useState("");
  const { data: session, status } = useSession();
  const token = session?.accessToken ?? "";
  const [isScanning, setIsScanning] = useState(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ index: number; total: number } | null>(null);
  const [results, setResults] = useState<FileResult[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const handleScan = async () => {
    if (!token) {
      setError("Please sign in with GitHub first.");
      return;
    }
    if (!repo.trim()) return;
    setIsScanning(true);
    setResults([]);
    setDone(false);
    setError(null);
    setCurrentFile(null);
    setProgress(null);
    setExpanded(new Set());

    try {
      for await (const event of scanRepo(repo, token)) {
        handleEvent(event);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleEvent = (event: RepoScanEvent) => {
    if (event.type === "file_start") {
      setCurrentFile(event.file ?? null);
      setProgress({ index: (event.index ?? 0) + 1, total: event.total ?? 0 });
    } else if (event.type === "file_result") {
      setResults((prev) => [
        ...prev,
        {
          file: event.file ?? "",
          violations: event.violations ?? [],
          skipped: event.skipped,
        },
      ]);
    } else if (event.type === "error") {
      setError(event.message ?? "Unknown error");
    } else if (event.type === "done") {
      setDone(true);
      setCurrentFile(null);
    }
  };

  const toggleExpanded = (file: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(file)) {
        next.delete(file);
      } else {
        next.add(file);
      }
      return next;
    });
  };

  const downloadReport = () => {
    const text = buildReport(results);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${repo.replace("/", "_")}_a11y_report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);
  const filesWithIssues = results.filter((r) => r.violations.length > 0).length;

  return (
    <div className="min-h-screen bg-[#0F0F12]">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-3 bg-[#18181B] border-b border-[#27272A]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-[22px] h-[22px] rounded-[5px] bg-[#534AB7] flex items-center justify-center text-white">
            <AccessibilityIcon />
          </div>
          <span className="text-[15px] font-medium text-[#FAFAFA]">AccessAdvisor</span>
        </Link>
        <Link href="/dashboard" className="text-[14px] text-[#A1A1AA] hover:text-[#A89FF5] transition-colors">
          Dashboard
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-12">
        <h1 className="text-[24px] font-medium text-[#FAFAFA] mb-2">Repo Scanner</h1>
        <p className="text-[14px] text-[#71717A] mb-8 leading-relaxed">
          Enter a GitHub repo and AccessAdvisor will fetch every HTML, JSX, TSX, Vue, and Svelte file
          and audit them against WCAG 2.1 — no deployed URL needed.
        </p>

        {/* Form */}
        <div className="bg-[#18181B] rounded-xl p-5 border border-[#27272A] mb-8">
          {status === "unauthenticated" ? (
            <div className="flex items-center justify-between gap-4 rounded-lg bg-[#1E1B3A] px-4 py-3">
              <p className="text-[13px] text-[#A89FF5]">
                Sign in with GitHub to scan your repositories.
              </p>
              <button
                onClick={() => signIn("github")}
                className="px-4 py-2 rounded-lg bg-[#534AB7] text-white text-[13px] font-medium hover:bg-[#6358C5] transition-colors whitespace-nowrap"
              >
                Sign in with GitHub
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-3 mb-3">
                <input
                  type="text"
                  placeholder="owner/repo"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="flex-1 px-4 py-3 text-[14px] bg-[#0F0F12] border border-[#27272A] text-[#FAFAFA] placeholder-[#52525B] rounded-lg focus:outline-none focus:border-[#534AB7]"
                />
              </div>
              <button
                onClick={handleScan}
                disabled={isScanning || !repo.trim() || status === "loading"}
                className="px-6 py-2.5 rounded-lg bg-[#534AB7] text-white text-[14px] font-medium hover:bg-[#6358C5] transition-colors disabled:opacity-50"
              >
                {isScanning ? "Scanning..." : "Scan Repo"}
              </button>
            </>
          )}
        </div>

        {/* Progress */}
        {isScanning && (
          <div className="mb-6">
            <div className="flex items-center gap-3 text-[14px] text-[#71717A] mb-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-[#534AB7] animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 rounded-full bg-[#534AB7] animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 rounded-full bg-[#534AB7] animate-bounce" />
              </div>
              {progress ? (
                <span>Scanning file {progress.index} of {progress.total}</span>
              ) : (
                <span>Fetching repo file tree...</span>
              )}
            </div>
            {currentFile && (
              <p className="text-[12px] font-mono text-[#52525B] truncate">{currentFile}</p>
            )}
            {progress && (
              <div className="mt-2 h-1 bg-[#27272A] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#534AB7] transition-all duration-300"
                  style={{ width: `${(progress.index / progress.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-[#2D1515] text-[#F87171] text-[14px] rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* Summary + Download */}
        {done && results.length > 0 && (
          <div className="bg-[#18181B] rounded-xl p-5 border border-[#27272A] mb-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[22px] font-medium text-[#FAFAFA]">{results.length}</p>
                <p className="text-[12px] text-[#71717A]">files scanned</p>
              </div>
              <div>
                <p className="text-[22px] font-medium text-[#FAFAFA]">{filesWithIssues}</p>
                <p className="text-[12px] text-[#71717A]">files with issues</p>
              </div>
              <div>
                <p className="text-[22px] font-medium text-[#FAFAFA]">{totalViolations}</p>
                <p className="text-[12px] text-[#71717A]">total violations</p>
              </div>
            </div>
            <button
              onClick={downloadReport}
              className="px-4 py-2 rounded-lg border border-[#534AB7] text-[#A89FF5] text-[13px] font-medium hover:bg-[#1E1B3A] transition-colors"
            >
              Download report
            </button>
          </div>
        )}

        {/* File cards */}
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((r) => {
              const isOpen = expanded.has(r.file);
              const count = r.violations.length;
              return (
                <div key={r.file} className="bg-[#18181B] rounded-xl border border-[#27272A] overflow-hidden">
                  <button
                    onClick={() => toggleExpanded(r.file)}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-[#27272A]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[13px] font-mono text-[#D4D4D8] truncate">{r.file}</span>
                      {r.skipped && (
                        <span className="text-[11px] text-[#52525B] flex-shrink-0">skipped</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${violationCountStyle(count)}`}>
                        {count === 0 ? "Clean" : `${count} issue${count !== 1 ? "s" : ""}`}
                      </span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#52525B"
                        strokeWidth="2"
                        className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>

                  {isOpen && count > 0 && (
                    <div className="border-t border-[#27272A] px-5 py-4 space-y-4">
                      {r.violations.map((v, i) => (
                        <div key={i}>
                          <div className="mb-1.5">
                            <WcagBadge
                              criterion={v.criterion}
                              name={v.criterion_name ?? v.description.slice(0, 30)}
                              level={v.level as "A" | "AA" | "AAA"}
                            />
                          </div>
                          {v.criterion_name && (
                            <p className="text-[13px] font-medium text-[#FAFAFA] mb-1">{v.criterion_name}</p>
                          )}
                          <p className="text-[13px] text-[#A1A1AA] leading-relaxed mb-2">{v.description}</p>
                          {v.fix && (
                            <div className="bg-[#0F0F12] rounded-lg p-3">
                              <p className="text-[10px] text-[#52525B] font-medium uppercase mb-1">Fix</p>
                              <code className="text-[12px] text-[#A89FF5] whitespace-pre-wrap break-all">{v.fix}</code>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {isOpen && count === 0 && !r.skipped && (
                    <div className="border-t border-[#27272A] px-5 py-3 text-[13px] text-[#52525B]">
                      No violations found in this file.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
