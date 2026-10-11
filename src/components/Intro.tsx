"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { case1Art } from "@/data/case1-art";
import { CASE1_CLUES } from "@/data/case1-ids";
import { COLD_OPEN_LINES, LINE_MS, nextColdOpenLine, type ColdOpenState } from "@/lib/intro";

// Scene 1: the cold open. Lines appear one at a time; Skip ends it at once.
export function ColdOpen({ onDone }: { onDone: () => void }) {
  const [state, setState] = useState<ColdOpenState>({ line: 0, done: false });
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (state.done) return;
    const t = window.setTimeout(() => {
      const next = nextColdOpenLine(state, COLD_OPEN_LINES.length);
      if (next.done) doneRef.current();
      else setState(next);
    }, LINE_MS);
    return () => window.clearTimeout(t);
  }, [state]);

  const isLast = state.line === COLD_OPEN_LINES.length - 1;
  const footprint = case1Art.clues[CASE1_CLUES.footprint];

  return (
    <div className="film-grain relative flex min-h-dvh flex-1 flex-col overflow-hidden bg-ink-950">
      <div aria-hidden className="absolute inset-0">
        <div className="intro-camera absolute inset-0">
          <Image
            src={case1Art.scene}
            alt=""
            fill
            preload
            sizes="(max-width: 480px) 100vw, 480px"
            className="object-cover object-[50%_60%] brightness-[0.6] saturate-[0.85]"
          />
        </div>
        {footprint && (
          // The whole boot print as a wide band across the middle, fading into the dark.
          <div
            className={`absolute inset-0 bg-ink-950 transition-opacity duration-1000 ${
              isLast ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="intro-camera-close absolute inset-x-0 top-[38%] aspect-[1236/604] -translate-y-1/2">
              <Image
                src={footprint}
                alt=""
                fill
                sizes="(max-width: 480px) 100vw, 480px"
                className="object-cover brightness-[0.8]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-ink-950),transparent_22%,transparent_78%,var(--color-ink-950))]" />
            </div>
          </div>
        )}
        <div className="intro-dawn absolute inset-0 bg-[radial-gradient(120%_60%_at_80%_0%,rgb(255_176_92/0.35),transparent_70%)]" />
        <div className="intro-haze absolute -inset-x-1/2 inset-y-0 bg-[linear-gradient(100deg,transparent_20%,rgb(242_235_221/0.07)_45%,transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-ink-950/70" />
        <div className="intro-emerge absolute inset-0 bg-ink-950" />
      </div>

      <button
        type="button"
        onClick={onDone}
        className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex min-h-11 items-center rounded-full bg-ink-950/70 px-4 font-semibold text-paper backdrop-blur hover:bg-ink-950"
      >
        Skip intro
      </button>

      <div className="relative mt-auto px-6 pb-[max(4rem,env(safe-area-inset-bottom))]">
        <p
          key={state.line}
          aria-live="polite"
          className={`intro-line ${
            state.line === 0
              ? "text-lg font-semibold tracking-[0.3em] text-brass"
              : "font-display text-3xl leading-snug text-paper"
          }`}
        >
          {COLD_OPEN_LINES[state.line]}
        </p>
      </div>
    </div>
  );
}

// Scene 2: the title screen.
export function TitleScreen({ onOpenCaseFile }: { onOpenCaseFile: () => void }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const openRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    openRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="film-grain relative flex min-h-dvh flex-1 flex-col overflow-hidden bg-ink-950">
      <div aria-hidden className="absolute inset-0">
        <div className="intro-camera absolute inset-0">
          <Image
            src={case1Art.scene}
            alt=""
            fill
            sizes="(max-width: 480px) 100vw, 480px"
            className="object-cover object-[50%_40%] brightness-[0.35] saturate-[0.7]"
          />
        </div>
        <div className="intro-dawn absolute inset-0 bg-[radial-gradient(90%_45%_at_50%_30%,rgb(217_165_72/0.28),transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/60 via-transparent to-ink-950" />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 pt-16 text-center">
        <h1 className="title-reveal flex flex-col items-center">
          <span className="bg-gradient-to-b from-[#f4dca0] via-brass to-[#a8772c] bg-clip-text font-display text-7xl font-semibold leading-none tracking-[0.12em] text-transparent">
            SABI
          </span>
          <span className="mt-2 pl-[0.45em] text-xl font-semibold tracking-[0.45em] text-brass">
            DETECTIVE
          </span>
        </h1>
        <div aria-hidden className="title-reveal-late mt-5 flex items-center gap-3 text-brass-dim">
          <span className="h-px w-12 bg-current" />
          <span className="h-1.5 w-1.5 rotate-45 bg-brass" />
          <span className="h-px w-12 bg-current" />
        </div>
        <p className="title-reveal-late mt-5 text-sm font-semibold tracking-[0.3em] text-paper/90">
          EVERY CLUE HAS A STORY.
        </p>
      </div>

      <div className="title-reveal-late relative flex flex-col gap-3 px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
        {helpOpen && (
          <section
            id="how-to-play"
            aria-labelledby="how-to-play-title"
            className="rounded-xl border border-brass-dim bg-paper p-4 text-left text-ink-900"
          >
            <h2 id="how-to-play-title" className="font-display text-xl">
              How to play
            </h2>
            <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5">
              <li>Examine the scene and tap the glowing spots to collect evidence.</li>
              <li>Question the suspects, then confront them with evidence that catches a lie.</li>
              <li>Everything you find is logged in your casebook.</li>
              <li>Accuse the culprit and cite the evidence that proves it.</li>
            </ol>
          </section>
        )}
        <button
          ref={openRef}
          type="button"
          onClick={onOpenCaseFile}
          className="flex min-h-14 items-center justify-center rounded-lg bg-brass px-4 text-lg font-semibold tracking-[0.15em] text-ink-900 hover:bg-brass/90"
        >
          OPEN CASE FILE
        </button>
        <button
          type="button"
          onClick={() => setHelpOpen((o) => !o)}
          aria-expanded={helpOpen}
          aria-controls="how-to-play"
          className="flex min-h-11 items-center justify-center rounded-lg px-4 font-semibold tracking-[0.15em] text-muted hover:text-paper"
        >
          {helpOpen ? "CLOSE HOW TO PLAY" : "HOW TO PLAY"}
        </button>
      </div>
    </div>
  );
}
