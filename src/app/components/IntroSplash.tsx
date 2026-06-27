import { useEffect, useRef, useState } from "react";

type Particle = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  size: number;
};

const TEXT = "codexboy_04";

export function IntroSplash() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dismissed, setDismissed] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    document.body.style.overflow = "hidden";

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let raf = 0;
    let frame = 0;
    let ready = false;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function buildTargets(w: number, h: number) {
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const octx = off.getContext("2d");
      if (!octx) return [] as { x: number; y: number }[];

      const fontSize = Math.min(w * 0.12, 110);
      octx.fillStyle = "#fff";
      octx.font = `700 ${fontSize}px "DM Sans", sans-serif`;
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.fillText(TEXT, w / 2, h / 2);

      const data = octx.getImageData(0, 0, w, h).data;
      // denser sampling = solid, uniform-looking glyphs instead of a
      // patchy/grainy look on thinner letterforms
      const step = w < 600 ? 2 : 3;
      const pts: { x: number; y: number }[] = [];
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const alpha = data[(y * w + x) * 4 + 3];
          if (alpha > 120) pts.push({ x, y });
        }
      }
      return pts;
    }

    function resize() {
      if (!canvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx?.scale(dpr, dpr);

      const targets = buildTargets(w, h);
      particles = targets.map((t) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        tx: t.x,
        ty: t.y,
        // tight, consistent size range - keeps every letter reading at
        // the same density/weight instead of some looking bolder than others
        size: Math.random() * 0.7 + 1.0,
      }));
      ready = true;
    }

    function start() {
      resize();
      window.addEventListener("resize", resize);

      function tick() {
        if (!ctx || !canvas) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);

        const ease = Math.min(frame / 70, 1);
        // jitter fades out as particles settle, so the held final frame is
        // perfectly still and crisp - no permanent shake/static look
        const jitter = (1 - ease) * 0.3;
        ctx.fillStyle = "rgba(232,224,208,0.92)";

        if (ready) {
          for (const p of particles) {
            p.x += (p.tx - p.x) * 0.06 * ease + (Math.random() - 0.5) * jitter;
            p.y += (p.ty - p.y) * 0.06 * ease + (Math.random() - 0.5) * jitter;
            ctx.fillRect(p.x, p.y, p.size, p.size);
          }
        }

        frame++;
        raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
    }

    // wait for the real webfont to be ready before sampling glyph pixels,
    // so the very first frame already uses the correct typeface/weight
    if ((document as any).fonts?.ready) {
      (document as any).fonts.ready.then(start).catch(start);
    } else {
      start();
    }

    function onScroll() {
      setFading(true);
      window.removeEventListener("wheel", onScroll);
      window.removeEventListener("touchmove", onScroll);
      window.removeEventListener("keydown", onKey);
      setTimeout(() => {
        document.body.style.overflow = "";
        setDismissed(true);
      }, 650);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        onScroll();
      }
    }

    window.addEventListener("wheel", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("wheel", onScroll);
      window.removeEventListener("touchmove", onScroll);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.6s ease",
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
      <div
        style={{
          position: "absolute",
          bottom: "2.2rem",
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(255,255,255,0.55)",
          fontFamily: '"DM Mono", monospace',
          fontSize: "0.62rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.4rem",
          animation: "intro-bounce 1.8s ease-in-out infinite",
        }}
      >
        <span>Scroll to continue</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 6l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <style>{`
        @keyframes intro-bounce {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, 6px); }
        }
      `}</style>
    </div>
  );
}
