import { m } from "motion/react";
import { useState } from "react";
import {
  useIsMobile,
  useIsTablet,
  useIsDesktop,
} from "../../hooks/useMediaQuery";
import { useEqualRows } from "../../hooks/useCollageGrid";
import { EqualGridRenderer } from "./CollageRenderer";

const FONT_SERIF = '"Playfair Display", Georgia, serif';
const FONT_MONO = '"DM Mono", monospace';
const FONT_SANS = '"DM Sans", sans-serif';

export type Project = {
  index: string;
  slug: string;
  title: string;
  company: string;
  logo: string;
  logoHeight: number;
  status: string;
  devStatus?: string;
  tags: string[];
  impact: string;
  summary: [string, string, string, string];
  bullets: string[];
  github: string | null;
};

export function renderBullet(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} style={{ color: "#e8e0d0", fontWeight: 600 }}>
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

export const projects: Project[] = [
  {
    index: "01",
    slug: "spamguard-email-classifier",
    title: "SpamGuard - Email Spam Classifier",
    company: "Personal",
    logo: "/logos/python.svg",
    logoHeight: 18,
    status: "Shipped",
    devStatus: "completed",
    tags: ["Python", "Scikit-learn", "Streamlit", "TF-IDF", "NLP basics"],
    impact:
      "Takes pasted email text and classifies it as spam or legitimate, with a confidence score shown for each prediction.",
    summary: [
      "Spam filters are usually a black box - you get a yes/no with no sense of how the model decided.",
      "Built a Streamlit app where pasted email text is vectorized with TF-IDF and run through a trained scikit-learn classifier.",
      "Kept the pipeline simple and explainable on purpose: vectorizer and model are both saved and reused, no hidden steps.",
      "Working end-to-end demo - paste text in, get a spam/legitimate verdict with a confidence score.",
    ],
    bullets: [
      "**TF-IDF vectorization** turns raw email text into the numeric features the classifier actually trains on.",
      "**Scikit-learn classifier** trained on a labeled spam/ham dataset, saved as a reusable model file.",
      "**Streamlit front-end** so the whole thing runs as an actual interactive app, not just a notebook.",
      "Built to understand the full pipeline end-to-end - preprocessing, training, saving, and serving a model - not just call a library.",
    ],
    github: "https://github.com/codexboy0417/SpamGuard-Email-Classifier",
  },
  {
    index: "02",
    slug: "tic-tac-toe",
    title: "Tic-Tac-Toe",
    company: "Personal",
    logo: "/logos/github.svg",
    logoHeight: 18,
    status: "Shipped",
    devStatus: "completed",
    tags: ["HTML", "CSS", "JavaScript", "GitHub Pages"],
    impact:
      "Classic two-player Tic-Tac-Toe, built in plain HTML/CSS/JS and deployed live via GitHub Pages.",
    summary: [
      "Wanted a small, self-contained project to practice DOM manipulation and game-state logic from scratch.",
      "Built the full game loop - turn tracking, win/draw detection, board reset - in vanilla JavaScript.",
      "Kept it dependency-free on purpose: no framework, just HTML, CSS, and JS.",
      "Deployed live on GitHub Pages so it's actually playable, not just code in a repo.",
    ],
    bullets: [
      "**Vanilla JavaScript** game logic - win detection across rows, columns, and diagonals, plus draw handling.",
      "**DOM manipulation** drives the board state and turn indicator without any UI framework.",
      "**Deployed via GitHub Pages** - live and playable at the link, not just source code.",
    ],
    github: "https://github.com/codexboy0417/Tic-Tac-Toe.v1",
  },
];

const PROJECT_DETAIL_PATHS: Partial<Record<string, string>> = {};

const SUMMARY_LABELS = ["Problem", "Approach", "Design", "Outcome"];



