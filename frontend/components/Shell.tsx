export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl2 border border-base-border bg-base-card shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

export function Shell({
  children,
  eyebrow,
  wide = false,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  wide?: boolean;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10 sm:py-16">
      <div className={wide ? "w-full max-w-5xl" : "w-full max-w-3xl"}>
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand" />
            <span className="text-lg font-semibold tracking-tight text-ink-primary">MindProbe</span>
          </div>
          {eyebrow && (
            <span className="text-xs uppercase tracking-widest text-ink-faint">{eyebrow}</span>
          )}
        </header>
        {children}
      </div>
    </main>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="font-medium text-sm px-5 py-2.5 rounded-xl2 bg-brand text-white
        hover:bg-brand-dark active:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed
        transition-colors shadow-card hover:shadow-cardHover"
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-medium text-sm px-5 py-2.5 rounded-xl2 border border-base-border
        text-ink-secondary hover:border-brand/40 hover:text-brand disabled:opacity-40
        disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
