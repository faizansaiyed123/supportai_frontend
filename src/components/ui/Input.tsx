import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  hint?: string;
}

/**
 * A single Input that owns its own label/error/hint wiring via aria-describedby and
 * aria-invalid (Sec. 23 accessibility - "form labels," "error announcements"), rather than
 * leaving every form to hand-wire label/htmlFor/aria-describedby association itself and
 * inevitably doing it inconsistently.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, label, hint, id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={cn(
          "h-10 rounded-md border px-3 text-sm text-neutral-900 placeholder:text-neutral-400",
          "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
          error ? "border-danger-600" : "border-neutral-300",
          "disabled:bg-neutral-100 disabled:text-neutral-500",
          className,
        )}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-neutral-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
});
