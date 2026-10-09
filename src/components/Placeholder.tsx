type Aspect = "scene" | "portrait" | "icon";

const aspectClass: Record<Aspect, string> = {
  scene: "aspect-video",
  portrait: "aspect-[3/4]",
  icon: "aspect-square",
};

const tones = [
  "from-rust-dim to-noir-800",
  "from-amber-dim to-noir-800",
  "from-noir-600 to-noir-900",
  "from-[#4a2a3a] to-noir-800",
  "from-[#2a3f3a] to-noir-800",
];

function toneFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return tones[Math.abs(hash) % tones.length];
}

// Static art slot: renders imageUrl when set, otherwise a colored block with an icon and label.
export default function Placeholder({
  aspect,
  label,
  icon,
  imageUrl,
  className = "",
  showLabel = true,
}: {
  aspect: Aspect;
  label: string;
  icon?: string;
  imageUrl?: string | null;
  className?: string;
  showLabel?: boolean;
}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={label}
        className={`${aspectClass[aspect]} w-full rounded-lg object-cover ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={`${aspectClass[aspect]} flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-noir-600 bg-gradient-to-br p-2 text-center ${toneFor(label)} ${className}`}
    >
      {icon && <span className={aspect === "icon" ? "text-2xl" : "text-4xl"}>{icon}</span>}
      {showLabel && (
        <span
          className={`font-display leading-tight text-paper/80 ${aspect === "icon" ? "text-[10px]" : "text-sm"}`}
        >
          {label}
        </span>
      )}
    </div>
  );
}

const clueIcons: Record<string, string> = {
  "Torn wage ledger page": "📄",
  "Market security log": "📓",
  "Muddy footprint": "👣",
};

export function clueIcon(name: string) {
  return clueIcons[name] ?? "🔍";
}
