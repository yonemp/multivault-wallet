import clsx from "clsx";
import { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx("mv-input", className)} {...props} />;
}