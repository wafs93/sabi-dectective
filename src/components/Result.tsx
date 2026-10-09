import { Button } from "@/components/ui";
import { outcomes } from "@/data/outcomes";
import type { LoadedCase } from "@/lib/game";
import type { Accusation, ResultTier } from "@/lib/types";

const tierStyle: Record<ResultTier, { stamp: string; accent: string }> = {
  cracked: { stamp: "🏆", accent: "border-amber text-amber" },
  close: { stamp: "⚖️", accent: "border-amber-dim text-amber-dim" },
  missed: { stamp: "✖", accent: "border-rust text-rust" },
};

export default function Result({
  bundle,
  tier,
  accusation,
  onPlayAgain,
}: {
  bundle: LoadedCase;
  tier: ResultTier;
  accusation: Accusation;
  onPlayAgain: () => void;
}) {
  const result = outcomes[bundle.caseData.case_number]?.results[tier];
  const accused = bundle.suspects.find((s) => s.id === accusation.suspectId);
  const cited = bundle.clues.filter((c) => accusation.citedClueIds.includes(c.id));
  const style = tierStyle[tier];

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
        Case {bundle.caseData.case_number} · {bundle.caseData.title}
      </p>

      <div
        className={`flex flex-col items-center gap-2 rounded-xl border-2 bg-noir-800 px-4 py-8 text-center ${style.accent}`}
      >
        <span className="text-5xl">{style.stamp}</span>
        <h1 className="font-display text-3xl uppercase tracking-wide">
          {result?.title ?? tier}
        </h1>
      </div>

      {result && <p className="text-[15px] leading-relaxed text-paper/90">{result.text}</p>}

      <div className="rounded-lg bg-noir-800 p-4 text-sm">
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
