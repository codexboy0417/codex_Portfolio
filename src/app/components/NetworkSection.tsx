import { useEffect, useRef, useState, useMemo } from "react";
import { m, AnimatePresence } from "motion/react";
import { ExternalLink, Sparkles, Filter, RefreshCw } from "lucide-react";
import { useIsMobile } from "../../hooks/useMediaQuery";
import rawData from "../../data/connections.json";

const FONT_SERIF = '"Playfair Display", Georgia, serif';
const FONT_MONO = '"DM Mono", monospace';
const FONT_SANS = '"DM Sans", sans-serif';

export type Connection = {
  name: string;
  headline: string;
  company: string;
  zone: string;
  profileUrl: string;
};

type Node = {
  id: number;
  data: Connection;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  radius: number;
  color: string;
  zoneId: string;
  pulsePhase: number;
};

type Pulse = {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  color: string;
};

const ZONE_CONFIG: Record<string, { id: string; label: string; color: string }> = {
  "all": { id: "all", label: "All Neurons", color: "#38bdf8" },
  "AI & Machine Learning": { id: "ai", label: "AI & ML", color: "#c084fc" },
  "Software & Cloud": { id: "cloud", label: "Software & Cloud", color: "#38bdf8" },
  "Founders & Leadership": { id: "leaders", label: "Founders & Leads", color: "#fbbf24" },
  "Alumni & Scholars": { id: "scholars", label: "Alumni & Scholars", color: "#4ade80" },
};

