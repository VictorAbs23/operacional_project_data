import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'outline' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, disabled, className = '', ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-semibold rounded-md transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary-500/20';
    const variants: Record<string, string> = {
      primary: 'bg-primary-500 text-white hover:bg-primary-700 shadow-primary disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none disabled:active:scale-100',
      success: 'bg-accent-500 text-white hover:bg-accent-700 shadow-accent disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none disabled:active:scale-100',
      outline: 'bg-white text-primary-500 border border-primary-500 hover:bg-primary-50 disabled:border-neutral-200 disabled:text-neutral-400 disabled:active:scale-100',
      destructive: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:active:scale-100',
      ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100 disabled:text-neutral-400 disabled:active:scale-100',
    };
    const sizes: Record<string, string> = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
