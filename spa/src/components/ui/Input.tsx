import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './Button';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-surface-800 dark:text-surface-100 ml-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "bg-white/50 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all dark:bg-black/40 dark:text-white backdrop-blur-sm",
            error ? "border-red-500 focus:ring-red-500/50" : "border-gray-200 dark:border-white/10",
            className
          )}
          {...props}
        />
        {error && <span className="text-sm text-red-500 ml-1">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
