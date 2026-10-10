import { Button } from "@/components/ui";
import type { LoadedCase } from "@/lib/game";
import type { ResultTier, SavedResult } from "@/lib/types";

const tierStyle: Record<ResultTier, { stamp: string; accent: string }> = {
  cracked: { stamp: "🏆", accent: "border-brass text-brass" },
  close: { stamp: "⚖️", accent: "border-brass-dim text-paper" },
  missed: { stamp: "✖", accent: "border-danger text-danger" },
};

export default function Result({
  bundle,
  saved,
  onPlayAgain,
}: {
  bundle: LoadedCase;
  saved: SavedResult;
  onPlayAgain: () => void;
}) {
  // Everything shown here came from the server's /api/accuse response.
  const { accusation, result } = saved;
  const accused = bundle.suspects.find((s) => s.id === accusation.suspectId);
  const cited = bundle.clues.filter((c) => accusation.citedClueIds.includes(c.id));
  const style = tierStyle[result.outcome] ?? tierStyle.missed;

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-8">
      <p className="pt-[env(safe-area-inset-top)] text-muted">
        Case {bundle.caseData.case_number} · {bundle.caseData.title}
      </p>

      <div
        className={`flex flex-col items-center gap-2 rounded-xl border-2 bg-ink-800 px-4 py-8 text-center ${style.accent}`}
      >
        <span aria-hidden className="text-5xl">{style.stamp}</span>
        <h1 className="font-display text-4xl">
          {result.title}
        </h1>
      </div>

      <p className="text-lg leading-relaxed text-paper/90">{result.explanation}</p>

      {result.feedback.length > 0 && (
        <ul className="flex flex-col gap-1 text-paper/90">
          {result.feedback.map((line) => (
            <li key={line}>· {line}</li>
          ))}
        </ul>
      )}

      <div className="rounded-lg bg-ink-800 p-4">
        <p className="text-muted">
          You accused <span className="font-semibold text-paper">{accused?.name ?? "nobody"}</span>
        </p>
        <p className="mt-1 text-muted">
          Evidence cited:{" "}
          <span className="text-paper">
            {cited.length > 0 ? cited.map((c) => c.name).join(", ") : "none"}
          </span>
        </p>
      </div>

      <Button onClick={onPlayAgain} className="mt-auto text-center text-base">
        Play again
      </Button>
    </div>
  );
}
