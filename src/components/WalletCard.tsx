import clsx from "clsx";
import { ReactNode } from "react";

type WalletCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  onClick?: () => void;
  href?: string;
  accent?: "violet" | "orange" | "blue" | "green";
};

const accents = {
  violet: "from-violet-500/20 to-fuchsia-500/10 border-violet-400/30",
  orange: "from-orange-500/20 to-amber-500/10 border-orange-400/30",
  blue: "from-blue-500/20 to-cyan-500/10 border-blue-400/30",
  green: "from-emerald-500/20 to-green-500/10 border-emerald-400/30",
};

export function WalletCard({
  title,
  description,
  icon,
  onClick,
  href,
  accent = "violet",
}: WalletCardProps) {
  const className = clsx(
    "group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 text-left transition hover:-translate-y-0.5 hover:shadow-xl",
    accents[accent],
  );

  const content = (
    <>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black/20 text-2xl">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
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