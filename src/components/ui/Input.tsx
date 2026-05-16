"use client";

import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3.5 py-2.5 rounded-lg text-sm font-sans
            bg-surface-2 border text-text-primary placeholder-muted
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-error/60 focus:ring-error/30" : "border-border"}
            ${className}
          `}
          {...props}
        />
        {error && <span className="text-xs text-error">{error}</span>}
        {hint && !error && <span className="text-xs text-text-secondary">{hint}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
