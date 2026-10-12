import { useEffect, useRef, useState } from "react";
import Placeholder, { clueIcon } from "@/components/Placeholder";
import { Button, ScreenHeader, SectionLabel } from "@/components/ui";
import type { CaseArt } from "@/data/art";
import { heldClues, type LoadedCase } from "@/lib/game";
import { SLOW_CONNECTION, STILL_WORKING, createSingleFlight, withStillWorking } from "@/lib/slow-request";
import type { Clue, Progress } from "@/lib/types";
import { pairKey, type CombineOutcome, type UnlockKind } from "@/lib/unlocker";

// Only for cases with locked clues switched on (see hasLockedClues in src/data/cases.ts).
export type CasebookLocked = {
  // Asks whether two held clues connect. Never throws.
  onConnect: (a: string, b: string) => Promise<CombineOutcome>;
  // Pairs (pairKey) that didn't connect this session.
  triedPairs: string[];
  // Clues revealed by connecting two others, with the two they came from.
  connections: { clueId: string; from: readonly [string, string] }[];
  // Hidden clues still to find, by how each is revealed. Never their content.
  slots: UnlockKind[];
};

const slotText: Record<UnlockKind, { icon: string; label: string }> = {
  confront: { icon: "🗣️", label: "Revealed by questioning" },
  combine: { icon: "🔗", label: "Revealed by connecting clues" },
};

