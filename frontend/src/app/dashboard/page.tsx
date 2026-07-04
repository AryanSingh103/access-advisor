"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

interface Repo {
  name: string;
  issueCount: number;
}

interface PullRequest {
  id: string;
  number: number;
  title: string;
  state: "open" | "merged";
  filesChanged: number;
  timeAgo: string;
  status: "issues" | "warning" | "passed";
  statusCount?: number;
}

const MOCK_REPOS: Repo[] = [
  { name: "acme-corp/web-app", issueCount: 3 },
  { name: "acme-corp/design-system", issueCount: 0 },
];

const MOCK_PRS: PullRequest[] = [
  {
    id: "1",
    number: 142,
    title: "Add new checkout form flow",
    state: "open",
    filesChanged: 8,
    timeAgo: "2 hours ago",
    status: "issues",
    statusCount: 3,
  },
  {
    id: "2",
    number: 141,
    title: "Refactor navigation component",
    state: "open",
    filesChanged: 3,
    timeAgo: "5 hours ago",
    status: "warning",
    statusCount: 1,
  },
  {
    id: "3",
    number: 140,
    title: "Update hero section copy",
    state: "merged",
    filesChanged: 1,
    timeAgo: "1 day ago",
    status: "passed",
  },
];

function AccessibilityIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2" />
      <path d="M12 22V12m0 0l-4 4m4-4l4 4" />
      <path d="M8 12H4m12 0h4" />
    </svg>
  );
}

function StatusPill({ status, count }: { status: PullRequest["status"]; count?: number }) {
  if (status === "issues") {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2D1515] text-[#F87171]">
        {count} issue{count !== 1 ? "s" : ""}
      </span>
    );
  }
  if (status === "warning") {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2D1F0F] text-[#FBBF24]">
        {count} warning
      </span>
    );
  }
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0F2D1A] text-[#4ADE80]">
      Passed
    </span>
  );
}

export default function DashboardPage() {
  const [selectedRepo, setSelectedRepo] = useState(MOCK_REPOS[0]);
  const [prInput, setPrInput] = useState("");
  const [repoInput, setRepoInput] = useState("");

  const { data: session } = useSession();
  const userName = session?.user?.name ?? session?.user?.email ?? "user";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#0F0F12] flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-[#18181B] border-b border-[#27272A]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-[22px] h-[22px] rounded-[5px] bg-[#534AB7] flex items-center justify-center text-white">
            <AccessibilityIcon />
          </div>
          <span className="text-[15px] font-medium text-[#FAFAFA]">AccessAdvisor</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[14px] text-[#A1A1AA]">{userName}</span>
          <div className="w-7 h-7 rounded-full bg-[#1E1B3A] flex items-center justify-center text-[#A89FF5] text-xs font-medium">
            {userInitial}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-[13px] text-[#A1A1AA] hover:text-[#A89FF5] transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-[200px] bg-[#18181B] border-r border-[#27272A] flex flex-col py-4">
          <div className="px-4 mb-2">
            <p className="text-[11px] font-medium text-[#52525B] uppercase tracking-wide mb-2">Repos</p>
            {MOCK_REPOS.map((repo) => (
              <button
                key={repo.name}
                onClick={() => setSelectedRepo(repo)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left text-[13px] mb-0.5 transition-colors ${
                  selectedRepo.name === repo.name
                    ? "bg-[#1E1B3A] text-[#A89FF5] font-medium"
                    : "text-[#A1A1AA] hover:bg-[#27272A]"
                }`}
              >
                <span className="truncate">{repo.name.split("/")[1]}</span>
                {repo.issueCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#2D1515] text-[#F87171]">
                    {repo.issueCount}
                  </span>
                )}
              </button>
            ))}
            <button className="w-full text-left px-2 py-1.5 text-[13px] text-[#A89FF5] hover:bg-[#1E1B3A] rounded-md transition-colors mt-1">
              + Add repo
            </button>
          </div>

          <div className="px-4 mt-4">
            <p className="text-[11px] font-medium text-[#52525B] uppercase tracking-wide mb-2">Tools</p>
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
            <a
              href="#"
              className="block px-2 py-1.5 rounded-md text-[13px] text-[#A1A1AA] hover:bg-[#27272A] transition-colors"
            >
              History
            </a>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-8 py-6 max-w-4xl">
          <h2 className="text-[18px] font-medium text-[#FAFAFA] mb-4">{selectedRepo.name}</h2>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "PRs reviewed", value: "12" },
              { label: "Open issues", value: "3" },
              { label: "Issues fixed", value: "28" },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#18181B] rounded-xl p-4 border border-[#27272A]">
                <p className="text-[13px] text-[#71717A] mb-1">{stat.label}</p>
                <p className="text-[24px] font-medium text-[#FAFAFA]">{stat.value}</p>
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
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                className="flex-1 px-3 py-2 text-[14px] bg-[#0F0F12] border border-[#27272A] text-[#FAFAFA] placeholder-[#52525B] rounded-md focus:outline-none focus:border-[#534AB7]"
              />
              <input
                type="number"
                placeholder="PR number"
                value={prInput}
                onChange={(e) => setPrInput(e.target.value)}
                className="w-32 px-3 py-2 text-[14px] bg-[#0F0F12] border border-[#27272A] text-[#FAFAFA] placeholder-[#52525B] rounded-md focus:outline-none focus:border-[#534AB7]"
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
            <h3 className="text-[15px] font-medium text-[#FAFAFA] mb-3">Recent pull requests</h3>
            <div className="space-y-2">
              {MOCK_PRS.map((pr) => (
                <Link
                  key={pr.id}
                  href={`/dashboard/pr/${pr.id}`}
                  className="flex items-center justify-between bg-[#18181B] rounded-xl px-5 py-4 border border-[#27272A] hover:border-[#534AB7]/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        pr.state === "open" ? "bg-green-400" : "bg-[#534AB7]"
                      }`}
                    />
                    <div>
                      <p className="text-[14px] font-medium text-[#FAFAFA]">{pr.title}</p>
                      <p className="text-[13px] text-[#52525B] mt-0.5">
                        #{pr.number} · {pr.timeAgo} · {pr.filesChanged} files changed
                      </p>
                    </div>
                  </div>
                  <StatusPill status={pr.status} count={pr.statusCount} />
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
