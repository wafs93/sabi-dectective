import Placeholder from "@/components/Placeholder";
import { ScreenHeader } from "@/components/ui";
import type { CaseArt } from "@/data/case1-art";
import type { LoadedCase } from "@/lib/game";

export default function Suspects({
  bundle,
  art,
  onOpenSuspect,
}: {
  bundle: LoadedCase;
  art: CaseArt | null;
  onOpenSuspect: (suspectId: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader eyebrow={`Case ${bundle.caseData.case_number}`} title="Suspects" />
      <div className="flex flex-col gap-3 px-4 py-5">
        <p className="text-muted">Tap a suspect to question them.</p>
        {bundle.suspects.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onOpenSuspect(s.id)}
            className="flex gap-3 rounded-lg border border-ink-700 bg-ink-800 p-3 text-left transition-colors hover:border-brass-dim"
          >
            <div className="w-24 shrink-0">
              <Placeholder
                aspect="portrait"
                label={s.name}
                icon="👤"
                art={art?.portraits[s.id]}
                imageUrl={s.portrait_image_url}
                sizes="96px"
                showLabel={false}
              />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-display text-xl text-paper">{s.name}</p>
              {s.connection && <p className="text-paper/90">{s.connection}</p>}
              {s.motive && (
                <p className="text-muted">
                  <span className="font-semibold text-danger">Motive: </span>
                  {s.motive}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
