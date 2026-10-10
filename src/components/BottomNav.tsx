export type NavTab = "scene" | "suspects" | "casebook" | "accuse";

const items: { id: NavTab; label: string; icon: React.ReactNode }[] = [
  {
    id: "scene",
    label: "Scene",
    icon: <path d="M3 20h18M5 20V9l7-5 7 5v11M10 20v-6h4v6" />,
  },
  {
    id: "suspects",
    label: "Suspects",
    icon: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0" />,
  },
  {
    id: "casebook",
    label: "Casebook",
    icon: <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Zm0 13a3 3 0 0 1 3-3h11M9 8h6" />,
  },
  {
    id: "accuse",
    label: "Accuse",
    icon: <path d="M12 3v10m0 4v.5M4.5 20h15L12 4 4.5 20Z" />,
  },
];

export default function BottomNav({
  active,
  casebookCount,
  onNavigate,
}: {
  active: NavTab;
  casebookCount: number;
  onNavigate: (tab: NavTab) => void;
}) {
  return (
    <nav
      aria-label="Case navigation"
      className="sticky bottom-0 z-10 mt-auto border-t border-ink-700 bg-ink-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const isActive = item.id === active;
          const accent = item.id === "accuse";
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex min-h-16 w-full flex-col items-center justify-center gap-1 text-sm font-semibold transition-colors ${
                  isActive
                    ? accent
                      ? "text-danger"
                      : "text-brass"
                    : "text-muted hover:text-paper"
                }`}
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
                  {item.icon}
                </svg>
                <span>
                  {item.label}
                  {item.id === "casebook" && casebookCount > 0 && (
                    <span className="ml-1 rounded-full bg-brass px-1.5 text-xs font-bold text-ink-900">
                      <span className="sr-only">, </span>
                      {casebookCount}
                      <span className="sr-only"> entries</span>
                    </span>
                  )}
                </span>
                {isActive && (
                  <span
                    aria-hidden
                    className={`absolute inset-x-6 top-0 h-0.5 rounded-full ${accent ? "bg-danger" : "bg-brass"}`}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
