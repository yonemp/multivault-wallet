import clsx from "clsx";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "border border-slate-200 bg-white p-5",
        className,
      )}
      {...props}
    />
  );
}