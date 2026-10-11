"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";
import Placeholder, { clueIcon } from "@/components/Placeholder";
import { Button, SectionLabel } from "@/components/ui";
import { interrogations, type InterrogationQuestion } from "@/data/interrogations";
import type { Clue, Contradiction, Progress, Suspect, UnlockedClue } from "@/lib/types";

type Message =
  | { id: number; from: "suspect"; text: string; confronted: boolean }
  | { id: number; from: "player"; text: string; evidence?: string }
  // A locked clue this confront revealed.
  | { id: number; from: "evidence"; text: string };

export default function Interrogation({
  suspect,
  portrait,
  heldClues,
  progress,
  onContradiction,
  onConfrontUnlock,
  onBack,
}: {
  suspect: Suspect;
  portrait?: StaticImageData;
  // The clues the player holds (see heldClues in src/lib/game.ts).
  heldClues: Clue[];
  progress: Progress;
  onContradiction: (entry: Contradiction) => void;
  // Only for cases with locked clues: asks whether this confront reveals one. Resolves to
  // the new clue, or null for anything else (including errors), and never throws.
  onConfrontUnlock?: (suspectId: string, clueId: string) => Promise<UnlockedClue | null>;
  onBack: () => void;
}) {
  const script = interrogations[suspect.id];
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, from: "suspect", text: script?.openingLine ?? "…", confronted: false },
  ]);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [unlockToast, setUnlockToast] = useState<{ id: number; name: string } | null>(null);
  const nextId = useRef(1);
  const endRef = useRef<HTMLLIElement>(null);
  const mounted = useRef(true);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  // Keep the newest line in view. Instant scroll when reduced motion is requested.
  useEffect(() => {
    if (messages.length < 2) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    endRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }, [messages.length]);

  const clueName = (id: string) => heldClues.find((c) => c.id === id)?.name ?? "Evidence";

  // Unchanged rule: a question can be confronted once its unlocking clue has been found.
  const canConfront = (q: InterrogationQuestion) =>
    Boolean(q.unlockedByClueId && q.confrontText && q.confrontedAnswer) &&
    progress.foundClueIds.includes(q.unlockedByClueId!);

  const say = (player: Omit<Extract<Message, { from: "player" }>, "id">, reply: string, confronted: boolean) => {
    const a = nextId.current++;
    const b = nextId.current++;
    setMessages((prev) => [
      ...prev,
      { id: a, ...player },
      { id: b, from: "suspect", text: reply, confronted },
    ]);
  };

  const ask = (q: InterrogationQuestion) =>
    say({ from: "player", text: q.text }, q.defaultAnswer, false);

  const confront = (q: InterrogationQuestion) => {
    say(
      { from: "player", text: q.confrontText!, evidence: clueName(q.unlockedByClueId!) },
      q.confrontedAnswer!,
      true,
    );
    onContradiction({
      suspectId: suspect.id,
      questionId: q.id,
      suspectName: suspect.name,
      question: q.text,
      clueName: clueName(q.unlockedByClueId!),
      confrontText: q.confrontText!,
      answer: q.confrontedAnswer!,
    });
    setEvidenceOpen(false);

    // After the confront has played as usual, quietly ask whether it reveals a locked clue.
    // Nothing waits on this, and only a new clue shows anything.
    void onConfrontUnlock?.(suspect.id, q.unlockedByClueId!).then((clue) => {
      if (!clue || !mounted.current) return;
      const id = nextId.current++;
      setMessages((prev) => [...prev, { id, from: "evidence", text: clue.name }]);
      setUnlockToast({ id, name: clue.name });
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => {
        if (mounted.current) setUnlockToast((t) => (t?.id === id ? null : t));
      }, 2800);
    });
  };

  const questions = script?.questions ?? [];
  const foundClues = heldClues;
  const confrontable = questions.filter(canConfront);
  const logged = (q: InterrogationQuestion) =>
    progress.contradictions.some((c) => c.questionId === q.id);

  return (
    <div className="flex flex-1 flex-col">
      {/* Portrait header */}
      <header className="relative">
        {portrait || suspect.portrait_image_url ? (
          <div className="relative h-80 w-full overflow-hidden">
            <Image
              src={portrait ?? suspect.portrait_image_url!}
              alt={`Portrait of ${suspect.name}`}
              fill
              preload
              sizes="(max-width: 480px) 100vw, 480px"
              className="object-cover object-[50%_18%]"
              unoptimized={!portrait}
            />
          </div>
        ) : (
          <div className="px-4 pt-16">
            <Placeholder aspect="scene" label={suspect.name} icon="👤" showLabel={false} />
          </div>
        )}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-ink-900 via-ink-900/85 to-transparent"
        />
        <button
          type="button"
          onClick={onBack}
          className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] flex min-h-11 items-center gap-1 rounded-full bg-ink-950/75 px-4 font-semibold text-paper backdrop-blur hover:bg-ink-950"
        >
          <span aria-hidden>←</span> Suspects
        </button>
        <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
          <p className="text-sm text-brass">Interrogation</p>
          <h1 className="font-display text-4xl leading-tight text-paper">{suspect.name}</h1>
          {suspect.connection && <p className="mt-1 text-paper/90">{suspect.connection}</p>}
        </div>
      </header>

      {/* Conversation */}
      <section aria-label={`Conversation with ${suspect.name}`} className="px-4 pb-2 pt-4">
        <ol aria-live="polite" className="flex flex-col gap-3">
          {messages.map((m, i) => (
            <li
              key={m.id}
              ref={i === messages.length - 1 ? endRef : undefined}
              // Scroll margin keeps the newest line clear of the bottom bar.
              className={`flex scroll-mb-28 flex-col ${m.from === "player" ? "items-end" : "items-start"}`}
            >
              {m.from === "evidence" ? (
                <p className="self-center rounded-full border border-brass/70 bg-brass-deep/60 px-4 py-2 text-center text-sm font-semibold text-brass">
                  New evidence: {m.text}
                </p>
              ) : m.from === "player" ? (
                <div
                  className={`max-w-[85%] rounded-2xl rounded-br-sm px-4 py-3 ${
                    m.evidence
                      ? "border border-danger/80 bg-ink-700 text-paper"
                      : "bg-ink-700 text-paper"
                  }`}
                >
                  <p className="text-sm font-semibold text-brass">
                    {m.evidence ? `You, showing: ${m.evidence}` : "You"}
                  </p>
                  <p>“{m.text}”</p>
                </div>
              ) : (
                <>
                  <div
                    className={`max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-3 ${
                      m.confronted
                        ? "border border-danger bg-danger-deep text-paper"
                        : "bg-paper text-ink-900"
                    }`}
                  >
                    <p
                      className={`text-sm font-semibold ${m.confronted ? "text-danger" : "text-paper-ink"}`}
                    >
                      {suspect.name}
                    </p>
                    <p>“{m.text}”</p>
                  </div>
                  {m.confronted && (
                    <p className="mt-1 text-sm font-semibold text-danger">
                      Contradiction logged in your casebook
                    </p>
                  )}
                </>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Actions */}
      <section className="flex flex-col gap-3 border-t border-ink-700 px-4 py-5">
        <SectionLabel>Ask {suspect.name}</SectionLabel>
        {!script && <p className="text-muted">{suspect.name} has nothing to say.</p>}
        {questions.map((q) => (
          <Button key={q.id} variant="secondary" onClick={() => ask(q)}>
            {q.text}
          </Button>
        ))}

        {script && (
          <>
            <Button
              variant="danger"
              className="mt-2 flex items-center justify-between gap-3"
              aria-expanded={evidenceOpen}
              aria-controls="confront-evidence"
              onClick={() => setEvidenceOpen((o) => !o)}
            >
              <span>Confront with evidence</span>
              <span aria-hidden>{evidenceOpen ? "▴" : "▾"}</span>
            </Button>

            {evidenceOpen && (
              <div
                id="confront-evidence"
                className="flex flex-col gap-2 rounded-xl border border-ink-600 bg-ink-800 p-3"
              >
                {foundClues.length === 0 ? (
                  <p className="text-muted">
                    You have no evidence yet. Examine the scene to find some.
                  </p>
                ) : (
                  <>
                    <p className="text-muted">
                      {confrontable.length > 0
                        ? `Choose the evidence to put to ${suspect.name}.`
                        : `None of your evidence contradicts what ${suspect.name} has said.`}
                    </p>
                    <ul className="flex flex-col gap-2">
                      {foundClues.map((clue) => {
                        const uses = confrontable.filter((q) => q.unlockedByClueId === clue.id);
                        if (uses.length === 0) {
                          return (
                            <li
                              key={clue.id}
                              className="flex min-h-14 items-center gap-3 rounded-lg border border-ink-700 p-2 text-muted"
                            >
                              <span aria-hidden className="w-8 text-center text-xl">
                                {clueIcon(clue.id)}
                              </span>
                              <span>
                                <span className="block">{clue.name}</span>
                                <span className="block text-sm">Nothing to confront here</span>
                              </span>
                            </li>
                          );
                        }
                        return uses.map((q) => (
                          <li key={`${clue.id}-${q.id}`}>
                            <button
                              type="button"
                              onClick={() => confront(q)}
                              className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-danger/70 bg-danger-deep/60 p-2 text-left text-paper hover:bg-danger-deep"
                            >
                              <span aria-hidden className="w-8 text-center text-xl">
                                {clueIcon(clue.id)}
                              </span>
                              <span className="flex-1">
                                <span className="block font-semibold">{clue.name}</span>
                                <span className="block text-sm text-paper/90">
                                  About: “{q.text}”
                                </span>
                              </span>
                              {logged(q) && (
                                <span className="text-sm font-semibold text-verified">✓ Logged</span>
                              )}
                            </button>
                          </li>
                        ));
                      })}
                    </ul>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 mx-auto w-full max-w-[480px] px-4"
      >
        {unlockToast && (
          <div
            key={unlockToast.id}
            className="anim-toast flex items-center gap-3 rounded-xl border border-brass-dim bg-paper p-3 text-ink-900 shadow-xl shadow-black/50"
          >
            <span aria-hidden className="text-2xl">
              🔓
            </span>
            <span>
              <span className="block text-sm text-paper-ink">New evidence unlocked</span>
              <span className="block font-display text-lg leading-tight">{unlockToast.name}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