// Featured card for HSBC / Controla
function FeaturedCard({
  p,
  caseStudyHref,
  caseStudyLabel,
}: {
  p: Project;
  caseStudyHref: string;
  caseStudyLabel: string;
}) {
  const [hovered, setHovered] = useState(false);
  const isMobile = useIsMobile();

  const isHSBC = p.slug === "hsbc-voice";
  const accentColor = isHSBC ? "#22d3ee" : "#e8e0d0";
  const accentBorder = isHSBC
    ? "rgba(34,211,238,0.4)"
    : "rgba(232,224,208,0.25)";

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: isMobile ? "1.6rem" : "2.4rem",
        borderRadius: "8px",
        border: `1px solid ${hovered ? accentBorder : "rgba(255,255,255,0.12)"}`,
        background: "transparent",
        transition: "border-color 0.25s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Accent top line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: accentColor,
          opacity: hovered ? 0.7 : 0.3,
          transition: "opacity 0.25s",
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? "1.5rem" : "3vw",
          alignItems: "start",
        }}
      >
        {/* Left: header info */}
        <div>
          {/* Company + status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "1.2rem",
            }}
          >
            <img
              src={p.logo}
              alt={p.company}
              loading="lazy"
              decoding="async"
              style={{
                height: `${p.logoHeight}px`,
                width: "auto",
                maxWidth: "60px",
                objectFit: "contain",
                opacity: 0.85,
              }}
              onError={(e) =>
                ((e.currentTarget as HTMLImageElement).style.display = "none")
              }
            />
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: "0.62rem",
                letterSpacing: "0.09em",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              {p.company}
            </span>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: "0.52rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "2px 8px",
                borderRadius: "20px",
                color: accentColor,
                border: `1px solid ${accentBorder}`,
                background: isHSBC
                  ? "rgba(34,211,238,0.06)"
                  : "rgba(232,224,208,0.04)",
              }}
            >
              {p.status}
            </span>
          </div>

          <h3
            style={{
              fontFamily: FONT_SERIF,
              fontWeight: 800,
              fontSize: isMobile ? "1.4rem" : "1.7rem",
              color: "#fafaf8",
              lineHeight: 1.2,
              margin: "0 0 1rem",
              letterSpacing: "0.02em",
            }}
          >
            {p.title}
          </h3>

          <p
            style={{
              fontFamily: FONT_MONO,
              fontSize: "0.62rem",
              letterSpacing: "0.06em",
              color: accentColor,
              opacity: 0.9,
              marginBottom: "1.5rem",
              lineHeight: 1.6,
            }}
          >
            {p.impact}
          </p>

          {/* CTA link */}
          <a
            href={caseStudyHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: FONT_MONO,
              fontSize: "0.62rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: accentColor,
              textDecoration: "none",
              border: `1px solid ${accentBorder}`,
              borderRadius: "4px",
              padding: "8px 14px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = isHSBC
                ? "rgba(34,211,238,0.08)"
                : "rgba(232,224,208,0.06)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            {caseStudyLabel} →
          </a>
        </div>

        {/* Right: summary bullets */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}
        >
          {p.summary.slice(0, 3).map((bullet, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "0.65rem",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: "0.58rem",
                  color: "rgba(255,255,255,0.2)",
                  marginTop: "4px",
                  flexShrink: 0,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  width: "70px",
                }}
              >
                {SUMMARY_LABELS[i]}
              </span>
              <span
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "0.85rem",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.55)",
                  textAlign: "justify",
                  textJustify: "inter-word",
                }}
              >
                {renderBullet(bullet)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div
        style={{
          display: "flex",
          gap: "5px",
          flexWrap: "wrap",
          marginTop: "1.5rem",
          paddingTop: "1.2rem",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {p.tags.map((t) => (
          <span
            key={t}
            style={{
              fontFamily: FONT_MONO,
              fontSize: "0.52rem",
              letterSpacing: "0.07em",
              color: "rgba(255,255,255,0.35)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "2px",
              padding: "3px 7px",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </m.div>
  );
}

// Compact secondary card
function ProjectCard({ p, index }: { p: Project; index: number }) {
  const [hovered, setHovered] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const showOutcome = hovered || revealed;

  const isAward = p.status === "Best Outgoing Project • 2022–23";
  const statusColor = isAward
    ? "#facc15"
    : p.status === "Client Delivery"
      ? "#22d3ee"
      : p.devStatus === "completed"
        ? "#4ade80"
        : "#facc15";
  const statusBorder = isAward
    ? "rgba(250,204,21,0.35)"
    : p.status === "Client Delivery"
      ? "rgba(34,211,238,0.4)"
      : p.devStatus === "completed"
        ? "rgba(74,222,128,0.35)"
        : "rgba(250,204,21,0.35)";
  const statusBg = isAward
    ? "rgba(250,204,21,0.06)"
    : p.status === "Client Delivery"
      ? "rgba(34,211,238,0.08)"
      : p.devStatus === "completed"
        ? "rgba(74,222,128,0.06)"
        : "rgba(250,204,21,0.06)";

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (isMobile && !revealed) {
          setRevealed(true);
          return;
        }
        window.location.href =
          PROJECT_DETAIL_PATHS[p.slug] ?? `/projects/${p.slug}`;
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "1.4rem",
        borderRadius: "8px",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.1)"}`,
        background: "transparent",
        transition: "border-color 0.2s",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
          overflow: "hidden",
          maxHeight: showOutcome ? "1000px" : "14rem",
          minHeight: showOutcome ? undefined : "14rem",
          transition: "max-height 0.5s cubic-bezier(0.76, 0, 0.24, 1)",
          ...(!showOutcome
            ? {
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 75%, transparent 100%)",
                maskImage:
                  "linear-gradient(to bottom, black 75%, transparent 100%)",
              }
            : {}),
        }}
      >
        {/* Title + badge row */}
        <div
          style={{
            display: "flex",
            flexDirection: isDesktop ? "row" : "column",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "0.5rem",
          }}
        >
          <p
            style={{
              fontFamily: FONT_SERIF,
              fontWeight: 800,
              fontSize: "1.35rem",
              color: "#fafaf8",
              lineHeight: 1.2,
              margin: 0,
              flex: 1,
            }}
          >
            {p.title}
          </p>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: "0.5rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              padding: "3px 8px",
              borderRadius: "20px",
              flexShrink: 0,
              alignSelf: "flex-start",
              color: statusColor,
              border: `1px solid ${statusBorder}`,
              background: statusBg,
            }}
          >
            {p.status}
          </span>
        </div>

        {/* Company */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img
            src={p.logo}
            alt={p.company}
            loading="lazy"
            decoding="async"
            style={{
              height: `${Math.min(p.logoHeight, 32)}px`,
              width: "auto",
              maxWidth: "56px",
              objectFit: "contain",
              opacity: 0.8,
            }}
            onError={(e) =>
              ((e.currentTarget as HTMLImageElement).style.display = "none")
            }
          />
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: "0.62rem",
              letterSpacing: "0.09em",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            {p.company}
          </span>
        </div>

        <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

        {/* All bullets - always rendered; mask fades last bullet until hover */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {p.summary.map((bullet, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "0.55rem",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: "0.56rem",
                  color: "rgba(255,255,255,0.2)",
                  marginTop: "3px",
                  flexShrink: 0,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  width: "58px",
                }}
              >
                {SUMMARY_LABELS[i]}
              </span>
              <span
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "0.82rem",
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,0.5)",
                  textAlign: "justify",
                  textJustify: "inter-word",
                }}
              >
                {renderBullet(bullet)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Arrow - outside masked div, always fully visible */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "auto",
        }}
      >
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: "0.65rem",
            color: hovered ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
            transition: "color 0.2s",
          }}
        >
          ↗
        </span>
      </div>
    </m.div>
  );
}

