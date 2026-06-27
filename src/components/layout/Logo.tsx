import clsx from "clsx";
import { Wallet } from "lucide-react";

type LogoProps = {
  href?: string;
  compact?: boolean;
};

export function Logo({ href = "/", compact = false }: LogoProps) {
  const content = (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-500/30">
        <Wallet className="h-5 w-5" />
      </div>
      {!compact && (
        <div>
          <p className="text-sm font-bold tracking-tight text-slate-900">
            MultiVault
          </p>
          <p className="text-xs text-slate-500">Multi-chain wallet</p>
        </div>
      )}
    </div>
  );

  return (
    <a href={href} className={clsx("transition opacity-100 hover:opacity-80")}>
      {content}
    </a>
  );
}