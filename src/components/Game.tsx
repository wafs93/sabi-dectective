"use client";

import { useCallback, useEffect, useState } from "react";
import Accuse from "@/components/Accuse";
import BottomNav, { type NavTab } from "@/components/BottomNav";
import Casebook from "@/components/Casebook";
import Interrogation from "@/components/Interrogation";
import Result from "@/components/Result";
import SceneScreen from "@/components/SceneScreen";
import StartScreen from "@/components/StartScreen";
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
import type { Contradiction, Progress, SavedResult } from "@/lib/types";

type Screen =
  | { name: "start" }
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
  const [screen, setScreen] = useState<Screen>({ name: "start" });
  const [progress, setProgress] = useState<Progress>(emptyProgress);

  useEffect(() => {
    let cancelled = false;
    loadCase(caseNumber)
      .then((loaded) => {
        if (cancelled) return;
        setBundle(loaded);
        setProgress(readProgress(caseNumber));
        const saved = readResult(caseNumber);
        if (saved) setScreen({ name: "result", saved });
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
    setScreen({ name: "start" });
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
      case "start":
        return (
          <StartScreen
            caseData={bundle.caseData}
            art={art}
            hasProgress={progress.foundClueIds.length + progress.contradictions.length > 0}
            usingLocalData={bundle.source === "local"}
            onStart={() => setScreen({ name: "scene" })}
          />
        );

      case "scene":
        return (
          <SceneScreen bundle={bundle} art={art} progress={progress} onCollectClue={collectClue} />
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
            onResult={(saved) => {
              writeResult(caseNumber, saved);
              setScreen({ name: "result", saved });
            }}
          />
        );

      case "result":
        return (
          <Result
            bundle={bundle}
            saved={screen.saved}
            portrait={art?.portraits[screen.saved.accusation.suspectId]}
            onPlayAgain={playAgain}
          />
        );
    }
  }
}
