"use client";

import { useState } from "react";
import Placeholder, { clueIcon } from "@/components/Placeholder";
import { Button, ScreenHeader, SectionLabel } from "@/components/ui";
import { submitAccusation } from "@/lib/api";
import { collectedClues, type LoadedCase } from "@/lib/game";
import type { Progress, SavedResult } from "@/lib/types";
import type { CaseArt } from "@/data/art";

export default function Accuse({
  bundle,
  art,
  progress,
  onBack,
  onResult,
}: {
  bundle: LoadedCase;
  art: CaseArt | null;
  progress: Progress;
  onBack: () => void;
  onResult: (saved: SavedResult) => void;
}) {
  const [suspectId, setSuspectId] = useState<string | null>(null);
  const [cited, setCited] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clues = collectedClues(bundle.clues, progress);
  const suspect = bundle.suspects.find((s) => s.id === suspectId);

  const toggle = (id: string) =>
    setCited((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  // The server decides the outcome; the browser never knows the answer.
  const submit = async (accusedId: string) => {
    setSubmitting(true);
    setError(null);
    const accusation = { suspectId: accusedId, citedClueIds: cited };
    const res = await submitAccusation(bundle.caseData.id, accusation);
    setSubmitting(false);
    if (res.ok) onResult({ accusation, result: res.result });
    else setError(res.message);
  };

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        eyebrow="Accusation"
        title={suspect ? `Accuse ${suspect.name}` : "Who did it?"}
        onBack={suspect ? () => setSuspectId(null) : onBack}
        backLabel={suspect ? "Change suspect" : "Keep investigating"}
      />

      {!suspect ? (
        <div className="flex flex-col gap-3 px-4 py-5">
          <SectionLabel>Step 1 · Pick a suspect</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {bundle.suspects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSuspectId(s.id);
                  setCited([]);
                  setError(null);
                }}
                className="flex flex-col gap-2 rounded-lg border border-ink-700 bg-ink-800 p-2 transition-colors hover:border-danger"
              >
                <Placeholder
                  aspect="portrait"
                  label={s.name}
                  icon="👤"
                  art={art?.portraits[s.id]}
                  imageUrl={s.portrait_image_url}
                />
                <span className="font-display text-base text-paper">{s.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3 px-4 py-5">
          <SectionLabel>Step 2 · Cite the evidence that proves it</SectionLabel>
          {clues.length === 0 ? (
            <p className="text-muted">
              Your notebook is empty. Go back and collect some evidence first.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {clues.map((c) => {
                const checked = cited.includes(c.id);
                return (
                  <li key={c.id}>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        checked ? "border-brass bg-brass/10" : "border-ink-700 bg-ink-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(c.id)}
                        className="mt-1 h-4 w-4 accent-brass"
                      />
                      <span className="w-12 shrink-0">
                        <Placeholder
                          aspect="icon"
                          label={c.name}
                          icon={clueIcon(c.id)}
                          art={art?.clues[c.id]}
                          imageUrl={c.icon_image_url}
                          sizes="48px"
                          showLabel={false}
                        />
                      </span>
                      <span>
                        <span className="block font-semibold text-paper">{c.name}</span>
                        {c.found_description && (
                          <span className="block text-sm text-muted">{c.found_description}</span>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-auto flex flex-col gap-2 pt-4">
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-danger bg-danger-deep/30 p-3 text-paper"
              >
                {error}
              </p>
            )}
            <Button
              variant="danger"
              className="w-full text-center"
              disabled={cited.length === 0 || submitting}
              onClick={() => submit(suspect.id)}
            >
              {submitting
                ? "Checking your case…"
                : cited.length === 0
                  ? "Tick at least one piece of evidence"
                  : `Submit accusation (${cited.length} cited)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
