type AmbientBackgroundProps = {
  variant?: "page" | "soft";
};

export function AmbientBackground({ variant = "page" }: AmbientBackgroundProps) {
  return (
    <div className={`ambient-layer ambient-${variant}`} aria-hidden>
      <div className="ambient-aurora" />
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      <div className="ambient-orb ambient-orb-3" />
      <div className="ambient-grid" />
    </div>
  );
}
