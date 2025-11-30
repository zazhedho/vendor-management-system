import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md' | 'lg';
    dot?: boolean;
}

export const Badge = ({ className = '', variant = 'primary', size = 'md', dot = false, children, ...props }: BadgeProps) => {
    const variants = {
        primary: 'bg-gradient-to-br from-primary-50 to-primary-100/80 text-primary-700 border-primary-200/50 shadow-sm',
        secondary: 'bg-gradient-to-br from-secondary-50 to-secondary-100/80 text-secondary-700 border-secondary-200/50 shadow-sm',
        success: 'bg-gradient-to-br from-success-50 to-success-100/80 text-success-700 border-success-200/50 shadow-sm',
        warning: 'bg-gradient-to-br from-warning-50 to-warning-100/80 text-warning-700 border-warning-200/50 shadow-sm',
        danger: 'bg-gradient-to-br from-danger-50 to-danger-100/80 text-danger-700 border-danger-200/50 shadow-sm',
        info: 'bg-gradient-to-br from-info-50 to-info-100/80 text-info-700 border-info-200/50 shadow-sm',
    };

    const dotColors = {
        primary: 'bg-primary-500',
        secondary: 'bg-secondary-500',
        success: 'bg-success-500',
        warning: 'bg-warning-500',
        danger: 'bg-danger-500',
        info: 'bg-info-500',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
    };

    return (
        <span
            className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold border backdrop-blur-sm
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
            {...props}
        >
            {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-pulse-subtle`}></span>}
            {children}
        </span>
    );
};
