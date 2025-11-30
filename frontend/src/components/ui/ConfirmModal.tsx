import React from 'react';
import { X, AlertTriangle, Trash2, CheckCircle, Info } from 'lucide-react';
import { Button } from './Button';

type ConfirmVariant = 'danger' | 'warning' | 'success' | 'info';

interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig: Record<ConfirmVariant, { icon: React.ReactNode; buttonVariant: 'danger' | 'primary' | 'secondary' }> = {
  danger: {
    icon: <Trash2 size={24} className="text-danger-600" />,
    buttonVariant: 'danger',
  },
  warning: {
    icon: <AlertTriangle size={24} className="text-warning-600" />,
    buttonVariant: 'primary',
  },
  success: {
    icon: <CheckCircle size={24} className="text-success-600" />,
    buttonVariant: 'primary',
  },
  info: {
    icon: <Info size={24} className="text-primary-600" />,
    buttonVariant: 'primary',
  },
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!show) return null;

  const config = variantConfig[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">{config.icon}</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-secondary-900">{title}</h3>
              <p className="text-sm text-secondary-600 mt-1">{message}</p>
            </div>
            <button
              onClick={onCancel}
              className="shrink-0 text-secondary-400 hover:text-secondary-600"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 bg-secondary-50 rounded-b-lg">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant={config.buttonVariant} size="sm" onClick={onConfirm} isLoading={isLoading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
