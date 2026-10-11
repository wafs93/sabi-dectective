"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Placeholder, { clueIcon } from "@/components/Placeholder";
import { SectionLabel } from "@/components/ui";
import type { CaseArt, Hotspot } from "@/data/case1-art";
import type { LoadedCase } from "@/lib/game";
import type { Clue, Progress } from "@/lib/types";

type Toast = { id: number; clue: Clue; isNew: boolean };

export default function SceneScreen({
  bundle,
  art,
  progress,
  onCollectClue,
  onHome,
}: {
  bundle: LoadedCase;
  art: CaseArt | null;
  progress: Progress;
  onCollectClue: (clueId: string) => void;
  onHome: () => void;
}) {
  const [flashId, setFlashId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const timers = useRef<number[]>([]);
  const toastSeq = useRef(0);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  const clueById = (id: string) => bundle.clues.find((c) => c.id === id);
  const isFound = (id: string) => progress.foundClueIds.includes(id);

  // Same collection as before (Game.collectClue); this only adds the feedback.
  const examine = (clue: Clue) => {
    const isNew = !isFound(clue.id);
    onCollectClue(clue.id);
    setFlashId(clue.id);
    toastSeq.current += 1;
    setToast({ id: toastSeq.current, clue, isNew });
    timers.current.push(
      window.setTimeout(() => setFlashId(null), 700),
      window.setTimeout(() => setToast((t) => (t?.clue.id === clue.id ? null : t)), 2800),
    );
  };

  const hotspots = (art?.hotspots ?? []).filter((h) => clueById(h.clueId));
  const foundCount = bundle.clues.filter((c) => isFound(c.id)).length;

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-4 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onHome}
          className="-ml-2 flex min-h-11 items-center px-2 text-sm font-semibold text-muted hover:text-brass"
        >
          ← Home
        </button>
        <p className="text-sm text-brass">Case {bundle.caseData.case_number}</p>
        <h1 className="font-display text-3xl leading-tight text-paper">{bundle.caseData.title}</h1>
        <details className="group mt-2">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-muted hover:text-paper">
            <span aria-hidden className="transition-transform group-open:rotate-90">
              ▸
            </span>
            Read the briefing
          </summary>
          <p className="mt-1 rounded-lg bg-paper p-4 leading-relaxed text-ink-900">
            {bundle.caseData.briefing_text}
          </p>
        </details>
      </header>

      {art ? (
        <div className="relative w-full overflow-hidden">
          <Image
            src={art.scene}
            alt={art.sceneAlt}
            preload
            sizes="(max-width: 480px) 100vw, 480px"
            className="block h-auto w-full"
          />
          <div
            aria-hidden
            className="anim-flicker pointer-events-none absolute left-[19.5%] top-[21%] h-[38%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_196_110/0.35),transparent)] mix-blend-screen"
          />
          {hotspots.map((h) => (
            <HotspotButton
              key={h.clueId}
              hotspot={h}
              clue={clueById(h.clueId)!}
              found={isFound(h.clueId)}
              flashing={flashId === h.clueId}
              onExamine={examine}
            />
          ))}
        </div>
      ) : (
        <div className="px-4">
          <Placeholder aspect="scene" label={bundle.caseData.title} icon="🏚️" />
        </div>
      )}

      <section className="px-4 py-5" aria-labelledby="scene-evidence">
        <SectionLabel>
          <span id="scene-evidence">
            Evidence in this scene ({foundCount} of {bundle.clues.length} found)
          </span>
        </SectionLabel>
        {hotspots.length > 0 && (
          <p className="mb-3 text-muted">Tap the glowing spots in the picture, or examine from this list.</p>
        )}
        <ul className="flex flex-col gap-2">
          {bundle.clues.map((c) => {
            const found = isFound(c.id);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => examine(c)}
                  aria-pressed={found}
                  className={`flex min-h-16 w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors ${
                    found
                      ? "border-verified/60 bg-verified-deep/60"
                      : "border-ink-700 bg-ink-800 hover:border-brass-dim"
                  }`}
                >
                  <div className="w-14 shrink-0">
                    <Placeholder
                      aspect="icon"
                      label={c.name}
                      icon={clueIcon(c.id)}
                      art={art?.clues[c.id]}
                      imageUrl={c.icon_image_url}
                      sizes="56px"
                      showLabel={false}
                    />
                  </div>
                  <span className="flex-1">
                    <span className="block font-semibold text-paper">{c.name}</span>
                    <span className={`block text-sm ${found ? "text-verified" : "text-muted"}`}>
                      {found ? "✓ In your casebook" : "Not examined yet"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

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
              {toast.isNew ? "🔎" : "📁"}
            </span>
            <span>
              <span className="block text-sm text-paper-ink">
                {toast.isNew ? "Evidence found" : "Already in your casebook"}
              </span>
              <span className="block font-display text-lg leading-tight">{toast.clue.name}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function HotspotButton({
  hotspot,
  clue,
  found,
  flashing,
  onExamine,
}: {
  hotspot: Hotspot;
  clue: Clue;
  found: boolean;
  flashing: boolean;
  onExamine: (clue: Clue) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onExamine(clue)}
      aria-pressed={found}
      aria-label={found ? `${clue.name}, in your casebook` : `Examine ${hotspot.label}`}
      style={{
        left: `${hotspot.x}%`,
        top: `${hotspot.y}%`,
        width: `max(44px, ${hotspot.size}%)`,
      }}
      className={`absolute flex aspect-square -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 transition-colors focus-visible:outline-4 focus-visible:outline-offset-4 ${
        found
          ? "border-verified bg-verified-deep/70 text-verified"
          : "anim-breathe border-dashed border-brass bg-ink-950/25 text-brass hover:bg-ink-950/45"
      } ${flashing ? "anim-found" : ""}`}
    >
      <span aria-hidden className="text-2xl font-bold drop-shadow">
        {found ? "✓" : "?"}
      </span>
    </button>
  );
}
