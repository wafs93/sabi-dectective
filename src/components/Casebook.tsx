import Placeholder, { clueIcon } from "@/components/Placeholder";
import { ScreenHeader, SectionLabel } from "@/components/ui";
import type { CaseArt } from "@/data/art";
import { collectedClues, type LoadedCase } from "@/lib/game";
import type { Progress } from "@/lib/types";

export default function Casebook({
  bundle,
  art,
  progress,
}: {
  bundle: LoadedCase;
  art: CaseArt | null;
  progress: Progress;
}) {
  const clues = collectedClues(bundle.clues, progress);

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader eyebrow={`Case ${bundle.caseData.case_number}`} title="Casebook" />
      <div className="flex flex-col gap-6 px-4 py-5">
        <section>
          <SectionLabel>Evidence ({clues.length})</SectionLabel>
          {clues.length === 0 ? (
            <p className="text-muted">No evidence yet. Examine the scene to find some.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {clues.map((c) => (
                <li key={c.id} className="flex gap-3 rounded-lg bg-ink-800 p-3">
                  <div className="w-16 shrink-0">
                    <Placeholder
                      aspect="icon"
                      label={c.name}
                      icon={clueIcon(c.id)}
                      art={art?.clues[c.id]}
                      imageUrl={c.icon_image_url}
                      sizes="64px"
                      showLabel={false}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-brass">{c.name}</p>
                    {c.found_description && <p className="text-paper/90">{c.found_description}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <SectionLabel>Contradictions ({progress.contradictions.length})</SectionLabel>
          {progress.contradictions.length === 0 ? (
            <p className="text-muted">None logged. Confront suspects with evidence to catch them out.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {progress.contradictions.map((c) => (
                <li key={c.questionId} className="rounded-lg border-l-4 border-danger bg-ink-800 p-3">
                  <p className="text-sm font-semibold text-danger">Contradiction · {c.suspectName}</p>
                  <p className="mt-1 text-sm text-muted">
                    Asked: “{c.question}” · Evidence: {c.clueName}
                  </p>
                  <p className="mt-2 text-paper/90">You: “{c.confrontText}”</p>
                  <p className="mt-1 italic text-paper">
                    {c.suspectName}: “{c.answer}”
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
