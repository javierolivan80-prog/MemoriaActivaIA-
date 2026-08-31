import type { InputHTMLAttributes } from "react";

// The field's visual chrome, shared with any input rendered outside this
// component (e.g. an inline chat composer) so both stay in sync with the
// design system instead of hand-duplicating the same Tailwind string.
export const fieldClasses =
  "rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

export const inputClasses = `mt-2 w-full ${fieldClasses}`;

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export default function Input({
  label,
  hint,
  error,
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
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        className={`${inputClasses} ${
          error
            ? "border-alert-urgent focus:border-alert-urgent focus:ring-alert-urgent/30"
            : ""
        } ${className}`}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-alert-urgent">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
