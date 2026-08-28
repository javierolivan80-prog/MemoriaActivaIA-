import type { InputHTMLAttributes } from "react";

export const inputClasses =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export default function Input({
  label,
  hint,
  id,
  name,
  className = "",
  ...props
}: InputProps) {
  const inputId = id ?? name;

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-text-primary"
      >
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        className={`${inputClasses} ${className}`}
        {...props}
      />
      {hint && <p className="mt-1.5 text-sm text-text-muted">{hint}</p>}
    </div>
  );
}
