import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "rounded-lg px-3 py-2 text-xs",
        size === "md" && "rounded-xl px-5 py-3 text-sm",
        size === "lg" && "rounded-xl px-6 py-3.5 text-base",
        variant === "primary" &&
          "bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98]",
        variant === "secondary" &&
          "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700",
        variant === "outline" &&
          "border border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-50",
        variant === "ghost" &&
          "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        className,
      )}
      {...props}
    />
  );
}