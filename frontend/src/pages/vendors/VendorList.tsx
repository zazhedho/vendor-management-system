import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendorsApi } from '../../api/vendors';
import { Vendor } from '../../types';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { Button, Card, Table, Badge, ConfirmModal, ActionMenu } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

export const VendorList: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canUpdateVendor = hasPermission('vendor', 'update');
  const canDeleteVendor = hasPermission('vendor', 'delete');
  
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchVendors();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const response = await vendorsApi.getAll({
        page: currentPage,
        limit: 10,
        search: searchTerm,
      });

      if (response.status) {
        setVendors(response.data || []);
        setTotalPages(response.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await vendorsApi.delete(deleteId);
      fetchVendors();
    } catch (error) {
      console.error('Failed to delete vendor:', error);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'success';
      case 'verify': return 'info';
      case 'suspended': return 'danger';
      case 'rejected': return 'danger';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  const columns = [
    {
      header: 'Vendor ID',
      accessor: (vendor: Vendor) => <span className="font-mono text-xs">{vendor.id.slice(0, 8)}...</span>
    },
    {
      header: 'Type',
      accessor: (vendor: Vendor) => vendor.vendor_type
    },
    {
      header: 'Status',
      accessor: (vendor: Vendor) => (
        <Badge variant={getStatusVariant(vendor.status)} className="capitalize font-semibold px-3 py-1">
          {vendor.status}
        </Badge>
      )
    },
    {
      header: 'Created At',
      accessor: (vendor: Vendor) => new Date(vendor.created_at).toLocaleDateString()
    },
    {
      header: 'Actions',
      accessor: (vendor: Vendor) => (
        <ActionMenu
          items={[
            {
              label: 'View',
              icon: <Eye size={14} />,
              onClick: () => navigate(`/vendors/${vendor.id}`),
            },
            {
              label: 'Edit',
              icon: <Edit size={14} />,
              onClick: () => navigate(`/vendors/${vendor.id}/edit`),
              hidden: !canUpdateVendor,
            },
            {
              label: 'Delete',
              icon: <Trash2 size={14} />,
              onClick: () => setDeleteId(vendor.id),
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
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
          </div>
          <Button onClick={handleSearch}>
            <Search size={16} className="mr-2" />
            Search
          </Button>
        </div>
      </Card>

      <Table
        data={vendors}
        columns={columns}
        keyField="id"
        isLoading={isLoading}
        onRowClick={(vendor) => navigate(`/vendors/${vendor.id}`)}
        emptyMessage="No vendors found. Add one to get started."
      />

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-secondary-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
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
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
