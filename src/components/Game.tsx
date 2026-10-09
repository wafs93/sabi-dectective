"use client";

import { useCallback, useEffect, useState } from "react";
import Accuse from "@/components/Accuse";
import CaseOpening from "@/components/CaseOpening";
import Interrogation from "@/components/Interrogation";
import Investigate, { type InvestigateTab } from "@/components/Investigate";
import Result from "@/components/Result";
import {
  clearProgress,
  emptyProgress,
  loadCase,
  readProgress,
  scoreAccusation,
  writeProgress,
  type LoadedCase,
} from "@/lib/game";
import type { Accusation, Contradiction, Progress, ResultTier } from "@/lib/types";

type Screen =
  | { name: "opening" }
  | { name: "investigate" }
  | { name: "interrogate"; suspectId: string }
  | { name: "accuse" }
  | { name: "result"; tier: ResultTier; accusation: Accusation };

export default function Game({ caseNumber }: { caseNumber: number }) {
  const [bundle, setBundle] = useState<LoadedCase | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: "opening" });
  const [tab, setTab] = useState<InvestigateTab>("suspects");
  const [progress, setProgress] = useState<Progress>(emptyProgress);

  useEffect(() => {
    let cancelled = false;
    loadCase(caseNumber)
      .then((loaded) => {
        if (cancelled) return;
        setBundle(loaded);
        setProgress(readProgress(caseNumber));
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
        prev.contradictions.some(
          (c) => c.suspectName === entry.suspectName && c.question === entry.question,
        )
          ? prev
          : { ...prev, contradictions: [...prev.contradictions, entry] },
      ),
    [updateProgress],
  );

  const playAgain = () => {
    clearProgress(caseNumber);
    setProgress(emptyProgress);
    setTab("suspects");
    setScreen({ name: "opening" });
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
      <div className="flex flex-1 items-center justify-center p-6 text-sm uppercase tracking-[0.2em] text-muted">
        Opening case file…
      </div>
    );
  }

  switch (screen.name) {
    case "opening":
      return (
        <CaseOpening
          caseData={bundle.caseData}
          usingLocalData={bundle.source === "local"}
          onStart={() => setScreen({ name: "investigate" })}
        />
      );

    case "investigate":
      return (
        <Investigate
          bundle={bundle}
          progress={progress}
          tab={tab}
          onTabChange={setTab}
          onCollectClue={collectClue}
          onOpenSuspect={(suspectId) => setScreen({ name: "interrogate", suspectId })}
          onAccuse={() => setScreen({ name: "accuse" })}
          onBack={() => setScreen({ name: "opening" })}
        />
      );

    case "interrogate": {
      const suspect = bundle.suspects.find((s) => s.id === screen.suspectId);
      if (!suspect) return null;
      return (
        <Interrogation
          key={suspect.id}
          suspect={suspect}
          clues={bundle.clues}
          progress={progress}
          onContradiction={logContradiction}
          onBack={() => setScreen({ name: "investigate" })}
        />
      );
    }

    case "accuse":
      return (
        <Accuse
          bundle={bundle}
          progress={progress}
          onBack={() => setScreen({ name: "investigate" })}
          onSubmit={(accusation) =>
            setScreen({
              name: "result",
              tier: scoreAccusation(bundle, accusation),
              accusation,
            })
          }
        />
      );

    case "result":
      return (
        <Result
          bundle={bundle}
          tier={screen.tier}
          accusation={screen.accusation}
          onPlayAgain={playAgain}
        />
      );
  }
}
