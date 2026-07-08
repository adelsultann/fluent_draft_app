import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helpText?: string;
  error?: string;
}

export default function Input({ label, helpText, error, id, className = "", ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`rounded-md border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-action focus:outline-none focus:ring-1 focus:ring-action disabled:cursor-not-allowed disabled:opacity-50 ${error ? "border-error focus:border-error focus:ring-error" : "border-border"} ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
        {...rest}
      />
      {helpText && !error && (
        <p id={`${inputId}-help`} className="text-xs text-text-muted">
          {helpText}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
