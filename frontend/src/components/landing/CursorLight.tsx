"use client";

import { useEffect, useRef } from "react";

export function CursorLight() {
  const dotRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const halo = haloRef.current;
    if (!dot || !halo) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let rafId = 0;
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let hx = mouse.x;
    let hy = mouse.y;

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
    };

    const root = dot.closest(".aa-landing");
    const onOver = (e: MouseEvent) => {
      if ((e.target as Element).closest("a, button")) {
        root?.classList.add("aa-link-hover");
      }
    };
    const onOut = (e: MouseEvent) => {
      if ((e.target as Element).closest("a, button")) {
        root?.classList.remove("aa-link-hover");
      }
    };

    const haloLoop = () => {
      hx += (mouse.x - hx) * 0.07;
      hy += (mouse.y - hy) * 0.07;
      halo.style.left = `${hx}px`;
      halo.style.top = `${hy}px`;
      rafId = requestAnimationFrame(haloLoop);
    };

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    rafId = requestAnimationFrame(haloLoop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);

  return (
    <>
      <div ref={haloRef} className="aa-cursor-halo" aria-hidden="true" />
      <div ref={dotRef} className="aa-cursor" aria-hidden="true" />
    </>
  );
}
