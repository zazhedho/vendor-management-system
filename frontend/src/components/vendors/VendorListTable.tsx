import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Badge, ActionMenu } from '../ui';
import { Eye, Edit, Trash2, Download } from 'lucide-react';

interface VendorWithProfile {
  vendor: any;
  profile: any;
}

interface VendorListTableProps {
  vendors: VendorWithProfile[];
  isLoading: boolean;
  canUpdateVendor: boolean;
  canDeleteVendor: boolean;
  canExport: boolean;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
}

const getStatusVariant = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'success';
    case 'pending': return 'warning';
    case 'revision': return 'danger';
    case 'suspended': return 'danger';
    default: return 'secondary';
  }
};

export const VendorListTable: React.FC<VendorListTableProps> = ({
  vendors,
  isLoading,
  canUpdateVendor,
  canDeleteVendor,
  canExport,
  onDelete,
  onExport,
}) => {
  const navigate = useNavigate();

  const columns = [
    {
      header: 'Vendor Name',
      accessor: (item: VendorWithProfile) => (
        <div>
          <p className="font-semibold text-secondary-900">{item.profile?.vendor_name || '-'}</p>
          {item.vendor?.vendor_code && (
            <p className="text-xs text-secondary-500 font-mono">{item.vendor.vendor_code}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Email',
      accessor: (item: VendorWithProfile) => item.profile?.email || '-',
    },
    {
      header: 'Phone',
      accessor: (item: VendorWithProfile) => item.profile?.phone || '-',
    },
    {
      header: 'Status',
      accessor: (item: VendorWithProfile) => (
        <Badge variant={getStatusVariant(item.vendor?.status)} className="capitalize">
          {item.vendor?.status || 'unknown'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: (item: VendorWithProfile) => (
        <ActionMenu
          items={[
            {
              label: 'View',
              icon: <Eye size={14} />,
              onClick: () => navigate(`/vendor/profile/${item.vendor.id}/detail`),
            },
            {
              label: 'Edit',
              icon: <Edit size={14} />,
              onClick: () => navigate(`/vendor/profile/${item.vendor.id}/edit`),
              hidden: !canUpdateVendor,
            },
            {
              label: 'Export',
              icon: <Download size={14} />,
              onClick: () => onExport(item.vendor.id),
              hidden: !canExport,
            },
            {
              label: 'Delete',
              icon: <Trash2 size={14} />,
              onClick: () => onDelete(item.vendor.id),
              variant: 'danger',
              hidden: !canDeleteVendor,
            },
          ]}
        />
      ),
    },
  ];

  return (
    <Table
      data={vendors}
      columns={columns}
      keyField="vendor"
      isLoading={isLoading}
      emptyMessage="No vendors found"
      onRowClick={(item) => navigate(`/vendor/profile/${item.vendor.id}/detail`)}
    />
  );
};
