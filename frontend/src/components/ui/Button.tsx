import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {

        const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 relative overflow-hidden group';

        const variants = {
            primary: 'bg-gradient-to-br from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-md hover:shadow-lg focus:ring-primary-500 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity',
            secondary: 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50 hover:border-secondary-400 hover:text-secondary-900 shadow-sm hover:shadow focus:ring-secondary-300 backdrop-blur-sm',
            danger: 'bg-gradient-to-br from-danger-500 to-danger-600 text-white hover:from-danger-600 hover:to-danger-700 shadow-md hover:shadow-lg focus:ring-danger-500 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity',
            success: 'bg-gradient-to-br from-success-500 to-success-600 text-white hover:from-success-600 hover:to-success-700 shadow-md hover:shadow-lg focus:ring-success-500 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity',
            ghost: 'text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900 focus:ring-secondary-300',
            outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 hover:border-primary-700 focus:ring-primary-500 backdrop-blur-sm',
        };

        const sizes = {
            sm: 'px-3.5 py-2 text-sm gap-1.5',
            md: 'px-5 py-2.5 text-sm gap-2',
            lg: 'px-6 py-3.5 text-base gap-2',
        };

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                disabled={disabled || isLoading}
                {...props}
            >
                <span className="relative z-10 flex items-center gap-2">
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
                    <span>{children}</span>
                    {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
                </span>
            </button>
        );
    }
);

Button.displayName = 'Button';
