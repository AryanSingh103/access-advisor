"use client";

import { useEffect, useRef, useState } from "react";

function MockPage({ xray = false }: { xray?: boolean }) {
  const v = (classes: string, tag: string, below = false) =>
    xray ? `aa-viol ${classes}${below ? " aa-tag-below" : ""}` : "";
  const tag = (text: string) => (xray ? <span className="aa-tag">{text}</span> : null);

  return (
    <>
      <div className="aa-mock-nav">
        <div className="aa-mock-logo">nimbus.io</div>
        <div className="aa-mock-links">
          <span>Product</span>
          <span>Pricing</span>
          <span>Blog</span>
        </div>
        <div className={`aa-mock-cta ${v("aa-warn", "")}`}>
          {tag("SC 1.4.3 · contrast 2.1:1")}
          Get started
        </div>
      </div>
      <div className="aa-mock-grid">
        <div>
          <div className={`aa-mock-h1 ${v("aa-pass", "")}`}>
            {tag("✓ heading order valid")}
            Cloud storage
            <br />
            for modern teams
          </div>
          <div className={`aa-mock-sub ${v("aa-warn", "", true)}`}>
            {tag("SC 1.4.3 · contrast 3.4:1")}
            Sync everything, everywhere. Nimbus keeps your files fast, safe and always within
            reach.
          </div>
          <div className="aa-mock-buttons">
            <div className={`aa-mock-btn-a ${v("aa-pass", "")}`}>
              {tag("✓ 5.2:1 · focusable")}
              Start free trial
            </div>
            <div className={`aa-mock-btn-b ${v("", "")}`}>
              {tag("SC 2.1.1 · div w/ onClick")}
              Watch demo →
            </div>
          </div>
          <div className="aa-mock-form">
            <div className={`aa-mock-input ${v("", "", true)}`}>
              {tag("SC 3.3.2 · no label")}
              Enter your email
            </div>
            <div className={`aa-mock-submit ${v("aa-warn", "", true)}`}>
              {tag("SC 1.4.3 · contrast 1.9:1")}
              Subscribe
            </div>
          </div>
        </div>
        <div className={`aa-mock-img ${v("", "")}`}>{tag("SC 1.1.1 · img missing alt")}</div>
      </div>
    </>
  );
}

export function LensDemo() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const xrayRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const [found, setFound] = useState(0);
  const [total, setTotal] = useState(6);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    const xray = xrayRef.current;
    const ring = ringRef.current;
    const readout = readoutRef.current;
    if (!viewport || !xray || !ring || !readout) return;

    const R = 125;
    const target = { x: -500, y: -500 };
    const pos = { x: -500, y: -500 };
    let inside = false;
    let done = false;
    let rafId = 0;
    const seen = new Set<number>();
    const spots = Array.from(xray.querySelectorAll<HTMLElement>(".aa-viol")).filter(
      (el) => !el.classList.contains("aa-pass")
    );
    setTotal(spots.length);
    const root = viewport.closest(".aa-landing");

    const onMove = (e: MouseEvent) => {
      const r = viewport.getBoundingClientRect();
      target.x = e.clientX - r.left;
      target.y = e.clientY - r.top;
      inside = true;
      root?.classList.add("aa-lens-active");
    };
    const onLeave = () => {
      inside = false;
      root?.classList.remove("aa-lens-active");
    };

    const loop = () => {
      pos.x += (target.x - pos.x) * 0.14;
      pos.y += (target.y - pos.y) * 0.14;
      const radius = inside ? R : 0;
      xray.style.clipPath = `circle(${radius}px at ${pos.x}px ${pos.y}px)`;
      ring.style.left = `${pos.x}px`;
      ring.style.top = `${pos.y}px`;
      ring.style.opacity = inside ? "1" : "0";
      readout.textContent = inside
        ? `x:${Math.round(pos.x)} y:${Math.round(pos.y)} · lens active`
        : "idle";

      if (inside && !done) {
        const vr = viewport.getBoundingClientRect();
        spots.forEach((el, i) => {
          if (seen.has(i)) return;
          const r = el.getBoundingClientRect();
          const cx = r.left - vr.left + r.width / 2;
          const cy = r.top - vr.top + r.height / 2;
          if (Math.hypot(cx - pos.x, cy - pos.y) < R) {
            seen.add(i);
            setFound(seen.size);
          }
        });
        if (seen.size === spots.length) {
          done = true;
          setComplete(true);
        }
      }
      rafId = requestAnimationFrame(loop);
    };

    viewport.addEventListener("mousemove", onMove);
    viewport.addEventListener("mouseleave", onLeave);
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      viewport.removeEventListener("mousemove", onMove);
      viewport.removeEventListener("mouseleave", onLeave);
      root?.classList.remove("aa-lens-active");
    };
  }, []);

  return (
    <section className="aa-demo-col" aria-label="Interactive audit demo">
      <div className="aa-demo-hint">move your cursor over the page — live x-ray audit</div>
      <div className={`aa-browser ${complete ? "aa-done" : ""}`}>
        <div className="aa-browser-chrome">
          <div className="aa-dots">
            <i />
            <i />
            <i />
          </div>
          <div className="aa-url">https://startup-landing.example.com</div>
          <div className="aa-scan-badge">{complete ? "SCAN COMPLETE" : "SCANNING"}</div>
        </div>
        <div className="aa-viewport" ref={viewportRef}>
          <div className="aa-layer aa-layer-clean">
            <MockPage />
          </div>
          <div className="aa-layer aa-layer-xray" ref={xrayRef}>
            <MockPage xray />
          </div>
          <div className="aa-lens-ring" ref={ringRef}>
            <div className="aa-lens-orbit" />
            <div className="aa-lens-readout" ref={readoutRef}>
              idle
            </div>
          </div>
        </div>
      </div>
      <div className="aa-demo-foot">
        <div className="aa-legend">
          <span>
            <i className="aa-sw-r" />
            violation
          </span>
          <span>
            <i className="aa-sw-a" />
            warning
          </span>
          <span>
            <i className="aa-sw-t" />
            pass
          </span>
        </div>
        <span className={`aa-found ${complete ? "aa-done" : ""}`}>
          {complete ? (
            <>
              ✓ all {total} issues found — <a href="/scan">view full report →</a>
            </>
          ) : (
            <>
              found: <b>{found}</b> issues
            </>
          )}
        </span>
      </div>
    </section>
  );
}
