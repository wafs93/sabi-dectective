import Image from "next/image";
import type { CaseArt } from "@/data/art";
import type { CaseStatus } from "@/lib/record";
import type { ResultTier } from "@/lib/types";

// One card on the home screen.
export type HomeCase = {
  caseNumber: number;
  title: string | null;
  art: CaseArt | null;
  playable: boolean;
  status: CaseStatus;
  hasSavedResult: boolean;
};

const verdictLabel: Record<ResultTier, string> = {
  cracked: "Cracked",
  close: "Close Call",
  missed: "Missed",
};

const statusStyle: Record<CaseStatus, { label: string; chip: string }> = {
  new: { label: "New", chip: "border-brass text-brass" },
  "in-progress": { label: "In progress", chip: "border-paper/70 text-paper" },
  cracked: { label: "Cracked", chip: "border-brass bg-brass text-ink-900" },
  close: { label: "Close Call", chip: "border-paper bg-paper text-ink-900" },
  missed: { label: "Missed", chip: "border-danger bg-danger-deep text-paper" },
};

export default function Home({
  cases,
  todayCaseNumber,
  rank,
  solved,
  best,
  usingLocalData,
  onOpenCase,
}: {
  cases: HomeCase[];
  todayCaseNumber: number;
  rank: string;
  solved: number;
  best: ResultTier | null;
  usingLocalData: boolean;
  onOpenCase: (caseNumber: number) => void;
}) {
  const today = cases.find((c) => c.caseNumber === todayCaseNumber && c.playable);
  const others = cases.filter((c) => c !== today);
  const art = today?.art ?? null;
  const status = today?.status ?? "new";
  const action =
    status === "new"
      ? "Investigate the case"
      : status === "in-progress"
        ? "Continue the case"
        : today?.hasSavedResult
          ? "See the verdict"
          : "Play again";
  const chip = statusStyle[status];

  return (
    <div className="flex flex-1 flex-col pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {/* Title over the scene art */}
      <header className="relative flex h-64 flex-col justify-end overflow-hidden">
        {art && (
          <div aria-hidden className="absolute inset-0">
            <Image
              src={art.scene}
              alt=""
              fill
              preload
              sizes="(max-width: 480px) 100vw, 480px"
              className="anim-drift object-cover object-[50%_35%]"
            />
          </div>
        )}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/75 to-ink-900/20"
        />
        <div className="relative px-4 pb-4">
          <h1 className="font-display text-5xl leading-none text-paper">Sabi Detective</h1>
          <p className="mt-2 text-lg text-brass">Sabi, Solve Crime</p>
        </div>
      </header>

      {/* Detective strip */}
      <section aria-label="Your detective record" className="px-4 pt-2">
        <dl className="grid grid-cols-3 divide-x divide-ink-700 rounded-xl border border-ink-700 bg-ink-800">
          <div className="flex flex-col gap-0.5 p-3">
            <dt className="text-sm text-muted">Rank</dt>
            <dd className="font-display text-lg leading-tight text-brass">{rank}</dd>
          </div>
          <div className="flex flex-col gap-0.5 p-3">
            <dt className="text-sm text-muted">Cases solved</dt>
            <dd className="font-display text-lg leading-tight text-paper">{solved}</dd>
          </div>
          <div className="flex flex-col gap-0.5 p-3">
            <dt className="text-sm text-muted">Best result</dt>
            <dd className="font-display text-lg leading-tight text-paper">
              {best ? verdictLabel[best] : "None yet"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Today's case */}
      {today && (
        <section aria-labelledby="todays-case" className="flex flex-col gap-3 px-4 pt-6">
          <h2 id="todays-case" className="font-display text-xl text-paper">
            Today&apos;s case
          </h2>
          <button
            type="button"
            onClick={() => onOpenCase(today.caseNumber)}
            className="group overflow-hidden rounded-xl border border-brass-dim bg-ink-800 text-left transition-colors hover:border-brass"
          >
            {art && (
              <div className="relative aspect-[16/7] w-full">
                <Image
                  src={art.scene}
                  alt=""
                  fill
                  sizes="(max-width: 480px) 100vw, 480px"
                  className="object-cover object-[50%_70%]"
                />
                <span
                  className={`absolute right-3 top-3 rounded-full border px-3 py-1 text-sm font-semibold ${chip.chip}`}
                >
                  {chip.label}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-2 p-4">
              <p className="text-sm text-brass">Case {today.caseNumber}</p>
              <p className="font-display text-2xl leading-tight text-paper">{today.title}</p>
              {art?.intro && <p className="text-paper/90">{art.intro}</p>}
              {!art && (
                <p>
                  Status: <span className="font-semibold">{chip.label}</span>
                </p>
              )}
              <span className="mt-2 flex min-h-12 items-center justify-center rounded-lg bg-brass px-4 font-semibold text-ink-900 group-hover:bg-brass/90">
                {action}
              </span>
            </div>
          </button>
          {usingLocalData && (
            <p className="text-center text-sm text-muted">Offline case file (Supabase not connected).</p>
          )}
        </section>
      )}

      {/* The other cases: playable ones open, the rest are locked */}
      <section aria-labelledby="more-cases" className="flex flex-col gap-3 px-4 pt-6">
        <h2 id="more-cases" className="font-display text-xl text-paper">
          More cases
        </h2>
        <ul className="grid grid-cols-2 gap-3">
          {others.map(({ caseNumber: n, ...c }) =>
            c.playable ? (
              <li key={n}>
                <OpenCaseCard
                  caseNumber={n}
                  title={c.title}
                  status={c.status}
                  onOpen={() => onOpenCase(n)}
                />
              </li>
            ) : (
              <li
                key={n}
                aria-label={`Case ${n}, locked, coming soon`}
                className="flex min-h-28 flex-col items-start justify-between gap-3 rounded-xl border border-dashed border-ink-600 bg-ink-800/60 p-4 text-muted"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                <span>
                  <span className="block font-display text-lg text-paper/80">Case {n}</span>
                  <span className="block text-sm">Coming soon</span>
                </span>
              </li>
            ),
          )}
        </ul>
      </section>
    </div>
  );
}

function OpenCaseCard({
  caseNumber,
  title,
  status,
  onOpen,
}: {
  caseNumber: number;
  title: string | null;
  status: CaseStatus;
  onOpen: () => void;
}) {
  const chip = statusStyle[status];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-28 w-full flex-col items-start justify-between gap-3 rounded-xl border border-brass-dim bg-ink-800 p-4 text-left transition-colors hover:border-brass"
    >
      <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${chip.chip}`}>
        {chip.label}
      </span>
      <span className="min-w-0">
        <span className="block font-display text-lg text-paper">Case {caseNumber}</span>
        {title && <span className="block text-sm text-paper/80">{title}</span>}
      </span>
    </button>
  );
}
