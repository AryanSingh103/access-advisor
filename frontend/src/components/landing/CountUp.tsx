"use client";

import { useEffect, useRef } from "react";

export function CountUp({ to, delay = 2000 }: { to: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = String(to);
      return;
    }

    let rafId = 0;
    const timer = setTimeout(() => {
      const start = performance.now();
      const tick = () => {
        const t = Math.min(1, (performance.now() - start) / 1600);
        el.textContent = String(Math.round(to * (1 - Math.pow(1 - t, 4))));
        if (t < 1) rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafId);
    };
  }, [to, delay]);

  return <span ref={ref}>0</span>;
}
