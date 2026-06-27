import clsx from "clsx";
import { HTMLAttributes } from "react";

/** @deprecated Use Panel instead */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("mv-panel p-5", className)} {...props} />;
}