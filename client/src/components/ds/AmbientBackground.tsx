/**
 * AmbientBackground — expressive-layer backdrop for landing/auth surfaces.
 * Fixed, non-interactive layer with three drifting aurora orbs and a very
 * subtle ink dot-grid. Governed by the "Expressive layer" section of
 * DESIGN.md: do not mount on data or trading surfaces.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      data-testid="ambient-background"
    >
      {/* Subtle ink dot-grid */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(155, 163, 183, 0.07) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Drifting aurora orbs */}
      <div className="orb orb-violet w-[36rem] h-[36rem] -top-40 -left-40" />
      <div className="orb orb-cyan w-[32rem] h-[32rem] -bottom-32 -right-32" />
      <div className="orb orb-magenta w-[24rem] h-[24rem] top-1/3 right-[12%]" />
    </div>
  );
}

export default AmbientBackground;
