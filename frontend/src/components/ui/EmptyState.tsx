import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'compact';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
}) => {
  const isCompact = variant === 'compact';

  return (
    <Card className={`text-center ${isCompact ? 'py-8 px-6' : 'py-12 md:py-16 px-6'}`}>
      <Icon
        size={isCompact ? 40 : 48}
        className="mx-auto text-secondary-300 mb-4"
      />
      <h3 className={`font-semibold text-secondary-900 mb-2 ${isCompact ? 'text-base' : 'text-lg md:text-xl'}`}>
        {title}
      </h3>
      <p className={`text-secondary-500 mb-6 max-w-lg mx-auto ${isCompact ? 'text-sm' : 'text-sm md:text-base'}`}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="md">
          {actionLabel}
        </Button>
      )}
    </Card>
  );
};
