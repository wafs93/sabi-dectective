import Image, { type StaticImageData } from "next/image";
import { Button } from "@/components/ui";
import type { LoadedCase } from "@/lib/game";
import type { ResultTier, SavedResult } from "@/lib/types";

// Outcome colours from the design tokens: brass, ivory, burgundy.
const tierStyle: Record<ResultTier, { title: string; tint: string; rule: string }> = {
  cracked: { title: "text-brass", tint: "bg-brass-deep/45", rule: "bg-brass" },
  close: { title: "text-paper", tint: "bg-ink-950/30", rule: "bg-paper" },
  missed: { title: "text-danger", tint: "bg-danger-deep/55", rule: "bg-danger" },
};

export default function Result({
  bundle,
  saved,
  portrait,
  onPlayAgain,
  onHome,
}: {
  bundle: LoadedCase;
  saved: SavedResult;
  portrait?: StaticImageData;
  onPlayAgain: () => void;
  onHome: () => void;
}) {
  // Everything shown here came from the server's /api/accuse response.
  const { accusation, result } = saved;
  const accused = bundle.suspects.find((s) => s.id === accusation.suspectId);
  const cited = bundle.clues.filter((c) => accusation.citedClueIds.includes(c.id));
  const style = tierStyle[result.outcome] ?? tierStyle.missed;
  const portraitSrc = portrait ?? accused?.portrait_image_url ?? null;

  return (
    <div className="flex flex-1 flex-col">
      {/* Verdict banner */}
      <header className="relative flex h-80 flex-col justify-end overflow-hidden">
        {portraitSrc && (
          <div className="reveal-portrait absolute inset-0">
            <Image
              src={portraitSrc}
              alt={accused ? `Portrait of ${accused.name}` : ""}
              fill
              preload
              sizes="(max-width: 480px) 100vw, 480px"
              className="object-cover object-[50%_18%] brightness-[0.55] saturate-[0.8]"
              unoptimized={!portrait}
            />
          </div>
        )}
        <div aria-hidden className={`absolute inset-0 ${style.tint}`} />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-ink-900 via-ink-900/80 to-transparent"
        />
        <p className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] rounded-full bg-ink-950/70 px-3 py-1 text-sm text-paper/90">
          Case {bundle.caseData.case_number} · {bundle.caseData.title}
        </p>
        <div className="reveal-title relative px-4 pb-5">
          <p className="text-paper/90">The verdict</p>
          <h1 className={`font-display text-5xl leading-tight ${style.title}`}>{result.title}</h1>
          <span aria-hidden className={`mt-3 block h-1 w-16 rounded-full ${style.rule}`} />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5">
        <div className="reveal-text flex flex-col gap-4">
          <p className="text-lg leading-relaxed text-paper/90">{result.explanation}</p>
          {result.feedback.length > 0 && (
            <ul className="flex flex-col gap-1 text-paper/90">
              {result.feedback.map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="reveal-summary rounded-lg bg-ink-800 p-4">
          <p className="text-muted">
            You accused{" "}
            <span className="font-semibold text-paper">{accused?.name ?? "nobody"}</span>
          </p>
          <p className="mt-1 text-muted">
            Evidence cited:{" "}
            <span className="text-paper">
              {cited.length > 0 ? cited.map((c) => c.name).join(", ") : "none"}
            </span>
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <Button onClick={onPlayAgain} className="text-center text-base">
            Play again
          </Button>
          <Button variant="ghost" onClick={onHome} className="text-center text-base">
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
}
