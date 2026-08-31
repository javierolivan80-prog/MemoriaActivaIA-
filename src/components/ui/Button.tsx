import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white dark:text-background hover:bg-primary-hover",
  secondary:
    "border border-primary text-primary bg-transparent hover:bg-primary-light",
  ghost: "text-text-primary hover:bg-surface-alt",
};

export const buttonBaseClasses =
  "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium transition-[color,background-color,border-color,transform] duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:translate-y-0 disabled:border-transparent disabled:bg-surface-alt disabled:text-text-muted";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${buttonBaseClasses} ${buttonVariantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
