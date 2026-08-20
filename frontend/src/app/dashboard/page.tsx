"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { AppHeader } from "@/components/AppHeader";
import { listPullRequests, listRepos, type PullRequest, type Repo } from "@/lib/api";

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const units: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secs, label] of units) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count !== 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const userName = session?.user?.name ?? session?.user?.email ?? "user";
  const userInitial = userName.charAt(0).toUpperCase();

  const [repos, setRepos] = useState<Repo[]>([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [prsLoading, setPrsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prInput, setPrInput] = useState("");
  const [repoInput, setRepoInput] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    (async () => {
      setReposLoading(true);
      try {
        const data = await listRepos();
        if (cancelled) return;
        setRepos(data);
        if (data.length > 0) setSelectedRepo(data[0]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load repos.");
      } finally {
        if (!cancelled) setReposLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (!selectedRepo) return;
    let cancelled = false;

    (async () => {
      setPrsLoading(true);
      try {
        const data = await listPullRequests(selectedRepo.full_name);
        if (!cancelled) setPrs(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load PRs.");
      } finally {
        if (!cancelled) setPrsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedRepo]);

  return (
    <div className="min-h-screen bg-[#0F0F12] flex flex-col">
      <AppHeader>
        <div className="flex items-center gap-3">
          <span className="text-[14px] text-[#A1A1AA]">{userName}</span>
          <div className="w-7 h-7 rounded-full bg-[#1E1B3A] flex items-center justify-center text-[#A89FF5] text-xs font-medium" aria-hidden="true">
            {userInitial}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-[13px] text-[#A1A1AA] hover:text-[#A89FF5] transition-colors"
          >
            Sign out
          </button>
        </div>
      </AppHeader>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-[220px] bg-[#18181B] border-r border-[#27272A] flex flex-col py-4">
          <div className="px-4 mb-2">
            <p className="text-[11px] font-medium text-[#71717A] uppercase tracking-wide mb-2">Repos</p>
            {reposLoading && (
              <p className="px-2 py-1.5 text-[13px] text-[#71717A]">Loading repos...</p>
            )}
            {!reposLoading && repos.length === 0 && (
              <p className="px-2 py-1.5 text-[13px] text-[#71717A]">No repos found.</p>
            )}
            {repos.map((repo) => (
              <button
                key={repo.full_name}
                onClick={() => setSelectedRepo(repo)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left text-[13px] mb-0.5 transition-colors ${
                  selectedRepo?.full_name === repo.full_name
                    ? "bg-[#1E1B3A] text-[#A89FF5] font-medium"
                    : "text-[#A1A1AA] hover:bg-[#27272A]"
                }`}
              >
                <span className="truncate">{repo.name}</span>
              </button>
            ))}
          </div>

          <div className="px-4 mt-4">
            <p className="text-[11px] font-medium text-[#71717A] uppercase tracking-wide mb-2">Tools</p>
            <Link
              href="/scan"
              className="block px-2 py-1.5 rounded-md text-[13px] text-[#A1A1AA] hover:bg-[#27272A] transition-colors"
            >
              URL Scanner
            </Link>
            <Link
              href="/scan/repo"
              className="block px-2 py-1.5 rounded-md text-[13px] text-[#A1A1AA] hover:bg-[#27272A] transition-colors"
            >
              Repo Scanner
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-8 py-6 max-w-4xl">
          <h2 className="text-[18px] font-medium text-[#FAFAFA] mb-4">
            {selectedRepo?.full_name ?? "Select a repository"}
          </h2>

          {error && (
            <div className="bg-[#2D1515] text-[#F87171] text-[14px] rounded-xl px-4 py-3 mb-6">
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Repositories", value: reposLoading ? "—" : String(repos.length) },
              { label: "Open PRs", value: prsLoading || !selectedRepo ? "—" : String(prs.length) },
              {
                label: "Last updated",
                value: selectedRepo ? timeAgo(selectedRepo.updated_at) : "—",
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#18181B] rounded-xl p-4 border border-[#27272A]">
                <p className="text-[13px] text-[#71717A] mb-1">{stat.label}</p>
                <p className="text-[20px] font-medium text-[#FAFAFA]">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Analyze PR form */}
          <div className="bg-[#18181B] rounded-xl p-5 border border-[#27272A] mb-6">
            <h3 className="text-[15px] font-medium text-[#FAFAFA] mb-3">Analyze a pull request</h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="owner/repo"
                aria-label="Repository (owner/repo)"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                className="flex-1 px-3 py-2 text-[14px] bg-[#0F0F12] border border-[#27272A] text-[#FAFAFA] placeholder-[#71717A] rounded-md focus:outline-none focus:border-[#534AB7]"
              />
              <input
                type="number"
                placeholder="PR number"
                aria-label="PR number"
                value={prInput}
                onChange={(e) => setPrInput(e.target.value)}
                className="w-32 px-3 py-2 text-[14px] bg-[#0F0F12] border border-[#27272A] text-[#FAFAFA] placeholder-[#71717A] rounded-md focus:outline-none focus:border-[#534AB7]"
              />
              <Link
                href={`/dashboard/pr/${prInput}?repo=${encodeURIComponent(repoInput)}`}
                aria-disabled={!repoInput.trim() || !prInput.trim()}
                className={`px-4 py-2 rounded-md bg-[#534AB7] text-white text-[14px] font-medium hover:bg-[#6358C5] transition-colors whitespace-nowrap ${
                  !repoInput.trim() || !prInput.trim() ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Analyze PR
              </Link>
            </div>
          </div>

          {/* PR list */}
          <div>
            <h3 className="text-[15px] font-medium text-[#FAFAFA] mb-3">Open pull requests</h3>
            {prsLoading && (
              <p className="text-[14px] text-[#71717A] py-4">Loading pull requests...</p>
            )}
            {!prsLoading && selectedRepo && prs.length === 0 && (
              <p className="text-[14px] text-[#71717A] py-4">
                No open pull requests in {selectedRepo.name}.
              </p>
            )}
            <div className="space-y-2">
              {prs.map((pr) => (
                <Link
                  key={pr.number}
                  href={`/dashboard/pr/${pr.number}?repo=${encodeURIComponent(selectedRepo?.full_name ?? "")}`}
                  className="flex items-center justify-between bg-[#18181B] rounded-xl px-5 py-4 border border-[#27272A] hover:border-[#534AB7]/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        pr.draft ? "bg-[#71717A]" : "bg-green-400"
                      }`}
                    />
                    <div>
                      <p className="text-[14px] font-medium text-[#FAFAFA]">{pr.title}</p>
                      <p className="text-[13px] text-[#71717A] mt-0.5">
                        #{pr.number} · {timeAgo(pr.updated_at)} · by {pr.user.login}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1E1B3A] text-[#A89FF5]">
                    Analyze
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
