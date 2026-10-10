import Image from "next/image";
import { Button } from "@/components/ui";
import type { CaseArt } from "@/data/case1-art";
import type { CaseRow } from "@/lib/types";

export default function StartScreen({
  caseData,
  art,
  hasProgress,
  usingLocalData,
  onStart,
}: {
  caseData: CaseRow;
  art: CaseArt | null;
  hasProgress: boolean;
  usingLocalData: boolean;
  onStart: () => void;
}) {
  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-hidden">
      {art && (
        <div aria-hidden className="absolute inset-0">
          <Image
            src={art.scene}
            alt=""
            fill
            preload
            sizes="(max-width: 480px) 100vw, 480px"
            className="anim-drift object-cover"
          />
        </div>
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/80 to-ink-950/30"
      />

      <div className="relative mt-auto flex flex-col gap-6 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-24">
        <div>
          <h1 className="font-display text-5xl leading-none text-paper">Sabi Detective</h1>
          <p className="mt-2 text-lg text-brass">Sabi, Solve Crime</p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-display text-2xl text-paper">
            Case {caseData.case_number}: {caseData.title}
          </p>
          <p className="text-lg leading-relaxed text-paper/90">
            {art?.intro ?? caseData.briefing_text}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={onStart} className="min-h-14 text-center text-lg">
            {hasProgress ? "Continue the case" : "Investigate the case"}
          </Button>
          {usingLocalData && (
            <p className="text-center text-sm text-muted">
              Offline case file (Supabase not connected).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
