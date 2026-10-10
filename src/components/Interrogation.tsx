"use client";

import { useState } from "react";
import Placeholder from "@/components/Placeholder";
import { Button, ScreenHeader, SectionLabel } from "@/components/ui";
import { interrogations, type InterrogationQuestion } from "@/data/interrogations";
import type { Clue, Contradiction, Progress, Suspect } from "@/lib/types";

type Exchange = { asked: string | null; answer: string; confronted: boolean };

export default function Interrogation({
  suspect,
  clues,
  progress,
  onContradiction,
  onBack,
}: {
  suspect: Suspect;
  clues: Clue[];
  progress: Progress;
  onContradiction: (entry: Contradiction) => void;
  onBack: () => void;
}) {
  const script = interrogations[suspect.id];
  const [exchange, setExchange] = useState<Exchange>({
    asked: null,
    answer: script?.openingLine ?? "…",
    confronted: false,
  });

  const clueName = (id: string) => clues.find((c) => c.id === id)?.name ?? "Evidence";

  const canConfront = (q: InterrogationQuestion) =>
    Boolean(q.unlockedByClueId && q.confrontText && q.confrontedAnswer) &&
    progress.foundClueIds.includes(q.unlockedByClueId!);

  const ask = (q: InterrogationQuestion) =>
    setExchange({ asked: q.text, answer: q.defaultAnswer, confronted: false });

  const confront = (q: InterrogationQuestion) => {
    setExchange({ asked: q.confrontText!, answer: q.confrontedAnswer!, confronted: true });
    onContradiction({
      suspectId: suspect.id,
      questionId: q.id,
      suspectName: suspect.name,
      question: q.text,
      clueName: clueName(q.unlockedByClueId!),
      confrontText: q.confrontText!,
      answer: q.confrontedAnswer!,
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader eyebrow="Interrogation" title={suspect.name} onBack={onBack} />

      <div className="flex gap-3 px-4 py-5">
        <div className="w-[38%] shrink-0">
          <Placeholder
            aspect="portrait"
            label={suspect.name}
            icon="👤"
            imageUrl={suspect.portrait_image_url}
          />
        </div>

        <div className="flex flex-1 flex-col justify-center gap-2">
          {exchange.asked && (
            <p className="self-end rounded-lg bg-noir-700 px-3 py-2 text-xs text-muted">
              You: “{exchange.asked}”
            </p>
          )}
          <div
            className={`relative rounded-xl border p-3 text-[15px] leading-snug ${
              exchange.confronted
                ? "border-rust bg-rust-dim/30 text-paper"
                : "border-noir-600 bg-paper text-noir-950"
            }`}
          >
            <span
              aria-hidden
              className={`absolute -left-2 top-5 h-4 w-4 rotate-45 border-b border-l ${
                exchange.confronted ? "border-rust bg-[#3b2116]" : "border-noir-600 bg-paper"
              }`}
            />
            <p className="relative">“{exchange.answer}”</p>
          </div>
          {exchange.confronted && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-rust">
              Contradiction logged in notebook
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-noir-700 px-4 py-5">
        <SectionLabel>Questions</SectionLabel>
        {!script && <p className="text-sm text-muted">{suspect.name} has nothing to say.</p>}
        {script?.questions.map((q) => (
          <div key={q.id} className="flex flex-col gap-2">
            <Button variant="secondary" onClick={() => ask(q)}>
              {q.text}
            </Button>
            {canConfront(q) && (
              <Button variant="danger" onClick={() => confront(q)}>
                <span className="block text-[10px] uppercase tracking-wider text-amber">
                  Confront with: {clueName(q.unlockedByClueId!)}
                </span>
                “{q.confrontText}”
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
