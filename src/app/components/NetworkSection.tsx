import { useState, useMemo } from "react";
import { m } from "motion/react";
import { Sparkles, Filter } from "lucide-react";
import { useIsMobile } from "../../hooks/useMediaQuery";
import rawData from "../../data/connections.json";
import { ThreeNeuronScene, ZONE_CONFIG, type Connection } from "./ThreeNeuronScene";

const FONT_SERIF = '"Playfair Display", Georgia, serif';
const FONT_MONO = '"DM Mono", monospace';
const FONT_SANS = '"DM Sans", sans-serif';

export function NetworkSection() {
  const isMobile = useIsMobile();
  const [activeZone, setActiveZone] = useState<string>("all");

  const connections: Connection[] = useMemo(() => {
    return (rawData.connections || []) as Connection[];
  }, []);

  const totalConnections = connections.length;

  return (
    <section
      id="network"
      style={{
        position: "relative",
        background: "transparent",
        padding: isMobile ? "3rem 0 5rem" : "4.5rem 0 6rem",
        overflow: "hidden",
      }}
    >
      {/* Header Container (with standard horizontal gutters) */}
      <div style={{ padding: isMobile ? "0 4vw 1.5rem" : "0 6vw 1.8rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.2rem",
          }}
        >
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: "0.62rem",
              letterSpacing: "0.2em",
              color: "#D0FF00",
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Sparkles size={13} color="#D0FF00" />
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
              color: "#D0FF00",
              border: "1px solid rgba(208,255,0,0.3)",
              background: "rgba(208,255,0,0.06)",
              padding: "4px 10px",
              borderRadius: "999px",
              textTransform: "uppercase",
            }}
          >
            ● Live Sync Active
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "flex-end",
            gap: "1.2rem",
          }}
        >
          <div>
            <m.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{
                fontFamily: FONT_SERIF,
                fontSize: isMobile
                  ? "clamp(1.8rem, 7vw, 3.2rem)"
                  : "clamp(2.4rem, 4vw, 3.8rem)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "0.02em",
                color: "#FEFFFC",
                margin: 0,
              }}
            >
              Every Connection, A Synapse.
            </m.h2>
            <p
              style={{
                fontFamily: FONT_SANS,
                fontSize: "0.88rem",
                color: "rgba(254,255,252,0.65)",
                marginTop: "0.6rem",
                maxWidth: "600px",
                lineHeight: 1.6,
              }}
            >
              Real-time interactive 3D constellation of my professional network.
              Rotate freely in 3D space, zoom deep inside individual neurons, and click any node to explore their profile.
            </p>
          </div>

          {/* Clean Network Counter */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "1.2rem",
              padding: "0.65rem 1.2rem",
              background: "rgba(18, 5, 34, 0.65)",
              border: "1px solid rgba(208, 255, 0, 0.25)",
              borderRadius: "8px",
              backdropFilter: "blur(12px)",
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: "0.55rem",
                  letterSpacing: "0.12em",
                  color: "rgba(254,255,252,0.5)",
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                Synaptic Nodes
              </span>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "#D0FF00",
                }}
              >
                {totalConnections}
              </span>
            </div>
            <div
              style={{
                width: "1px",
                height: "24px",
                background: "rgba(255,255,255,0.1)",
              }}
            />
            <div>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: "0.55rem",
                  letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.45)",
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                Network
              </span>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: "0.8rem",
                  color: "#ffffff",
                }}
              >
                1st-Degree Synapses
              </span>
            </div>
          </div>
        </div>

        {/* Minimalist Zone Filter Tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "1.6rem",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: "0.6rem",
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginRight: "0.3rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Filter size={11} /> Clusters:
          </span>
          {Object.entries(ZONE_CONFIG).map(([key, config]) => {
            const isSelected =
              (key === "all" && activeZone === "all") ||
              (key !== "all" && activeZone === key);
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
                  border: isSelected
                    ? `1px solid ${config.color}`
                    : "1px solid rgba(255,255,255,0.08)",
                  background: isSelected
                    ? `${config.color}22`
                    : "rgba(255,255,255,0.02)",
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

      {/* Full-Bleed 3D Neural Synapse Canvas (NO BOX, Spanning full width seamlessly) */}
      <ThreeNeuronScene activeZone={activeZone} onZoneChange={setActiveZone} />

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          marginTop: isMobile ? "3rem" : "5rem",
          padding: "2rem 6vw 0",
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
