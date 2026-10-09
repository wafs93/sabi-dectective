import Placeholder, { clueIcon } from "@/components/Placeholder";
import { Button, ScreenHeader, SectionLabel } from "@/components/ui";
import { collectedClues, type LoadedCase } from "@/lib/game";
import type { Progress } from "@/lib/types";

export type InvestigateTab = "suspects" | "clues" | "notebook";

const tabs: { id: InvestigateTab; label: string }[] = [
  { id: "suspects", label: "Suspects" },
  { id: "clues", label: "Clues" },
  { id: "notebook", label: "Notebook" },
];

export default function Investigate({
  bundle,
  progress,
  tab,
  onTabChange,
  onCollectClue,
  onOpenSuspect,
  onAccuse,
  onBack,
}: {
  bundle: LoadedCase;
  progress: Progress;
  tab: InvestigateTab;
  onTabChange: (tab: InvestigateTab) => void;
  onCollectClue: (clueId: string) => void;
  onOpenSuspect: (suspectId: string) => void;
  onAccuse: () => void;
  onBack: () => void;
}) {
  const notebookCount = progress.foundClueIds.length + progress.contradictions.length;

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        eyebrow={`Case ${bundle.caseData.case_number} · Investigation`}
        title={bundle.caseData.title}
        onBack={onBack}
        backLabel="Briefing"
      />

      <nav className="grid grid-cols-3 border-b border-noir-700" role="tablist">
        {tabs.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(t.id)}
              className={`border-b-2 py-3 text-sm font-semibold transition-colors ${
                active ? "border-amber text-amber" : "border-transparent text-muted hover:text-paper"
              }`}
            >
              {t.label}
              {t.id === "notebook" && notebookCount > 0 && (
                <span className="ml-1 rounded-full bg-rust px-1.5 text-[10px] text-paper">
                  {notebookCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex-1 px-4 py-5">
        {tab === "suspects" && <SuspectsTab bundle={bundle} onOpenSuspect={onOpenSuspect} />}
        {tab === "clues" && (
          <CluesTab bundle={bundle} progress={progress} onCollectClue={onCollectClue} />
        )}
        {tab === "notebook" && <NotebookTab bundle={bundle} progress={progress} />}
      </div>

      <div className="sticky bottom-0 border-t border-noir-700 bg-noir-900 p-4">
        <Button variant="danger" onClick={onAccuse} className="w-full text-center">
          Make an accusation
        </Button>
      </div>
    </div>
  );
}

function SuspectsTab({
  bundle,
  onOpenSuspect,
}: {
  bundle: LoadedCase;
  onOpenSuspect: (suspectId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Tap a suspect to question them</SectionLabel>
      {bundle.suspects.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onOpenSuspect(s.id)}
          className="flex gap-3 rounded-lg border border-noir-700 bg-noir-800 p-3 text-left transition-colors hover:border-amber-dim"
        >
          <div className="w-20 shrink-0">
            <Placeholder
              aspect="portrait"
              label={s.name}
              icon="👤"
              imageUrl={s.portrait_image_url}
              showLabel={false}
            />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-display text-lg text-paper">{s.name}</p>
            {s.connection && <p className="text-sm text-paper/80">{s.connection}</p>}
            {s.motive && (
              <p className="text-xs text-muted">
                <span className="font-semibold text-rust">Motive: </span>
                {s.motive}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function CluesTab({
  bundle,
  progress,
  onCollectClue,
}: {
  bundle: LoadedCase;
  progress: Progress;
  onCollectClue: (clueId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Tap to collect evidence into your notebook</SectionLabel>
      <div className="grid grid-cols-3 gap-3">
        {bundle.clues.map((c) => {
          const found = progress.foundClueIds.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onCollectClue(c.id)}
              aria-pressed={found}
              className={`flex flex-col gap-2 rounded-lg border p-2 text-left transition-colors ${
                found
                  ? "border-amber bg-amber/10"
                  : "border-noir-700 bg-noir-800 hover:border-amber-dim"
              }`}
            >
              <Placeholder
                aspect="icon"
                label={c.name}
                icon={clueIcon(c.name)}
                imageUrl={c.icon_image_url}
                showLabel={false}
              />
              <span className="text-xs font-semibold leading-tight text-paper">{c.name}</span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${found ? "text-amber" : "text-muted"}`}
              >
                {found ? "✓ Collected" : "Tap to collect"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NotebookTab({ bundle, progress }: { bundle: LoadedCase; progress: Progress }) {
  const clues = collectedClues(bundle.clues, progress);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <SectionLabel>Evidence ({clues.length})</SectionLabel>
        {clues.length === 0 ? (
          <p className="text-sm text-muted">No evidence yet. Check the Clues tab.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {clues.map((c) => (
              <li key={c.id} className="flex gap-3 rounded-lg bg-noir-800 p-3">
                <span className="text-xl">{clueIcon(c.name)}</span>
                <div>
                  <p className="text-sm font-semibold text-amber">{c.name}</p>
                  {c.found_description && (
                    <p className="text-sm text-paper/80">{c.found_description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionLabel>Contradictions ({progress.contradictions.length})</SectionLabel>
        {progress.contradictions.length === 0 ? (
          <p className="text-sm text-muted">
            None logged. Confront suspects with evidence to catch them out.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {progress.contradictions.map((c) => (
              <li
                key={`${c.suspectName}-${c.question}`}
                className="rounded-lg border-l-4 border-rust bg-noir-800 p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-rust">
                  Contradiction · {c.suspectName}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Asked: “{c.question}” · Evidence: {c.clueName}
                </p>
                <p className="mt-2 text-sm text-paper/90">You: “{c.confrontText}”</p>
                <p className="mt-1 text-sm italic text-paper">
                  {c.suspectName}: “{c.answer}”
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
