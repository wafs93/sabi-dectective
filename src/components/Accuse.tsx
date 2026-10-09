"use client";

import { useState } from "react";
import Placeholder, { clueIcon } from "@/components/Placeholder";
import { Button, ScreenHeader, SectionLabel } from "@/components/ui";
import { collectedClues, type LoadedCase } from "@/lib/game";
import type { Accusation, Progress } from "@/lib/types";

export default function Accuse({
  bundle,
  progress,
  onBack,
  onSubmit,
}: {
  bundle: LoadedCase;
  progress: Progress;
  onBack: () => void;
  onSubmit: (accusation: Accusation) => void;
}) {
  const [suspectId, setSuspectId] = useState<string | null>(null);
  const [cited, setCited] = useState<string[]>([]);
  const clues = collectedClues(bundle.clues, progress);
  const suspect = bundle.suspects.find((s) => s.id === suspectId);

  const toggle = (id: string) =>
    setCited((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

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
                }}
                className="flex flex-col gap-2 rounded-lg border border-noir-700 bg-noir-800 p-2 transition-colors hover:border-rust"
              >
                <Placeholder
                  aspect="portrait"
                  label={s.name}
                  icon="👤"
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
            <p className="text-sm text-muted">
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
                        checked ? "border-amber bg-amber/10" : "border-noir-700 bg-noir-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(c.id)}
                        className="mt-1 h-4 w-4 accent-amber"
                      />
                      <span className="text-xl">{clueIcon(c.name)}</span>
                      <span>
                        <span className="block text-sm font-semibold text-paper">{c.name}</span>
                        {c.found_description && (
                          <span className="block text-xs text-muted">{c.found_description}</span>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-auto pt-4">
            <Button
              variant="danger"
              className="w-full text-center"
              disabled={cited.length === 0}
              onClick={() => onSubmit({ suspectId: suspect.id, citedClueIds: cited })}
            >
              {cited.length === 0
                ? "Tick at least one piece of evidence"
                : `Submit accusation (${cited.length} cited)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
