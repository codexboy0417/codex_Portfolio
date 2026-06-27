import { useEffect, useRef, useState } from "react";
import { Hero } from "./components/Hero";
import { HologramInterface } from "./components/HologramInterface";
import { About } from "./components/About";
import { Projects } from "./components/Projects";
import { Skills } from "./components/Skills";
import { Contact } from "./components/Contact";
import { IntroSplash } from "./components/IntroSplash";
import { CornerHUD } from "./components/CornerHUD";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useHashScroll } from "../hooks/useHashScroll";
import { LazyMotion, domAnimation, m, AnimatePresence } from "motion/react";

export default function App() {
  const isMobile = useIsMobile();
  const [showThankYou, setShowThankYou] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [thumbRatio, setThumbRatio] = useState(0.2);
  const thankYouFired = useRef(false);
  useHashScroll();

  useEffect(() => {
    const el = document.querySelector(
      ".hologram-interface",
    ) as HTMLElement | null;
    if (!el) return;

    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      const progress = max > 0 ? el.scrollTop / max : 0;
      setScrollProgress(progress);
      setThumbRatio(
        el.scrollHeight > 0 ? el.clientHeight / el.scrollHeight : 1,
      );
      if (progress >= 0.98 && !thankYouFired.current) {
        thankYouFired.current = true;
        setShowThankYou(true);
        setTimeout(() => setShowThankYou(false), 10000);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });

    let target = el.scrollTop;
    let rafId: number | null = null;

    const animate = () => {
      const diff = target - el.scrollTop;
      if (Math.abs(diff) < 0.5) {
        el.scrollTop = target;
        rafId = null;
        return;
      }
      el.scrollTop += diff * 0.1;
      rafId = requestAnimationFrame(animate);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const max = el.scrollHeight - el.clientHeight;
      // Sync from actual scrollTop when idle so external scrolls (e.g. instant
      // nav jump on mount) don't leave target stale and snap back to top.
      if (!rafId) target = el.scrollTop;
      target = Math.max(0, Math.min(target + e.deltaY, max));
      if (!rafId) rafId = requestAnimationFrame(animate);
    };

    (window as any).__portfolioScrollTop = (top: number) => {
      target = Math.max(0, Math.min(top, el.scrollHeight - el.clientHeight));
      if (!rafId) rafId = requestAnimationFrame(animate);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
      if (rafId) cancelAnimationFrame(rafId);
      delete (window as any).__portfolioScrollTop;
    };
  }, []);

  useEffect(() => {
    if (!showThankYou) {
      setCountdown(10);
      return;
    }
    const id = setInterval(() => {
      setCountdown((n) => (n <= 1 ? (clearInterval(id), 0) : n - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [showThankYou]);

  return (
    <LazyMotion features={domAnimation}>
      <IntroSplash />
      <CornerHUD />

      {/* Page content - blurred when thank-you is showing */}
      <div
        className="spatial-scene"
        style={{
          filter: showThankYou ? "blur(4px) brightness(0.7)" : "none",
          transition: "filter 0.5s ease",
        }}
      >
        <HologramInterface>
          <Hero />
          <About />
          <Projects />
          <Skills />
          <Contact />
        </HologramInterface>
      </div>

      {/* Scroll progress pill - between ribbon and right edge */}
      <div
        style={{
          position: "fixed",
          right: "6px",
          top: "1rem",
          bottom: "1rem",
          width: "3px",
          zIndex: 998,
          borderRadius: "3px",
          background: "rgba(255,255,255,0.05)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            width: "100%",
            height: `${Math.max(thumbRatio * 100, 8)}%`,
            top: `${scrollProgress * (100 - Math.max(thumbRatio * 100, 8))}%`,
            borderRadius: "3px",
            background: "rgba(255,255,255,0.22)",
          }}
        />
      </div>

      {/* Thank you banner - outside blurred container, transparent bg clips via combined blur */}
      <AnimatePresence>
        {showThankYou && (
          <m.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1.2rem",
                padding: isMobile ? "2.5rem 2rem" : "3.5rem 5rem",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                pointerEvents: "auto",
              }}
            >
              <span
                style={{
                  fontFamily:
                    '"Editorial New", "Playfair Display", Georgia, serif',
                  fontSize: isMobile ? "1.3rem" : "1.75rem",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.9)",
                  letterSpacing: "0.01em",
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                Somewhere between the hero and here, you decided to keep going.
                <br />
                <br />
                Thank you for taking the time to know me a little more than you
                already did.
              </span>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: isMobile ? "0.85rem" : "0.95rem",
                  color: "rgba(255,255,255,0.45)",
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                Want to see what I'm building next?{isMobile ? <br /> : " "}
                <a
                  href="https://github.com/codexboy0417"
                  style={{
                    color: "#4ade80",
                    textDecoration: "none",
                    borderBottom: "1px solid rgba(74,222,128,0.4)",
                    paddingBottom: "1px",
                  }}
                >
                  Read them here.
                </a>
              </span>

              {/* Countdown ring */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginTop: "0.4rem",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "52px",
                    height: "52px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="52"
                    height="52"
                    style={{
                      position: "absolute",
                      inset: 0,
                      transform: "rotate(-90deg)",
                    }}
                  >
                    <circle
                      cx="26"
                      cy="26"
                      r="22"
                      fill="none"
                      stroke="rgba(255,255,255,0.07)"
                      strokeWidth="2"
                    />
                    <m.circle
                      cx="26"
                      cy="26"
                      r="22"
                      fill="none"
                      stroke="#4ade80"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 22}
                      initial={{ strokeDashoffset: 0 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 22 }}
                      transition={{ duration: 10, ease: "linear" }}
                    />
                  </svg>
                  <span
                    style={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: "1rem",
                      color: "rgba(255,255,255,0.7)",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {countdown}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: "0.52rem",
                    letterSpacing: "0.18em",
                    color: "rgba(255,255,255,0.25)",
                    textTransform: "uppercase",
                  }}
                >
                  glad you stayed
                </span>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
