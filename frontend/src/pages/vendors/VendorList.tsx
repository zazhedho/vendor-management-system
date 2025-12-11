import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorsApi } from '../../api/vendors';
import { Vendor, VendorProfile } from '../../types';
import { Plus, Search, Eye, Edit, Trash2, ShoppingBag } from 'lucide-react';
import { Button, Card, Table, Badge, ConfirmModal, ActionMenu, EmptyState } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { usePagination, useDebounce } from '../../hooks';

interface VendorListItem {
  id: string;
  vendor: Vendor;
  profile: VendorProfile | null;
}

export const VendorList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canListVendors = hasPermission('vendor', 'list');
  const canUpdateVendor = hasPermission('vendor', 'update');
  const canDeleteVendor = hasPermission('vendor', 'delete');

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { currentPage, goToNextPage, goToPrevPage, canGoNext, canGoPrev } = usePagination(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['vendors', { page: currentPage, search: debouncedSearch }],
    queryFn: () => vendorsApi.getAll({ page: currentPage, limit: 10, search: debouncedSearch }),
    enabled: canListVendors,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setDeleteId(null);
    },
  });

  // Show message if no permission
  if (!canListVendors) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Access Denied</h2>
          <p className="text-secondary-600">You don't have permission to view vendors list.</p>
        </Card>
      </div>
    );
  }

  const rawData: Array<{ vendor: Vendor; profile: VendorProfile | null }> = response?.data || [];
  const vendorsData: VendorListItem[] = rawData.map((item) => ({
    id: item.vendor.id,
    vendor: item.vendor,
    profile: item.profile,
  }));
  const totalPages = response?.total_pages || 1;

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'success';
      case 'verify': return 'info';
      case 'suspended': return 'danger';
      case 'revision': return 'danger';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  const columns = [
    {
      header: 'Vendor Name',
      accessor: (item: VendorListItem) => (
        <span className="font-semibold text-secondary-900">
          {item.profile?.vendor_name || '-'}
        </span>
      )
    },
    {
      header: 'Vendor Code',
      accessor: (item: VendorListItem) => item.vendor.vendor_code ? (
        <span className="font-semibold text-secondary-900">{item.vendor.vendor_code}</span>
      ) : (
        <span className="text-secondary-500">-</span>
      )
    },
    {
      header: 'Type',
      accessor: (item: VendorListItem) => item.vendor.vendor_type
    },
    {
      header: 'Status',
      accessor: (item: VendorListItem) => (
        <Badge variant={getStatusVariant(item.vendor.status)} className="capitalize font-semibold px-3 py-1">
          {item.vendor.status}
        </Badge>
      )
    },
    {
      header: 'Created At',
      accessor: (item: VendorListItem) => new Date(item.vendor.created_at).toLocaleDateString()
    },
    {
      header: 'Actions',
      accessor: (item: VendorListItem) => (
        <ActionMenu
          items={[
            {
              label: 'View',
              icon: <Eye size={14} />,
              onClick: () => navigate(`/vendors/${item.vendor.id}`),
            },
            {
              label: 'Edit',
              icon: <Edit size={14} />,
              onClick: () => navigate(`/vendors/${item.vendor.id}/edit`),
              hidden: !canUpdateVendor,
            },
            {
              label: 'Delete',
              icon: <Trash2 size={14} />,
              onClick: () => setDeleteId(item.vendor.id),
              variant: 'danger',
              hidden: !canDeleteVendor,
            },
          ]}
        />
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Vendors</h1>
          <p className="text-secondary-500">Manage your vendor database</p>
        </div>
        {canUpdateVendor && (
          <Button
            onClick={() => navigate('/vendors/new')}
            leftIcon={<Plus size={20} />}
          >
            Add Vendor
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" size={20} />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
          </div>
        </div>
      </Card>

      <Table
        data={vendorsData}
        columns={columns}
        keyField="id"
        isLoading={isLoading}
        onRowClick={(item) => navigate(`/vendors/${item.vendor.id}`)}
        emptyState={
          <EmptyState
            icon={ShoppingBag}
            title="No Vendors Found"
            description="You haven't added any vendors yet. Start by creating your first vendor profile."
            actionLabel={canUpdateVendor ? "Add Vendor" : undefined}
            onAction={canUpdateVendor ? () => navigate('/vendors/new') : undefined}
            variant="compact"
          />
        }
      />

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="secondary"
            onClick={goToPrevPage}
            disabled={!canGoPrev}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-secondary-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={goToNextPage}
            disabled={!canGoNext(totalPages)}
          >
            Next
          </Button>
        </div>
      )}

      <ConfirmModal
        show={!!deleteId}
        title="Delete Vendor"
        message="Are you sure you want to delete this vendor? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
