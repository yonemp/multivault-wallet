import clsx from "clsx";

type LogoProps = {
  href?: string;
  compact?: boolean;
};

export function Logo({ href = "/", compact = false }: LogoProps) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-2.5 transition-opacity hover:opacity-90"
    >
      <div className="relative flex h-9 w-9 items-center justify-center border border-[var(--border-strong)] bg-[var(--surface-solid)]">
        <div className="absolute inset-0 bg-[var(--primary-soft)]" />
        <div className="relative flex flex-col items-center leading-none">
          <span className="text-[10px] font-bold tracking-tighter text-[var(--primary)]">
            MV
          </span>
          <span className="mt-0.5 h-px w-4 bg-[var(--primary)]" />
        </div>
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
            MultiVault
          </p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
            Multi-chain
          </p>
        </div>
      )}
    </a>
  );
}