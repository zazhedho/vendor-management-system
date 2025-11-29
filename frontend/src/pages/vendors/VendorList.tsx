import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendorsApi } from '../../api/vendors';
import { Vendor } from '../../types';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { Button, Input, Card, Table, Badge } from '../../components/ui';

export const VendorList: React.FC = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchVendors();
  }, [currentPage, searchTerm]);

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

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;

    try {
      await vendorsApi.delete(id);
      fetchVendors();
    } catch (error) {
      console.error('Failed to delete vendor:', error);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'success';
      case 'verified': return 'info';
      case 'suspended': return 'danger';
      case 'rejected': return 'danger';
      default: return 'warning';
    }
  };

  const columns = [
    {
      header: 'Vendor ID',
      accessor: (vendor: Vendor) => <span className="font-mono text-xs">{vendor.id.slice(0, 8)}...</span>
    },
    {
      header: 'Type',
      accessor: 'vendor_type'
    },
    {
      header: 'Status',
      accessor: (vendor: Vendor) => (
        <Badge variant={getStatusVariant(vendor.status)} className="capitalize">
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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); navigate(`/vendors/${vendor.id}/edit`); }}
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
            onClick={(e) => handleDelete(e, vendor.id)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
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
        <Button
          onClick={() => navigate('/vendors/new')}
          leftIcon={<Plus size={20} />}
        >
          Add Vendor
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" size={20} />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
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
    </div>
  );
};
