export function SoundToggle({
  enabled,
  available,
  onToggle,
}: {
  enabled: boolean;
  available: boolean;
  onToggle: () => void;
}) {
  const label = available
    ? enabled
      ? "Couper le son"
      : "Activer le son"
    : "Réessayer le son";
  return (
    <button
      className="sound-toggle"
      aria-label={label}
      title={label}
      aria-pressed={enabled && available}
      onClick={onToggle}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 5 6 9H3v6h3l5 4Z" />
        {enabled && available ? (
          <>
            <path d="M15 8a6 6 0 0 1 0 8" />
            <path d="M18 5a10 10 0 0 1 0 14" />
          </>
        ) : (
          <path d="m16 9 5 6m0-6-5 6" />
        )}
      </svg>
    </button>
  );
}
