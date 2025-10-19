import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 active:bg-primary/80 dark:bg-primary dark:hover:bg-primary/90',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90 active:bg-secondary/80 dark:bg-secondary dark:hover:bg-secondary/80',
        destructive:
          'bg-[#EF4444] text-white shadow-md hover:bg-[#DC2626] active:bg-[#B91C1C] dark:bg-[#DC2626] dark:hover:bg-[#B91C1C]',
        success:
          'bg-[#22C55E] text-white shadow-md hover:bg-[#1BA34D] active:bg-[#15803D] dark:bg-[#16A34A] dark:hover:bg-[#15803D]',
        warning:
          'bg-[#FACC15] text-[#1E293B] shadow-md hover:bg-[#E3B80F] active:bg-[#C99E0A] dark:bg-[#EAB308] dark:hover:bg-[#CA8A04] dark:text-gray-900',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground dark:border-gray-600 dark:hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent',
        link: 'text-primary underline-offset-4 hover:underline dark:text-primary',
      },
      size: {
        default: 'h-10 px-4 py-2 text-sm sm:text-base',
        sm: 'h-9 rounded-md px-3 text-xs sm:text-sm',
        lg: 'h-11 sm:h-12 rounded-md px-6 sm:px-8 text-sm sm:text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  loading?: boolean;
  variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, children, disabled, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), loading && 'cursor-wait')}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { buttonVariants };