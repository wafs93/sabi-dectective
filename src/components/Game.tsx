"use client";

import { useCallback, useEffect, useState } from "react";
import Accuse from "@/components/Accuse";
import BottomNav, { type NavTab } from "@/components/BottomNav";
import Casebook from "@/components/Casebook";
import Home, { type HomeCase } from "@/components/Home";
import { ColdOpen, TitleScreen } from "@/components/Intro";
import Interrogation from "@/components/Interrogation";
import Result from "@/components/Result";
import SceneScreen from "@/components/SceneScreen";
import Suspects from "@/components/Suspects";
import { caseArt } from "@/data/art";
import { listCases } from "@/data/cases";
import {
  clearProgress,
  emptyProgress,
  heldClues,
  loadCase,
  readProgress,
  readResult,
  writeProgress,
  writeResult,
  type LoadedCase,
} from "@/lib/game";
import { readIntroSeen, shouldShowIntro, writeIntroSeen, type IntroStep } from "@/lib/intro";
import {
  bestResult,
  caseStatus,
  casesSolved,
  emptyRecord,
  rankFor,
  readRecord,
  recordVerdict,
  todaysCase,
  writeRecord,
  type PlayerRecord,
} from "@/lib/record";
import type { Contradiction, Progress, SavedResult } from "@/lib/types";

type Screen =
  | { name: "intro"; step: IntroStep }
  | { name: "home" }
  | { name: "scene" }
  | { name: "suspects" }
  | { name: "interrogate"; suspectId: string }
  | { name: "casebook" }
  | { name: "accuse" }
  | { name: "result"; saved: SavedResult };

const navScreens: Record<NavTab, Screen> = {
  scene: { name: "scene" },
  suspects: { name: "suspects" },
  casebook: { name: "casebook" },
  accuse: { name: "accuse" },
};

// Which bottom-bar tab is lit for each screen that shows the bar.
const navTabFor: Partial<Record<Screen["name"], NavTab>> = {
  scene: "scene",
  suspects: "suspects",
  interrogate: "suspects",
  casebook: "casebook",
  accuse: "accuse",
};

const cases = listCases();
const playableCases = cases.filter((c) => c.playable).map((c) => c.caseNumber);

