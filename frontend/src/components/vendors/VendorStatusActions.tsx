import React from 'react';
import { Button } from '../ui';
import { CheckCircle, XCircle } from 'lucide-react';

interface VendorStatusActionsProps {
  status?: string;
  canUpdateStatus: boolean;
  isUpdatingStatus: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export const VendorStatusActions: React.FC<VendorStatusActionsProps> = ({
  status,
  canUpdateStatus,
  isUpdatingStatus,
  onApprove,
  onReject,
}) => {
  if (!canUpdateStatus || status === 'approved') return null;

  return (
    <div className="flex gap-3">
      {status !== 'approved' && (
        <Button
          variant="success"
          onClick={onApprove}
          isLoading={isUpdatingStatus}
          leftIcon={<CheckCircle size={18} />}
        >
          Approve Vendor
        </Button>
      )}
      {status !== 'rejected' && (
        <Button
          variant="danger"
          onClick={onReject}
          isLoading={isUpdatingStatus}
          leftIcon={<XCircle size={18} />}
        >
          Reject Vendor
        </Button>
      )}
    </div>
  );
};
