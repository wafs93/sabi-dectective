import Image from "next/image";
import type { CaseArt } from "@/data/art";
import { TEST_CASE_BADGE, TEST_CASE_ICON } from "@/data/test-case/labels";
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
  // A test-only case (Vercel Preview): shown last as a muted test card.
  test?: true;
};

// The label for test-only cases' cards, set only with NEXT_PUBLIC_ENABLE_TEST_CASE=1 (Vercel
// Preview). A plain check of the flag, so with it off the build drops the label's text entirely.
let testLabel: { badge: string; icon: string } | null = null;
if (process.env.NEXT_PUBLIC_ENABLE_TEST_CASE === "1") testLabel = { badge: TEST_CASE_BADGE, icon: TEST_CASE_ICON };

const verdictLabel: Record<ResultTier, string> = {
  cracked: "Cracked",
  close: "Close Call",
  missed: "Missed",
};

const statusStyle: Record<CaseStatus, { label: string; chip: string }> = {
  new: { label: "New", chip: "border-brass/80 bg-ink-900/70 text-brass" },
  "in-progress": { label: "In progress", chip: "border-paper/60 bg-ink-900/70 text-paper" },
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
  const today = cases.find((c) => c.caseNumber === todayCaseNumber && c.playable && !c.test);
  const others = cases.filter((c) => c !== today && !c.test);
  const tests = cases.filter((c) => c.test && c.playable);
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
    <div className="flex flex-1 flex-col gap-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div>
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
            className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/70 to-ink-900/10"
          />
          <div className="relative px-5 pb-12">
            <h1 className="font-display text-[clamp(2.5rem,12vw,3rem)] leading-none text-paper">
              Sabi Detective
            </h1>
            <p className="mt-2 text-lg text-brass">Sabi, Solve Crime</p>
          </div>
        </header>

        {/* Detective record: one slim bar, tucked under the title */}
        <section aria-label="Your detective record" className="relative -mt-7 px-5">
          <dl className="flex divide-x divide-paper/10 rounded-2xl border border-paper/10 bg-ink-800/75 shadow-lg shadow-black/40 backdrop-blur-md">
            <Stat label="Rank" value={rank} />
            <Stat label="Cases solved" value={String(solved)} />
            <Stat label="Best result" value={best ? verdictLabel[best] : "None yet"} />
          </dl>
        </section>
      </div>

      {/* Today's case: the focal point */}
      {today && (
        <section aria-labelledby="todays-case" className="flex flex-col gap-4 px-5">
          <h2 id="todays-case" className="font-display text-2xl text-paper">
            Today&apos;s case
          </h2>
          <button
            type="button"
            onClick={() => onOpenCase(today.caseNumber)}
            className="group overflow-hidden rounded-2xl border border-brass-dim/70 bg-ink-800 text-left shadow-xl shadow-black/40 transition-colors hover:border-brass focus-visible:border-brass focus-visible:outline-offset-4"
          >
            {art && (
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={art.scene}
                  alt=""
                  fill
                  sizes="(max-width: 480px) 100vw, 480px"
                  className="object-cover object-[50%_62%]"
                />
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink-800 to-transparent"
                />
                <span
                  className={`absolute right-3 top-3 rounded-full border px-3 py-1 text-sm font-semibold backdrop-blur-sm ${chip.chip}`}
                >
                  {chip.label}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-2 px-5 pb-5 pt-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass">
                Case {today.caseNumber}
              </p>
              <p className="font-display text-[1.75rem] leading-tight text-paper">{today.title}</p>
              {art?.intro && <p className="leading-relaxed text-paper/85">{art.intro}</p>}
              {!art && (
                <p>
                  Status: <span className="font-semibold">{chip.label}</span>
                </p>
              )}
              <span className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brass px-5 font-semibold text-ink-900 shadow-md shadow-black/30 transition-colors group-hover:bg-paper group-focus-visible:bg-paper">
                {action}
                <Chevron className="h-4 w-4" />
              </span>
            </div>
          </button>
          {usingLocalData && (
            <p className="text-center text-sm text-muted">Offline case file (Supabase not connected).</p>
          )}
        </section>
      )}

      {/* The other cases: playable ones open, the rest are locked */}
      <section aria-labelledby="more-cases" className="flex flex-col gap-4 px-5">
        <h2 id="more-cases" className="font-display text-2xl text-paper">
          More cases
        </h2>
        <ul className="flex flex-col gap-3">
          {others.map(({ caseNumber: n, ...c }) =>
            c.playable ? (
              <li key={n}>
                <OpenCaseRow
                  caseNumber={n}
                  title={c.title}
                  art={c.art}
                  status={c.status}
                  onOpen={() => onOpenCase(n)}
                />
              </li>
            ) : (
              <li
                key={n}
                aria-label={`Case ${n}, locked, coming soon`}
                className="flex min-h-[4.5rem] cursor-default select-none items-center gap-4 rounded-xl border border-dashed border-ink-600 p-2.5 pr-4 text-muted"
              >
                <span
                  aria-hidden
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-ink-800/60"
                >
                  <svg
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
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em]">Case {n}</span>
                  <span className="block font-display text-lg text-paper/60">Coming soon</span>
                </span>
              </li>
            ),
          )}
        </ul>
        {testLabel && tests.length > 0 && (
          <ul className="flex flex-col gap-3">
            {tests.map((c) => (
              <li key={c.caseNumber}>
                <TestCaseRow
                  label={testLabel}
                  caseNumber={c.caseNumber}
                  title={c.title}
                  statusLabel={statusStyle[c.status].label}
                  onOpen={() => onOpenCase(c.caseNumber)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// Each column is as wide as its words, plus an even share of the spare room.
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-[1_0_auto] flex-col gap-0.5 px-2.5 py-3">
      <dt className="whitespace-nowrap text-xs text-muted">{label}</dt>
      <dd className="whitespace-nowrap font-display text-[clamp(0.875rem,3.9vw,1.125rem)] leading-tight text-brass">
        {value}
      </dd>
    </div>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function OpenCaseRow({
  caseNumber,
  title,
  art,
  status,
  onOpen,
}: {
  caseNumber: number;
  title: string | null;
  art: CaseArt | null;
  status: CaseStatus;
  onOpen: () => void;
}) {
  const chip = statusStyle[status];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex min-h-[4.5rem] w-full items-center gap-4 rounded-xl border border-ink-600 bg-ink-800 p-2.5 pr-4 text-left transition-colors hover:border-brass-dim hover:bg-ink-700/50 focus-visible:border-brass"
    >
      <span
        aria-hidden
        className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-700 font-display text-xl text-brass"
      >
        {art ? (
          <Image src={art.scene} alt="" fill sizes="56px" className="object-cover object-[50%_60%]" />
        ) : (
          caseNumber
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brass">
            Case {caseNumber}
          </span>
          <span
            className={`rounded-full border px-2 py-px text-xs font-semibold leading-5 ${chip.chip}`}
          >
            {chip.label}
          </span>
        </span>
        {title && <span className="block font-display text-lg leading-snug text-paper">{title}</span>}
      </span>
      <Chevron className="h-5 w-5 shrink-0 text-muted transition-colors group-hover:text-brass" />
    </button>
  );
}

// A muted card for a test-only case.
function TestCaseRow({
  label,
  caseNumber,
  title,
  statusLabel,
  onOpen,
}: {
  label: { badge: string; icon: string };
  caseNumber: number;
  title: string | null;
  statusLabel: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-[4.5rem] w-full items-center gap-4 rounded-xl border border-dashed border-ink-600 p-2.5 pr-4 text-left text-muted transition-colors hover:border-brass-dim"
    >
      <span
        aria-hidden
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-ink-800/60 text-xl"
      >
        {label.icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-danger/70 px-2 py-px text-xs font-semibold leading-5 text-danger">
            {label.badge}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.16em]">
            Case {caseNumber} · {statusLabel}
          </span>
        </span>
        {title && <span className="block font-display text-lg leading-snug text-paper/70">{title}</span>}
      </span>
    </button>
  );
}
