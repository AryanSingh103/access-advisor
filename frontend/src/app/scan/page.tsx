"use client";

import Link from "next/link";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { WcagBadge } from "@/components/WcagBadge";
import { scanUrl } from "@/lib/api";
import type { Violation } from "@/lib/api";

export default function ScanPage() {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [stage, setStage] = useState<"rendering" | "analyzing" | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [scannedUrl, setScannedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!url.trim()) return;

    setIsScanning(true);
    setStage(null);
    setViolations([]);
    setError(null);
    setScannedUrl(url);

    try {
      for await (const event of scanUrl(url)) {
        if (event.type === "error") {
          setError(event.error);
          break;
        } else if (event.type === "progress") {
          setStage(event.stage);
        } else if (event.type === "violation") {
          setViolations((prev) => [...prev, event]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed.");
    } finally {
      setIsScanning(false);
      setStage(null);
    }
  };

  const levelCounts = violations.reduce<Record<string, number>>((acc, v) => {
    acc[v.level] = (acc[v.level] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0F0F12]">
      <AppHeader>
        <Link href="/dashboard" className="text-[14px] text-[#A1A1AA] hover:text-[#A89FF5] transition-colors">
          Dashboard
        </Link>
      </AppHeader>

      <main className="max-w-3xl mx-auto px-8 py-12">
        <h1 className="text-[24px] font-medium text-[#FAFAFA] mb-2">URL Scanner</h1>
        <p className="text-[14px] text-[#71717A] mb-8 leading-relaxed">
          Paste any live URL and get a full WCAG 2.1 accessibility audit streamed back in real time.
        </p>

        {/* URL input */}
        <div className="flex gap-3 mb-8">
          <input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isScanning && handleScan()}
            className="flex-1 px-4 py-3 text-[15px] bg-[#18181B] border border-[#27272A] text-[#FAFAFA] placeholder-[#52525B] rounded-xl focus:outline-none focus:border-[#534AB7]"
          />
          <button
            onClick={handleScan}
            disabled={isScanning || !url.trim()}
            className="px-6 py-3 rounded-xl bg-[#534AB7] text-white text-[14px] font-medium hover:bg-[#6358C5] transition-colors disabled:opacity-50"
          >
            {isScanning ? "Scanning..." : "Scan"}
          </button>
        </div>

        {/* Loading state */}
        {isScanning && (
          <div className="flex items-center gap-3 text-[14px] text-[#71717A] mb-6">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-[#534AB7] animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 rounded-full bg-[#534AB7] animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 rounded-full bg-[#534AB7] animate-bounce" />
            </div>
            {stage === "rendering"
              ? "Rendering page in headless browser..."
              : stage === "analyzing"
                ? "Analyzing page against WCAG 2.1..."
                : "Starting scan..."}
            {violations.length > 0 && (
              <span className="text-[#A89FF5]">{violations.length} found so far</span>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-[#2D1515] text-[#F87171] text-[14px] rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        {scannedUrl && !isScanning && violations.length > 0 && (
          <>
            {/* Summary */}
            <div className="bg-[#18181B] rounded-xl p-5 border border-[#27272A] mb-6">
              <p className="text-[13px] text-[#52525B] mb-1 font-mono truncate">{scannedUrl}</p>
              <div className="flex items-center gap-4 mt-2">
                <div>
                  <p className="text-[22px] font-medium text-[#FAFAFA]">{violations.length}</p>
                  <p className="text-[12px] text-[#71717A]">total issues</p>
                </div>
                {Object.entries(levelCounts).map(([level, count]) => (
                  <div key={level}>
                    <p className="text-[22px] font-medium text-[#FAFAFA]">{count}</p>
                    <p className="text-[12px] text-[#71717A]">Level {level}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Violation cards */}
            <div className="space-y-3">
              {violations.map((v, i) => (
                <div key={i} className="bg-[#18181B] rounded-xl p-5 border border-[#27272A]">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <WcagBadge
                      criterion={v.criterion}
                      name={v.criterion_name ?? v.description.slice(0, 30)}
                      level={v.level as "A" | "AA" | "AAA"}
                    />
                  </div>
                  {v.criterion_name && (
                    <h3 className="text-[14px] font-medium text-[#FAFAFA] mb-1">{v.criterion_name}</h3>
                  )}
                  <p className="text-[14px] text-[#A1A1AA] leading-relaxed mb-3">{v.description}</p>
                  {v.fix && (
                    <div className="bg-[#0F0F12] rounded-lg p-3">
                      <p className="text-[11px] text-[#52525B] font-medium uppercase mb-1.5">Recommended fix</p>
                      <code className="text-[12px] text-[#A89FF5] whitespace-pre-wrap break-all">
                        {v.fix}
                      </code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {scannedUrl && !isScanning && violations.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="w-10 h-10 rounded-full bg-[#0F2D1A] flex items-center justify-center mx-auto mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-[15px] font-medium text-[#FAFAFA]">No violations found</p>
            <p className="text-[14px] text-[#71717A] mt-1">This page passed all retrieved WCAG 2.1 checks.</p>
          </div>
        )}
      </main>
    </div>
  );
}
