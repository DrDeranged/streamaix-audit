/**
 * AmbientBackground — expressive-layer backdrop.
 *
 * mode="landing" (default): three drifting aurora orbs + dot grid, absolute
 *   positioning — mount inside a `relative overflow-hidden` container on
 *   landing/auth surfaces (see DESIGN.md "Expressive layer").
 *
 * mode="app": two large static radial glows (violet top-right, cyan
 *   bottom-left) + dot grid, fixed global positioning — mount once in App.tsx
 *   behind all authenticated content; z-index: -1 stays below page elements.
 *
 * Governed by design:lint — do not consume orb/aurora utilities outside this
 * file or the landing/auth surfaces listed in DESIGN.md.
 */

interface AmbientBackgroundProps {
  /**
   * "landing" (default): three drifting orbs, absolute positioning (landing/auth).
   * "app": two large static radial glows, fixed global positioning (data/trading).
   */
  mode?: "landing" | "app";
}

const DOT_GRID = {
  backgroundImage:
    "radial-gradient(circle, rgba(155, 163, 183, 0.07) 1px, transparent 1px)",
  backgroundSize: "28px 28px",
} as const;

export function AmbientBackground({ mode = "landing" }: AmbientBackgroundProps) {
  /* ── App mode: two static CSS radial glows, fixed behind all content ── */
  if (mode === "app") {
    return (
      <div
        aria-hidden="true"
        data-testid="ambient-background"
        style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none", overflow: "hidden" }}
      >
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.20]" style={DOT_GRID} />
        {/* Violet glow — top right at ~15% */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            width: "70vw",
            height: "70vw",
            top: "-20%",
            right: "-10%",
            background: "radial-gradient(circle, rgba(124,92,255,0.15) 0%, transparent 70%)",
            filter: "blur(48px)",
            pointerEvents: "none",
          }}
        />
        {/* Cyan glow — bottom left at ~12% */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            width: "60vw",
            height: "60vw",
            bottom: "-15%",
            left: "-10%",
            background: "radial-gradient(circle, rgba(0,229,255,0.10) 0%, transparent 70%)",
            filter: "blur(48px)",
            pointerEvents: "none",
          }}
        />
      </div>
    );
  }

  /* ── Landing mode: three drifting aurora orbs (strengthened for Neon Signal) ── */
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      data-testid="ambient-background"
    >
      {/* Subtle ink dot-grid */}
      <div className="absolute inset-0 opacity-[0.35]" style={DOT_GRID} />
      {/* Drifting aurora orbs — sizes increased for Neon Signal */}
      <div className="orb orb-violet w-[44rem] h-[44rem] -top-40 -left-40" />
      <div className="orb orb-cyan   w-[40rem] h-[40rem] -bottom-32 -right-32" />
      <div className="orb orb-magenta w-[32rem] h-[32rem] top-1/3 right-[12%]" />
    </div>
  );
}

export default AmbientBackground;
