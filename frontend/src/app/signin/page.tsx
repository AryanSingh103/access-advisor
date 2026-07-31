"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AppHeader, AccessibilityIcon } from "@/components/AppHeader";

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98.01 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14 0 1.54-.01 2.79-.01 3.17 0 .3.21.66.79.55A10.52 10.52 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
    </svg>
  );
}

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  return (
    <div className="min-h-screen bg-[#0F0F12] flex flex-col">
      <AppHeader />

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-[#18181B] rounded-xl border border-[#27272A] p-8 text-center">
          <div className="w-11 h-11 rounded-[10px] bg-[#534AB7] flex items-center justify-center text-white mx-auto mb-5">
            <AccessibilityIcon />
          </div>
          <h1 className="text-[18px] font-medium text-[#FAFAFA] mb-2">Sign in to AccessAdvisor</h1>
          <p className="text-[14px] text-[#71717A] mb-6 leading-relaxed">
            Connect your GitHub account to review pull requests, scan repositories, and post
            accessibility comments.
          </p>
          <button
            onClick={() => signIn("github", { callbackUrl })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#534AB7] text-white text-[14px] font-medium hover:bg-[#6358C5] transition-colors"
          >
            <GitHubIcon />
            Sign in with GitHub
          </button>
        </div>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  );
}
