import clsx from "clsx";
import { HTMLAttributes } from "react";

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("mv-panel", className)} {...props} />;
}