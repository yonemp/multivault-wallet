import { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border)] pb-3">
      <div>
        <h1 className="text-base font-semibold text-[var(--foreground)]">{title}</h1>
        {description && (
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}