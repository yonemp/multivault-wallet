import { ArrowRight } from "lucide-react";

type WalletCardProps = {
  title: string;
  description: string;
  href: string;
};

export function WalletCard({ title, description, href }: WalletCardProps) {
  return (
    <a
      href={href}
      className="group flex flex-col border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md transition hover:border-[var(--primary)] hover:bg-[var(--surface-hover)]"
    >
      <h3 className="text-base font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-[var(--muted)]">{description}</p>
      <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[var(--primary)]">
        Continue
        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </div>
    </a>
  );
}