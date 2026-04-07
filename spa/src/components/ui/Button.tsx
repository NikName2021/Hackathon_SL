import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  leftIcon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  isLoading, 
  leftIcon,
  variant = 'primary', 
  size = 'md',
  className, 
  disabled, 
  ...props 
}) => {
  const sizeStyles = {
    sm: "px-4 py-2 text-sm rounded-lg",
    md: "px-6 py-3 rounded-xl",
    lg: "px-8 py-4 text-lg rounded-2xl"
  };
  
  const baseStyles = cn(
    "relative overflow-hidden font-medium transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 inline-flex items-center justify-center gap-2",
    sizeStyles[size]
  );
  
  const variants = {
    primary: "bg-primary-600 text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700",
    secondary: "bg-white/50 text-surface-900 border border-white/20 shadow-sm hover:bg-white/80 dark:bg-black/50 dark:text-white dark:hover:bg-black/80",
    danger: "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600",
    ghost: "bg-transparent text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 shadow-none hover:shadow-none translate-y-0 hover:translate-y-0",
    outline: "bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:border-primary-500 dark:text-primary-500 shadow-none hover:shadow-none translate-y-0 hover:translate-y-0"
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], className)} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      {children}
    </button>
  );
};
