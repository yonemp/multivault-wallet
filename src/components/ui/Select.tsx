import clsx from "clsx";
import { SelectHTMLAttributes } from "react";

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={clsx("mv-input", className)} {...props}>
      {children}
    </select>
  );
}