export default function Casebook({
  bundle,
  art,
  progress,
  newClueIds = [],
  locked,
}: {
  bundle: LoadedCase;
  art: CaseArt | null;
  progress: Progress;
  // Unlocked clues not yet seen here: marked "New" until the player leaves the Casebook.
  newClueIds?: string[];
  locked?: CasebookLocked;
}) {
  const clues = heldClues(bundle, progress);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Still waiting after a few seconds: say so.
  const [slow, setSlow] = useState(false);
  // One check at a time, whatever the state says yet: a double tap sends one request.
  const flight = useRef(createSingleFlight());
  const [revealed, setRevealed] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; name: string } | null>(null);
  const mounted = useRef(true);
  const toastTimer = useRef<number | undefined>(undefined);
  const toastSeq = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  const canConnect = Boolean(locked) && clues.length >= 2;
  const pairTried =
    selected.length === 2 && Boolean(locked?.triedPairs.includes(pairKey(selected[0], selected[1])));
  const nameOf = (id: string) => clues.find((c) => c.id === id)?.name ?? "Evidence";

  const stopSelecting = () => {
    setSelecting(false);
    setSelected([]);
    setMessage(null);
  };

  // Tapping a selected clue again drops it; at most two can be picked.
  const toggle = (id: string) => {
    setMessage(null);
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 2 ? [...prev, id] : prev));
  };

  const connect = async () => {
    if (!locked || selected.length !== 2 || busy || pairTried) return;
    const [a, b] = selected;
    const sent = await flight.current.run(async () => {
      setBusy(true);
      setSlow(false);
      setMessage(null);
      return withStillWorking(locked.onConnect(a, b), () => mounted.current && setSlow(true));
    });
    if (!sent.sent || !mounted.current) return;
    const outcome = sent.value;
    setBusy(false);
    setSlow(false);
    switch (outcome.status) {
      case "unlocked": {
        stopSelecting();
        setRevealed(outcome.clue.id);
        const id = ++toastSeq.current;
        setToast({ id, name: outcome.clue.name });
        window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => {
          if (mounted.current) setToast((t) => (t?.id === id ? null : t));
        }, 2800);
        break;
      }
      case "already-unlocked":
        setMessage("You've already connected these.");
        break;
      case "no-match":
        setSelected([]);
        setMessage("These don't connect.");
        break;
      case "already-tried":
        setMessage("Already tried");
        break;
      case "error":
        // The pair stays picked, so tapping the message sends it again.
        setMessage(SLOW_CONNECTION);
        break;
    }
  };

  const connectionsFor = (c: Clue) =>
    (locked?.connections ?? []).filter((x) => x.from.includes(c.id)).map((x) => nameOf(x.clueId));

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader eyebrow={`Case ${bundle.caseData.case_number}`} title="Casebook" />
      <div className="flex flex-col gap-6 px-4 py-5">
        <section>
          <SectionLabel>Evidence ({clues.length})</SectionLabel>
          {canConnect && !selecting && (
            <Button variant="secondary" className="mb-3 w-full text-center" onClick={() => setSelecting(true)}>
              🔗 Connect evidence
            </Button>
          )}
          {selecting && (
            <div className="mb-3 flex flex-col gap-2 rounded-xl border border-brass-dim bg-ink-800 p-3">
              <p className="text-paper">
                {selected.length < 2
                  ? `Pick two pieces of evidence that belong together (${selected.length} of 2). Tap one again to drop it.`
                  : `Connect ${nameOf(selected[0])} with ${nameOf(selected[1])}?`}
              </p>
              <p role="status" aria-live="polite" className="min-h-6 text-sm font-semibold text-brass">
                {pairTried ? (
                  "Already tried"
                ) : busy ? (
                  slow ? STILL_WORKING : "Checking…"
                ) : message === SLOW_CONNECTION && selected.length === 2 ? (
                  <button type="button" onClick={connect} className="min-h-11 text-left underline underline-offset-4">
                    {SLOW_CONNECTION}
                  </button>
                ) : (
                  message
                )}
              </p>
              <div className="flex gap-2">
                <Button
                  className="flex-1 text-center"
                  disabled={selected.length !== 2 || busy || pairTried}
                  onClick={connect}
                >
                  Connect
                </Button>
                <Button variant="ghost" className="text-center" onClick={stopSelecting}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {!selecting && message && (
            <p role="status" className="mb-3 text-sm font-semibold text-brass">
              {message}
            </p>
          )}
          {clues.length === 0 ? (
            <p className="text-muted">No evidence yet. Examine the scene to find some.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {clues.map((c) => {
                const body = (
                  <>
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
                      <p className="font-semibold text-brass">
                        {c.name}
                        {newClueIds.includes(c.id) && (
                          <span className="ml-2 rounded-full bg-brass px-2 py-0.5 align-middle text-xs font-semibold text-ink-900">
                            New
                          </span>
                        )}
                      </p>
                      {c.found_description && <p className="text-paper/90">{c.found_description}</p>}
                      {connectionsFor(c).map((name) => (
                        <p key={name} className="mt-1 text-sm font-semibold text-verified">
                          🔗 Connected: revealed {name}
                        </p>
                      ))}
                    </div>
                  </>
                );
                if (selecting) {
                  const isSelected = selected.includes(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => toggle(c.id)}
                        className={`flex min-h-11 w-full gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
                          isSelected ? "border-brass bg-brass/10" : "border-transparent bg-ink-800 hover:border-brass-dim"
                        }`}
                      >
                        {body}
                      </button>
                    </li>
                  );
                }
                return (
                  <li
                    key={c.id}
                    className={`flex gap-3 rounded-lg bg-ink-800 p-3${revealed === c.id ? " anim-reveal ring-2 ring-brass" : ""}`}
                  >
                    {body}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {locked && locked.slots.length > 0 && (
          <section>
            <SectionLabel>Hidden evidence ({locked.slots.length} left)</SectionLabel>
            <ul className="grid grid-cols-2 gap-2">
              {locked.slots.map((kind, i) => (
                <li
                  key={i}
                  className="flex min-h-20 flex-col justify-center gap-1 rounded-lg border border-dashed border-ink-600 p-3 text-muted"
                >
                  <span aria-hidden className="text-xl">
                    {slotText[kind].icon}
                  </span>
                  <span className="text-sm">{slotText[kind].label}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

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

      {locked && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 mx-auto w-full max-w-[480px] px-4"
        >
          {toast && (
            <div
              key={toast.id}
              className="anim-toast flex items-center gap-3 rounded-xl border border-brass-dim bg-paper p-3 text-ink-900 shadow-xl shadow-black/50"
            >
              <span aria-hidden className="text-2xl">
                🔓
              </span>
              <span>
                <span className="block text-sm text-paper-ink">New evidence unlocked</span>
                <span className="block font-display text-lg leading-tight">{toast.name}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
