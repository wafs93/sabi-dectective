import Image, { type StaticImageData } from "next/image";
import { CASE1_CLUES } from "@/data/case1-ids";
import { CASE2_CLUES } from "@/data/case2-ids";

type Aspect = "scene" | "portrait" | "icon";

const aspectClass: Record<Aspect, string> = {
  scene: "aspect-video",
  portrait: "aspect-[2/3]",
  icon: "aspect-square",
};

const tones = [
  "from-danger-deep to-ink-800",
  "from-brass-deep to-ink-800",
  "from-ink-600 to-ink-900",
  "from-[#4a2a3a] to-ink-800",
  "from-[#2a3f3a] to-ink-800",
];

function toneFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return tones[Math.abs(hash) % tones.length];
}

// Art slot: bundled art first, then a database image URL, otherwise a coloured block.
export default function Placeholder({
  aspect,
  label,
  icon,
  art,
  imageUrl,
  sizes = "(max-width: 480px) 50vw, 240px",
  className = "",
  showLabel = true,
}: {
  aspect: Aspect;
  label: string;
  icon?: string;
  art?: StaticImageData | null;
  imageUrl?: string | null;
  sizes?: string;
  className?: string;
  showLabel?: boolean;
}) {
  if (art || imageUrl) {
    return (
      <div className={`relative ${aspectClass[aspect]} w-full overflow-hidden rounded-lg ${className}`}>
        <Image
          src={art ?? imageUrl!}
          alt={label}
          fill
          sizes={sizes}
          className="object-cover"
          // Database URLs are external and not in remotePatterns; serve them as-is.
          unoptimized={!art}
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={`${aspectClass[aspect]} flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-ink-600 bg-gradient-to-br p-2 text-center ${toneFor(label)} ${className}`}
    >
      {icon && <span aria-hidden className={aspect === "icon" ? "text-2xl" : "text-4xl"}>{icon}</span>}
      {showLabel && (
        <span
          className={`font-display leading-tight text-paper/80 ${aspect === "icon" ? "text-xs" : "text-sm"}`}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// Fallback emoji per clue id, used when a clue has no art.
const clueIcons: Record<string, string> = {
  [CASE1_CLUES.ledger]: "📄",
  [CASE1_CLUES.securityLog]: "📓",
  [CASE1_CLUES.footprint]: "👣",
  [CASE2_CLUES.tollReceipt]: "🧾",
  [CASE2_CLUES.secondAgreement]: "📜",
  [CASE2_CLUES.keyLog]: "🔑",
  [CASE2_CLUES.debtLetter]: "✉️",
  [CASE2_CLUES.tornNote]: "📝",
};

export function clueIcon(clueId: string) {
  return clueIcons[clueId] ?? "🔍";
}
