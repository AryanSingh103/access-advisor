"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to an error reporting service in production
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center">
      <div className="bg-[#18181B] rounded-xl p-8 border border-[#27272A] max-w-md w-full text-center">
        <div className="w-10 h-10 rounded-full bg-[#2D1515] flex items-center justify-center mx-auto mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-[18px] font-medium text-[#FAFAFA] mb-2">Something went wrong</h2>
        <p className="text-[14px] text-[#71717A] mb-6 leading-relaxed">
          {error.message ?? "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={reset}
          className="px-5 py-2 rounded-md bg-[#534AB7] text-white text-[14px] font-medium hover:bg-[#6358C5] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
