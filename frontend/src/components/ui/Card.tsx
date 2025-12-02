import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    noPadding?: boolean;
    variant?: 'default' | 'bordered' | 'glass' | 'elevated';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', noPadding = false, variant = 'default', children, ...props }, ref) => {

        const variants = {
            default: 'bg-white border border-secondary-200 shadow-soft hover:shadow-soft-lg',
            bordered: 'bg-white border border-secondary-200 shadow-sm',
            glass: 'bg-white/70 backdrop-blur-xl border border-white/40 shadow-glass',
            elevated: 'bg-white border border-secondary-100 shadow-lg hover:shadow-xl hover:-translate-y-1',
        };

        return (
            <div
                ref={ref}
                className={`rounded-xl transition-all duration-300 ${variants[variant]} ${!noPadding ? 'p-6' : ''} ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';
