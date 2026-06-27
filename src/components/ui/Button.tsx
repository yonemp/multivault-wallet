import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "buy" | "sell";
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
        "inline-flex items-center justify-center rounded-[var(--radius-sm)] font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-5 py-2.5 text-sm",
        variant === "primary" &&
          "border border-[var(--primary)] bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]",
        variant === "secondary" &&
          "border border-[var(--border)] bg-[var(--surface-solid)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]",
        variant === "outline" &&
          "border border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[rgba(82,111,255,0.2)]",
        variant === "ghost" &&
          "border border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
        variant === "buy" && "ax-buy-btn",
        variant === "sell" && "ax-sell-btn",
        className,
      )}
      {...props}
    />
  );
}