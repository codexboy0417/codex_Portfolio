import { useEffect, useRef, useState } from "react";

export function CornerHUD() {
  const [elapsed, setElapsed] = useState(0);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const startRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);

    function onMove(e: MouseEvent) {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      setCoords({ x: nx, y: -ny });
    }
    window.addEventListener("mousemove", onMove);

    return () => {
      clearInterval(id);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const fmt = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(4);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.1rem",
        right: "1.1rem",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        fontFamily: '"DM Mono", monospace',
        pointerEvents: "none",
      }}
      className="corner-hud"
    >
      {/* session pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.45rem",
          padding: "0.4rem 0.75rem",
          borderRadius: "999px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(10,10,10,0.55)",
          backdropFilter: "blur(6px)",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#4ade80",
            boxShadow: "0 0 6px #4ade80",
          }}
        />
        <span
          style={{
            fontSize: "0.58rem",
            letterSpacing: "0.08em",
            color: "rgba(255,255,255,0.55)",
            textTransform: "uppercase",
          }}
        >
          On page
        </span>
        <span
          style={{
            fontSize: "0.62rem",
            color: "rgba(255,255,255,0.75)",
          }}
        >
          {mm}:{ss}
        </span>
      </div>

      {/* coordinate ring */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.3rem 0.7rem",
          borderRadius: "999px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(10,10,10,0.55)",
          backdropFilter: "blur(6px)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            border: "1.5px solid rgba(255,255,255,0.15)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "-1.5px",
              borderRadius: "50%",
              border: "1.5px solid transparent",
              borderTopColor: "#4ade80",
              animation: "hud-spin 2.4s linear infinite",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: "0.56rem",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.5,
          }}
        >
          <span>X {fmt(coords.x)}</span>
          <span>Y {fmt(coords.y)}</span>
        </div>
      </div>

      <style>{`
        @keyframes hud-spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 640px) {
          .corner-hud { display: none !important; }
        }
      `}</style>
    </div>
  );
}
