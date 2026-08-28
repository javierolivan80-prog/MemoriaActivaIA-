import type { TextareaHTMLAttributes } from "react";
import { inputClasses } from "./Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}

export default function Textarea({
  label,
  hint,
  id,
  name,
  className = "",
  ...props
}: TextareaProps) {
  const inputId = id ?? name;

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-text-primary"
      >
        {label}
      </label>
      <textarea
        id={inputId}
        name={name}
        className={`${inputClasses} resize-none leading-relaxed ${className}`}
        {...props}
      />
      {hint && <p className="mt-1.5 text-sm text-text-muted">{hint}</p>}
    </div>
  );
}
