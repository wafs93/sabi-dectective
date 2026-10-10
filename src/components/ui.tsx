import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-brass text-ink-900 hover:bg-brass/90 disabled:bg-ink-700 disabled:text-muted",
  secondary: "border border-ink-600 bg-ink-800 text-paper hover:border-brass-dim",
  danger:
    "border border-danger/70 bg-danger-deep text-paper hover:bg-danger-deep/80 disabled:border-ink-600 disabled:bg-ink-700 disabled:text-muted",
  ghost: "text-muted hover:text-paper",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`min-h-11 rounded-lg px-4 py-3 text-left text-base font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function ScreenHeader({
  eyebrow,
  title,
  onBack,
  backLabel = "Back",
}: {
  eyebrow?: string;
  title: string;
  onBack?: () => void;
  backLabel?: string;
}) {
  return (
    <header className="border-b border-ink-700 px-4 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 flex min-h-11 items-center px-2 text-sm font-semibold text-muted hover:text-brass"
        >
          ← {backLabel}
        </button>
      )}
      {eyebrow && <p className="text-sm text-brass">{eyebrow}</p>}
      <h1 className="font-display text-2xl leading-tight text-paper">{title}</h1>
    </header>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 font-display text-lg text-paper">{children}</h2>;
}
