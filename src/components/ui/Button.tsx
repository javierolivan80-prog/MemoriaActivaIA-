import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary:
    "border border-primary text-primary bg-transparent hover:bg-primary-light",
  ghost: "text-text-primary hover:bg-surface-alt",
};

export const buttonBaseClasses =
  "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

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