export default function Game() {
  // The case the player opened from Home. null until they pick one: the game
  // first opens on today's case.
  const [caseNumber, setCaseNumber] = useState<number | null>(null);
  const [bundle, setBundle] = useState<LoadedCase | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [savedResult, setSavedResult] = useState<SavedResult | null>(null);
  // Display-only career record from localStorage; never used for scoring.
  const [record, setRecord] = useState<PlayerRecord>(emptyRecord);

  useEffect(() => {
    let cancelled = false;
    let rec = readRecord();
    // A game finished before the record existed still counts on the home screen.
    let backfilled = false;
    for (const n of playableCases) {
      const saved = rec.cases[String(n)] ? null : readResult(n);
      if (saved) {
        rec = recordVerdict(rec, n, saved.result.outcome);
        backfilled = true;
      }
    }
    if (backfilled) writeRecord(rec);
    const open = caseNumber ?? todaysCase(playableCases, rec);
    if (open === null) return;
    // First-time players get the opening; anyone with anything saved for any case goes
    // straight Home. Decided once, on the first load only, never when switching cases.
    const caseNumbers = cases.map((c) => c.caseNumber);
    const showIntro =
      caseNumber === null &&
      shouldShowIntro({
        introSeen: readIntroSeen(),
        hasProgress: caseNumbers.some((n) => {
          const p = readProgress(n);
          return p.foundClueIds.length + p.contradictions.length > 0;
        }),
        hasSavedResult: caseNumbers.some((n) => readResult(n) !== null),
        hasRecord: Object.keys(rec.cases).length > 0,
      });
    loadCase(open)
      .then((loaded) => {
        if (cancelled) return;
        setBundle(loaded);
        setProgress(readProgress(open));
        setSavedResult(readResult(open));
        if (showIntro) setScreen({ name: "intro", step: "cold-open" });
        setRecord(rec);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Could not load case.");
      });
    return () => {
      cancelled = true;
    };
  }, [caseNumber]);

  // The case on screen, once its file has loaded.
  const activeCase = bundle?.caseData.case_number ?? null;

  const updateProgress = useCallback(
    (update: (prev: Progress) => Progress) => {
      if (activeCase === null) return;
      setProgress((prev) => {
        const next = update(prev);
        writeProgress(activeCase, next);
        return next;
      });
    },
    [activeCase],
  );

  const collectClue = useCallback(
    (clueId: string) =>
      updateProgress((prev) =>
        prev.foundClueIds.includes(clueId)
          ? prev
          : { ...prev, foundClueIds: [...prev.foundClueIds, clueId] },
      ),
    [updateProgress],
  );

  const logContradiction = useCallback(
    (entry: Contradiction) =>
      updateProgress((prev) =>
        prev.contradictions.some((c) => c.questionId === entry.questionId)
          ? prev
          : { ...prev, contradictions: [...prev.contradictions, entry] },
      ),
    [updateProgress],
  );

  const playAgain = () => {
    if (activeCase === null) return;
    clearProgress(activeCase);
    setProgress(emptyProgress);
    setSavedResult(null);
    setScreen({ name: "home" });
  };

  const finishCase = (saved: SavedResult) => {
    if (activeCase === null) return;
    writeResult(activeCase, saved);
    setSavedResult(saved);
    setRecord((prev) => {
      const next = recordVerdict(prev, activeCase, saved.result.outcome);
      writeRecord(next);
      return next;
    });
    setScreen({ name: "result", saved });
  };

  const goHome = () => setScreen({ name: "home" });

  // Reaching the title (by watching or skipping) counts as having seen the intro.
  // Only the intro flag is written; progress and the record are never touched.
  const reachTitle = useCallback(() => {
    writeIntroSeen();
    setScreen({ name: "intro", step: "title" });
  }, []);

  // Opens a case from Home: its saved verdict if it has one, otherwise its scene.
  // Another case's file is loaded first.
  const openCase = (n: number) => {
    const saved = n === activeCase ? savedResult : readResult(n);
    if (n !== activeCase) {
      setBundle(null);
      setCaseNumber(n);
    }
    setScreen(saved ? { name: "result", saved } : { name: "scene" });
  };

  // What Home shows for each case. The open case uses what is on screen;
  // the others read their saved game.
  const homeCase = ({ caseNumber: n, title, playable }: (typeof cases)[number]): HomeCase => {
    const active = n === activeCase;
    const saved = !playable ? null : active ? savedResult : readResult(n);
    const caseProgress = !playable ? emptyProgress : active ? progress : readProgress(n);
    return {
      caseNumber: n,
      title: active && bundle ? bundle.caseData.title : title,
      art: caseArt(n),
      playable,
      status: caseStatus({ caseNumber: n, savedResult: saved, progress: caseProgress, record }),
      hasSavedResult: saved !== null,
    };
  };

  if (loadError) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-muted">
        {loadError}
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-muted">
        Opening case file…
      </div>
    );
  }

  const art = caseArt(bundle.caseData.case_number);
  const navTab = navTabFor[screen.name];

  return (
    <>
      {renderScreen()}
      {navTab && (
        <BottomNav
          active={navTab}
          casebookCount={progress.foundClueIds.length + progress.contradictions.length}
          onNavigate={(tab) => setScreen(navScreens[tab])}
        />
      )}
    </>
  );

  function renderScreen() {
    if (!bundle) return null;
    switch (screen.name) {
      case "intro":
        return screen.step === "cold-open" ? (
          <ColdOpen onDone={reachTitle} />
        ) : (
          <TitleScreen onOpenCaseFile={goHome} />
        );

      case "home": {
        const solved = casesSolved(record);
        const today = todaysCase(playableCases, record) ?? bundle.caseData.case_number;
        return (
          <Home
            cases={cases.map(homeCase)}
            todayCaseNumber={today}
            rank={rankFor(solved)}
            solved={solved}
            best={bestResult(record)}
            usingLocalData={bundle.source === "local" && today === activeCase}
            onOpenCase={openCase}
          />
        );
      }

      case "scene":
        return (
          <SceneScreen
            bundle={bundle}
            art={art}
            progress={progress}
            onCollectClue={collectClue}
            onHome={goHome}
          />
        );

      case "suspects":
        return (
          <Suspects
            bundle={bundle}
            art={art}
            onOpenSuspect={(suspectId) => setScreen({ name: "interrogate", suspectId })}
          />
        );

      case "interrogate": {
        const suspect = bundle.suspects.find((s) => s.id === screen.suspectId);
        if (!suspect) return null;
        return (
          <Interrogation
            key={suspect.id}
            suspect={suspect}
            portrait={art?.portraits[suspect.id]}
            heldClues={heldClues(bundle, progress)}
            progress={progress}
            onContradiction={logContradiction}
            onBack={() => setScreen({ name: "suspects" })}
          />
        );
      }

      case "casebook":
        return <Casebook bundle={bundle} art={art} progress={progress} />;

      case "accuse":
        return (
          <Accuse
            bundle={bundle}
            art={art}
            progress={progress}
            onBack={() => setScreen({ name: "scene" })}
            onResult={finishCase}
          />
        );

      case "result":
        return (
          <Result
            bundle={bundle}
            saved={screen.saved}
            progress={progress}
            portrait={art?.portraits[screen.saved.accusation.suspectId]}
            onPlayAgain={playAgain}
            onHome={goHome}
          />
        );
    }
  }
}