export function NetworkSection() {
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeZone, setActiveZone] = useState<string>("all");
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1200, height: 750 });

  const connections: Connection[] = useMemo(() => {
    return (rawData.connections || []) as Connection[];
  }, []);

  const totalConnections = connections.length;

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setCanvasDimensions({
        width: Math.floor(rect.width),
        height: Math.max(580, Math.floor(window.innerHeight * 0.82)),
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize, { passive: true });
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width: W, height: H } = canvasDimensions;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    // Color mapper across horizontal span: Purple (#c084fc) -> Cyan (#38bdf8) -> Green (#4ade80)
    const getColorByPosition = (xRatio: number, zone: string) => {
      const base = ZONE_CONFIG[zone]?.color;
      if (base) return base;
      if (xRatio < 0.35) return "#c084fc"; // Magenta / Purple
      if (xRatio < 0.68) return "#38bdf8"; // Electric Cyan / Blue
      return "#4ade80"; // Neon Green
    };

    // Initialize nodes
    const nodes: Node[] = connections.map((conn, idx) => {
      // Natural horizontal spread matching the uploaded image
      const progress = connections.length > 1 ? idx / (connections.length - 1) : 0.5;
      const targetX = W * (0.12 + 0.76 * progress + (Math.random() - 0.5) * 0.16);
      const targetY = H * (0.22 + 0.56 * Math.sin(progress * Math.PI) + (Math.random() - 0.5) * 0.38);

      const color = getColorByPosition(progress, conn.zone);
      const radius = 3.5 + Math.random() * 2.5;

      return {
        id: idx,
        data: conn,
        x: Math.max(24, Math.min(W - 24, targetX)),
        y: Math.max(24, Math.min(H - 24, targetY)),
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        baseRadius: radius,
        radius,
        color,
        zoneId: conn.zone,
        pulsePhase: Math.random() * Math.PI * 2,
      };
    });

    const pulses: Pulse[] = [];
    const maxConnectionDistance = isMobile ? 110 : 165;
    let animationFrameId: number;
    let mouse = { x: -9999, y: -9999, isInside: false };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        isInside: true,
      };

      // Check hover
      let closest: Node | null = null;
      let closestDist = 20; // pick radius
      for (const node of nodes) {
        const dx = node.x - mouse.x;
        const dy = node.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < closestDist) {
          closest = node;
          closestDist = dist;
        }
      }
      setHoveredNode(closest);
    };

    const onMouseLeave = () => {
      mouse.isInside = false;
      setHoveredNode(null);
    };

    const onClick = () => {
      if (hoveredNode) {
        setSelectedNode((prev) => (prev?.id === hoveredNode.id ? null : hoveredNode));
      } else {
        setSelectedNode(null);
      }
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("click", onClick);

    // Spawn pulses occasionally along edges
    const spawnPulse = () => {
      if (nodes.length < 2) return;
      const sourceIdx = Math.floor(Math.random() * nodes.length);
      const source = nodes[sourceIdx];

      // Find nearby neighbors
      const neighbors: number[] = [];
      for (let j = 0; j < nodes.length; j++) {
        if (sourceIdx === j) continue;
        const dist = Math.hypot(source.x - nodes[j].x, source.y - nodes[j].y);
        if (dist < maxConnectionDistance) {
          neighbors.push(j);
        }
      }

      if (neighbors.length > 0) {
        const targetIdx = neighbors[Math.floor(Math.random() * neighbors.length)];
        pulses.push({
          fromNode: sourceIdx,
          toNode: targetIdx,
          progress: 0,
          speed: 0.012 + Math.random() * 0.018,
          color: source.color,
        });
      }
    };

    const pulseInterval = setInterval(spawnPulse, 320);

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, W, H);

      // Draw subtle background ambient glow gradients
      const leftGlow = ctx.createRadialGradient(W * 0.2, H * 0.6, 10, W * 0.2, H * 0.6, W * 0.45);
      leftGlow.addColorStop(0, "rgba(168, 85, 247, 0.06)");
      leftGlow.addColorStop(1, "transparent");
      ctx.fillStyle = leftGlow;
      ctx.fillRect(0, 0, W, H);

      const rightGlow = ctx.createRadialGradient(W * 0.8, H * 0.4, 10, W * 0.8, H * 0.4, W * 0.45);
      rightGlow.addColorStop(0, "rgba(74, 222, 128, 0.05)");
      rightGlow.addColorStop(1, "transparent");
      ctx.fillStyle = rightGlow;
      ctx.fillRect(0, 0, W, H);

      // Update node positions and physics
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        // Boundary reflection
        if (n.x < 24) { n.x = 24; n.vx *= -1; }
        if (n.x > W - 24) { n.x = W - 24; n.vx *= -1; }
        if (n.y < 24) { n.y = 24; n.vy *= -1; }
        if (n.y > H - 24) { n.y = H - 24; n.vy *= -1; }

        // Subtle mouse repulsion
        if (mouse.isInside) {
          const mdx = n.x - mouse.x;
          const mdy = n.y - mouse.y;
          const mdist = Math.hypot(mdx, mdy);
          if (mdist < 100 && mdist > 0) {
            const force = (100 - mdist) / 100 * 0.6;
            n.x += (mdx / mdist) * force;
            n.y += (mdy / mdist) * force;
          }
        }

        n.pulsePhase += 0.035;
      }

      // Draw connections (synaptic filaments)
      for (let i = 0; i < nodes.length; i++) {
        const na = nodes[i];
        const matchA = activeZone === "all" || na.zoneId === activeZone;

        for (let j = i + 1; j < nodes.length; j++) {
          const nb = nodes[j];
          const matchB = activeZone === "all" || nb.zoneId === activeZone;
          const dist = Math.hypot(na.x - nb.x, na.y - nb.y);

          if (dist < maxConnectionDistance) {
            const alphaRatio = 1 - dist / maxConnectionDistance;
            const isHighlighted = (hoveredNode && (hoveredNode.id === na.id || hoveredNode.id === nb.id));
            const baseAlpha = (matchA && matchB) ? 0.38 : 0.08;
            const finalAlpha = isHighlighted ? 0.85 : baseAlpha * alphaRatio;

            // Gradient line
            const grad = ctx.createLinearGradient(na.x, na.y, nb.x, nb.y);
            grad.addColorStop(0, na.color);
            grad.addColorStop(1, nb.color);

            ctx.beginPath();
            ctx.strokeStyle = grad;
            ctx.globalAlpha = finalAlpha;
            ctx.lineWidth = isHighlighted ? 1.6 : 0.9;
            ctx.moveTo(na.x, na.y);
            ctx.lineTo(nb.x, nb.y);
            ctx.stroke();
          }
        }
      }

      // Draw synaptic traveling pulses
      for (let k = pulses.length - 1; k >= 0; k--) {
        const p = pulses[k];
        p.progress += p.speed;

        if (p.progress >= 1) {
          pulses.splice(k, 1);
          continue;
        }

        const na = nodes[p.fromNode];
        const nb = nodes[p.toNode];
        const px = na.x + (nb.x - na.x) * p.progress;
        const py = na.y + (nb.y - na.y) * p.progress;

        ctx.beginPath();
        ctx.globalAlpha = 0.9 * Math.sin(p.progress * Math.PI);
        ctx.fillStyle = p.color;
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Small pulse glow
        ctx.beginPath();
        ctx.globalAlpha = 0.4 * Math.sin(p.progress * Math.PI);
        ctx.arc(px, py, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw nodes (neurons)
      for (const n of nodes) {
        const isMatched = activeZone === "all" || n.zoneId === activeZone;
        const isHovered = hoveredNode?.id === n.id;
        const isSelected = selectedNode?.id === n.id;
        const nodeAlpha = isMatched ? 1.0 : 0.22;

        const breathe = Math.sin(n.pulsePhase) * 0.8;
        const r = (isHovered || isSelected ? n.baseRadius * 1.6 : n.baseRadius) + breathe;

        // Outer glow halo
        ctx.save();
        ctx.globalAlpha = (isHovered || isSelected ? 0.55 : 0.25) * nodeAlpha;
        const haloGrad = ctx.createRadialGradient(n.x, n.y, r * 0.5, n.x, n.y, r * 3.8);
        haloGrad.addColorStop(0, n.color);
        haloGrad.addColorStop(1, "transparent");
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Inner solid core
        ctx.beginPath();
        ctx.globalAlpha = (isHovered || isSelected ? 1 : 0.95) * nodeAlpha;
        ctx.fillStyle = isHovered ? "#ffffff" : n.color;
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Center white specular spark
        ctx.beginPath();
        ctx.globalAlpha = 0.9 * nodeAlpha;
        ctx.fillStyle = "#ffffff";
        ctx.arc(n.x - r * 0.25, n.y - r * 0.25, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(pulseInterval);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, [canvasDimensions, connections, activeZone, hoveredNode, selectedNode, isMobile]);

  const activeProfile = selectedNode || hoveredNode;

  return (
    <section
      id="network"
      ref={containerRef}
      style={{
        position: "relative",
        background: "transparent",
        padding: isMobile ? "4rem 4vw 6rem" : "5rem 6vw 7rem",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: "0.62rem",
              letterSpacing: "0.2em",
              color: "#38bdf8",
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Sparkles size={13} color="#38bdf8" />
            Neural Synapse Network
          </span>
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "rgba(255,255,255,0.07)",
            }}
          />
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: "0.58rem",
              letterSpacing: "0.15em",
              color: "#4ade80",
              border: "1px solid rgba(74,222,128,0.3)",
              background: "rgba(74,222,128,0.06)",
              padding: "4px 10px",
              borderRadius: "999px",
              textTransform: "uppercase",
            }}
          >
            ● Live Sync Active
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-end", gap: "1.2rem" }}>
          <div>
            <m.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{
                fontFamily: FONT_SERIF,
                fontSize: isMobile ? "clamp(1.8rem, 7vw, 3.2rem)" : "clamp(2.4rem, 4vw, 3.8rem)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "0.02em",
                color: "#fafaf8",
                margin: 0,
              }}
            >
              Every Connection, A Synapse.
            </m.h2>
            <p
              style={{
                fontFamily: FONT_SANS,
                fontSize: "0.88rem",
                color: "rgba(255,255,255,0.55)",
                marginTop: "0.6rem",
                maxWidth: "620px",
                lineHeight: 1.6,
              }}
            >
              Real-time interactive constellation of my 1st-degree professional network. Each glowing neuron represents an engineer, researcher, or mentor in my journey. Hover or click any node to explore.
            </p>
          </div>

          {/* Network Stats Card */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "1.2rem",
              padding: "0.75rem 1.2rem",
              background: "rgba(10,10,14,0.65)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              backdropFilter: "blur(10px)",
            }}
          >
            <div>
              <span style={{ fontFamily: FONT_MONO, fontSize: "0.55rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block" }}>
                Synaptic Nodes
              </span>
              <span style={{ fontFamily: FONT_MONO, fontSize: "1.2rem", fontWeight: 700, color: "#fafaf8" }}>
                {totalConnections}
              </span>
            </div>
            <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.1)" }} />
            <div>
              <span style={{ fontFamily: FONT_MONO, fontSize: "0.55rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block" }}>
                Sync Source
              </span>
              <span style={{ fontFamily: FONT_MONO, fontSize: "0.78rem", color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <RefreshCw size={11} /> Voyager Cloud
              </span>
            </div>
          </div>
        </div>

        {/* Zone Filter Tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "1.8rem",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontFamily: FONT_MONO, fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginRight: "0.4rem", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Filter size={11} /> Zones:
          </span>
          {Object.entries(ZONE_CONFIG).map(([key, config]) => {
            const isSelected = (key === "all" && activeZone === "all") || (key !== "all" && activeZone === key);
            return (
              <button
                key={config.id}
                onClick={() => setActiveZone(key === "all" ? "all" : key)}
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: "0.65rem",
                  letterSpacing: "0.08em",
                  padding: "5px 12px",
                  borderRadius: "999px",
                  border: isSelected ? `1px solid ${config.color}` : "1px solid rgba(255,255,255,0.08)",
                  background: isSelected ? `${config.color}18` : "rgba(255,255,255,0.02)",
                  color: isSelected ? config.color : "rgba(255,255,255,0.55)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: config.color,
                    boxShadow: isSelected ? `0 0 8px ${config.color}` : "none",
                  }}
                />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Plexus Canvas Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "radial-gradient(ellipse at 50% 50%, rgba(12,12,18,0.95) 0%, rgba(6,6,8,0.98) 100%)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            cursor: hoveredNode ? "pointer" : "crosshair",
          }}
        />

        {/* Hover / Selected Profile Card Overlay */}
        <AnimatePresence>
          {activeProfile && (
            <m.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              style={{
                position: "absolute",
                bottom: "1.2rem",
                left: isMobile ? "1rem" : "1.5rem",
                right: isMobile ? "1rem" : "auto",
                maxWidth: isMobile ? "none" : "360px",
                padding: "1.1rem 1.3rem",
                borderRadius: "10px",
                background: "rgba(10, 10, 15, 0.88)",
                border: `1px solid ${activeProfile.color}55`,
                boxShadow: `0 10px 30px rgba(0,0,0,0.7), 0 0 20px ${activeProfile.color}22`,
                backdropFilter: "blur(12px)",
                pointerEvents: "auto",
                zIndex: 40,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.9rem" }}>
                {/* Initials Avatar */}
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${activeProfile.color}33, ${activeProfile.color}88)`,
                    border: `1px solid ${activeProfile.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: FONT_MONO,
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#ffffff",
                    flexShrink: 0,
                    boxShadow: `0 0 12px ${activeProfile.color}44`,
                  }}
                >
                  {activeProfile.data.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <h4
                      style={{
                        fontFamily: FONT_SANS,
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        color: "#fafaf8",
                        margin: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {activeProfile.data.name}
                    </h4>
                    <span
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: "0.52rem",
                        letterSpacing: "0.08em",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background: `${activeProfile.color}15`,
                        border: `1px solid ${activeProfile.color}40`,
                        color: activeProfile.color,
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {activeProfile.data.zone}
                    </span>
                  </div>

                  <p
                    style={{
                      fontFamily: FONT_SANS,
                      fontSize: "0.78rem",
                      color: "rgba(255,255,255,0.65)",
                      margin: "0.25rem 0 0",
                      lineHeight: 1.4,
                    }}
                  >
                    {activeProfile.data.headline}
                  </p>

                  <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "flex-end" }}>
                    <a
                      href={activeProfile.data.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: "0.62rem",
                        letterSpacing: "0.1em",
                        color: activeProfile.color,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        textTransform: "uppercase",
                      }}
                    >
                      LinkedIn Profile <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Ambient Corner Canvas HUD Watermark */}
        <div
          style={{
            position: "absolute",
            top: "1rem",
            right: "1.2rem",
            fontFamily: FONT_MONO,
            fontSize: "0.55rem",
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.25)",
            textTransform: "uppercase",
            pointerEvents: "none",
          }}
        >
          Plexus Topology • Synaptic Gradient
        </div>
      </div>
      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          marginTop: isMobile ? "4rem" : "6rem",
          paddingTop: "2rem",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: "0.6rem",
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase",
          }}
        >
          Designed & Built by Ashit Upadhyay • Deployed on Vercel
        </span>
      </div>
    </section>
  );
}