export function Projects() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const secondaryProjects = projects.filter(
    (p) =>
      p.slug !== "hsbc-voice" &&
      p.slug !== "here-app" &&
      p.slug !== "pinns" &&
      p.slug !== "scholaros",
  );

  const orderedSecondary = [...secondaryProjects].sort((a, b) => {
    const aIsAward = a.status === "Best Outgoing Project • 2022–23";
    const bIsAward = b.status === "Best Outgoing Project • 2022–23";
    if (aIsAward === bIsAward) return 0;
    return aIsAward ? 1 : -1;
  });

  const maxPerRow = isMobile ? 1 : isTablet ? 2 : 3;
  const totalCount = orderedSecondary.length;
  const rows = useEqualRows(totalCount, maxPerRow);

  return (
    <section
      id="projects"
      style={{
        position: "relative",
        background: "transparent",
        padding: isMobile ? "5rem 4vw" : "4rem 0",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={isMobile ? {} : { padding: "0.85rem 6vw 2rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: "0.62rem",
                letterSpacing: "0.2em",
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
              }}
            >
              Projects
            </span>
            <div
              style={{
                flex: 1,
                height: "1px",
                background: "rgba(255,255,255,0.07)",
              }}
            />
          </div>

          <div style={{ overflow: "hidden" }}>
            <m.h2
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
              style={{
                fontFamily: FONT_SERIF,
                fontSize: isMobile
                  ? "clamp(1.8rem, 7vw, 4rem)"
                  : "clamp(2.6rem, 4.5vw, 4rem)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "0.02em",
                color: "#fafaf8",
                margin: 0,
              }}
            >
              Small things, actually shipped.
            </m.h2>
          </div>
        </div>

        {/* Content strip */}
        <div style={{ padding: isMobile ? "2rem 0 0" : "1.5rem 6vw 4rem" }}>
          <EqualGridRenderer
            rows={rows}
            align="stretch"
            renderCard={(idx) => (
              <ProjectCard p={orderedSecondary[idx]} index={idx} />
            )}
          />
        </div>
      </div>
    </section>
  );
}
