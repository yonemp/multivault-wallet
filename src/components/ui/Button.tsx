import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-violet-500 text-white hover:bg-violet-400 shadow-lg shadow-violet-500/20",
        variant === "secondary" &&
          "bg-white/10 text-white hover:bg-white/15 border border-white/10",
        variant === "ghost" && "text-zinc-300 hover:text-white hover:bg-white/5",
        className,
      )}
      {...props}
    />
  );
}