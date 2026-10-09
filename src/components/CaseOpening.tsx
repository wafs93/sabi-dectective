import Placeholder from "@/components/Placeholder";
import { Button } from "@/components/ui";
import type { CaseRow } from "@/lib/types";

export default function CaseOpening({
  caseData,
  usingLocalData,
  onStart,
}: {
  caseData: CaseRow;
  usingLocalData: boolean;
  onStart: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <Placeholder
        aspect="scene"
        label={caseData.title}
        icon="🏚️"
        imageUrl={caseData.scene_image_url}
        className="rounded-none border-x-0 border-t-0"
      />

      <div className="flex flex-1 flex-col gap-5 px-4 py-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber">
            Sabi Detective · Case {caseData.case_number}
          </p>
          <h1 className="mt-1 font-display text-3xl text-paper">{caseData.title}</h1>
        </div>

        <div className="rounded-lg border border-noir-700 border-l-rust border-l-4 bg-noir-800 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Briefing
          </p>
          <p className="text-[15px] leading-relaxed text-paper/90">{caseData.briefing_text}</p>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <Button onClick={onStart} className="text-center text-base">
            Start investigating
          </Button>
          {usingLocalData && (
            <p className="text-center text-[11px] text-muted">
              Offline case file (Supabase not connected).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
