import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { ReactNode } from "react";

type WalletCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  onClick?: () => void;
  href?: string;
  accent?: "blue" | "sky" | "indigo" | "slate";
};

const accents = {
  blue: {
    border: "border-blue-200/80 hover:border-blue-300",
    bg: "bg-gradient-to-br from-white to-blue-50/50",
    icon: "bg-blue-600 text-white shadow-blue-500/30",
  },
  sky: {
    border: "border-sky-200/80 hover:border-sky-300",
    bg: "bg-gradient-to-br from-white to-sky-50/50",
    icon: "bg-sky-500 text-white shadow-sky-500/30",
  },
  indigo: {
    border: "border-indigo-200/80 hover:border-indigo-300",
    bg: "bg-gradient-to-br from-white to-indigo-50/50",
    icon: "bg-indigo-600 text-white shadow-indigo-500/30",
  },
  slate: {
    border: "border-slate-200/80 hover:border-slate-300",
    bg: "bg-gradient-to-br from-white to-slate-50",
    icon: "bg-slate-700 text-white shadow-slate-500/30",
  },
};

export function WalletCard({
  title,
  description,
  icon,
  onClick,
  href,
  accent = "blue",
}: WalletCardProps) {
  const style = accents[accent];
  const className = clsx(
    "group relative flex flex-col rounded-2xl border p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
    style.border,
    style.bg,
  );

  const content = (
    <>
      <div
        className={clsx(
          "mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-lg transition group-hover:scale-105",
          style.icon,
        )}
      >
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
        {description}
      </p>
      <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition group-hover:gap-2">
        Continue
        <ArrowRight className="h-4 w-4" />
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}