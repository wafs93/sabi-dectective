import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-amber text-noir-950 hover:bg-amber/90 disabled:bg-amber-dim disabled:text-noir-800",
  secondary: "border border-noir-600 bg-noir-800 text-paper hover:border-amber-dim",
  danger: "border border-rust bg-rust-dim/40 text-paper hover:bg-rust-dim/70",
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
      className={`rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
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
    <header className="border-b border-noir-700 px-4 pb-3 pt-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted hover:text-amber"
        >
          ← {backLabel}
        </button>
      )}
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber">{eyebrow}</p>
      )}
      <h1 className="font-display text-2xl text-paper">{title}</h1>
    </header>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">{children}</h2>
  );
}
