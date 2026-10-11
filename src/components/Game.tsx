"use client";

import { useCallback, useEffect, useState } from "react";
import Accuse from "@/components/Accuse";
import BottomNav, { type NavTab } from "@/components/BottomNav";
import Casebook from "@/components/Casebook";
import Home from "@/components/Home";
import { ColdOpen, TitleScreen } from "@/components/Intro";
import Interrogation from "@/components/Interrogation";
import Result from "@/components/Result";
import SceneScreen from "@/components/SceneScreen";
import Suspects from "@/components/Suspects";
import { caseArt } from "@/data/case1-art";
import {
  clearProgress,
  emptyProgress,
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

export default function Game({ caseNumber }: { caseNumber: number }) {
  const [bundle, setBundle] = useState<LoadedCase | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [savedResult, setSavedResult] = useState<SavedResult | null>(null);
  // Display-only career record from localStorage; never used for scoring.
  const [record, setRecord] = useState<PlayerRecord>(emptyRecord);

  useEffect(() => {
    let cancelled = false;
    loadCase(caseNumber)
      .then((loaded) => {
        if (cancelled) return;
        setBundle(loaded);
        const prog = readProgress(caseNumber);
        setProgress(prog);
        const saved = readResult(caseNumber);
        setSavedResult(saved);
        let rec = readRecord();
        // First-time players get the opening; anyone with anything saved goes straight Home.
        if (
          shouldShowIntro({
            introSeen: readIntroSeen(),
            hasProgress: prog.foundClueIds.length + prog.contradictions.length > 0,
            hasSavedResult: saved !== null,
            hasRecord: Object.keys(rec.cases).length > 0,
          })
        ) {
          setScreen({ name: "intro", step: "cold-open" });
        }
        // A game finished before the record existed still counts on the home screen.
        if (saved && !rec.cases[String(caseNumber)]) {
          rec = recordVerdict(rec, caseNumber, saved.result.outcome);
          writeRecord(rec);
        }
        setRecord(rec);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Could not load case.");
      });
    return () => {
      cancelled = true;
    };
  }, [caseNumber]);

  const updateProgress = useCallback(
    (update: (prev: Progress) => Progress) => {
      setProgress((prev) => {
        const next = update(prev);
        writeProgress(caseNumber, next);
        return next;
      });
    },
    [caseNumber],
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
    clearProgress(caseNumber);
    setProgress(emptyProgress);
    setSavedResult(null);
    setScreen({ name: "home" });
  };

  const finishCase = (saved: SavedResult) => {
    writeResult(caseNumber, saved);
    setSavedResult(saved);
    setRecord((prev) => {
      const next = recordVerdict(prev, caseNumber, saved.result.outcome);
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
        return (
          <Home
            caseData={bundle.caseData}
            art={art}
            status={caseStatus({ caseNumber, savedResult, progress, record })}
            hasSavedResult={savedResult !== null}
            rank={rankFor(solved)}
            solved={solved}
            best={bestResult(record)}
            usingLocalData={bundle.source === "local"}
            onOpenCase={() =>
              setScreen(savedResult ? { name: "result", saved: savedResult } : { name: "scene" })
            }
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
            clues={bundle.clues}
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
            portrait={art?.portraits[screen.saved.accusation.suspectId]}
            onPlayAgain={playAgain}
            onHome={goHome}
          />
        );
    }
  }
}
