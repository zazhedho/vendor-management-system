import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import { Button, Card, ConfirmModal } from '../../components/ui';
import { VendorListTable } from '../../components/vendor';
import { vendorsApi } from '../../api/vendors';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

interface VendorWithProfile {
  vendor: any;
  profile: any;
}

export const VendorProfileList: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  const [vendorList, setVendorList] = useState<VendorWithProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteVendorId, setDeleteVendorId] = useState<string | null>(null);
  const [isDeletingVendor, setIsDeletingVendor] = useState(false);

  const canListVendors = hasPermission('vendor', 'list');
  const canUpdateVendor = hasPermission('vendor', 'update'); // Covers both create and update
  const canDeleteVendor = hasPermission('vendor', 'delete');
  const canExport = hasPermission('vendor', 'read');

  // Redirect based on role
  useEffect(() => {
    // Vendor role should see their own profile, not list
    if (user?.role === 'vendor') {
      navigate('/vendor/profile/detail');
      return;
    }

    // Admin/Client with list permission should use /vendors page instead
    if (canListVendors) {
      navigate('/vendors');
      return;
    }
  }, [user, canListVendors, navigate]);

  const fetchVendorsList = async () => {
    setIsLoading(true);
    try {
      const response = await vendorsApi.getAll({
        page: currentPage,
        limit: 10,
        search: searchTerm
      });
      if (response.status) {
        setVendorList((response.data || []) as unknown as VendorWithProfile[]);
      }
    } catch (error: any) {
      console.error('Failed to fetch vendors:', error);
      setVendorList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorsList();
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchVendorsList();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleReset = async () => {
    setSearchTerm('');
    setCurrentPage(1);

    setIsLoading(true);
    try {
      const response = await vendorsApi.getAll({
        page: 1,
        limit: 10,
        search: ''
      });
      if (response.status) {
        setVendorList((response.data || []) as unknown as VendorWithProfile[]);
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVendorConfirm = async () => {
    if (!deleteVendorId) return;
    setIsDeletingVendor(true);
    try {
      const response = await vendorsApi.delete(deleteVendorId);
      if (response.status) {
        toast.success('Vendor deleted successfully');
        await fetchVendorsList();
      } else {
        toast.error('Failed to delete vendor');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete vendor');
    } finally {
      setIsDeletingVendor(false);
      setDeleteVendorId(null);
    }
  };

  const extractFilename = (contentDisposition: string | undefined): string | null => {
    if (!contentDisposition) return null;
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      return filenameMatch[1].replace(/['"]/g, '');
    }
    return null;
  };

  const ensureXlsxExtension = (name: string): string => {
    if (!name) return 'vendor_profile.xlsx';
    return name.toLowerCase().endsWith('.xlsx') ? name : `${name}.xlsx`;
  };

  const handleExport = async (vendorId: string) => {
    if (!vendorId || !canExport) return;
    try {
      const response = await vendorsApi.exportProfile(vendorId);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const contentDisposition = response.headers?.['content-disposition'];
      const parsedName = extractFilename(contentDisposition);
      const filename = ensureXlsxExtension(parsedName || 'vendor_profile.xlsx');

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Berhasil mengekspor profil vendor');
    } catch (error) {
      console.error('Failed to export vendor profile:', error);
      toast.error('Gagal mengekspor profil vendor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Vendor Profiles</h1>
          <p className="text-secondary-500 text-sm mt-1">Manage and view all registered vendors</p>
        </div>
        {canUpdateVendor && (
          <Button
            onClick={() => navigate('/vendor/profile/new')}
            leftIcon={<Plus size={20} />}
          >
            Add Vendor
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <Button onClick={handleSearch} leftIcon={<Search size={20} />}>
            Search
          </Button>
          {searchTerm && (
            <Button onClick={handleReset} variant="secondary" leftIcon={<X size={20} />}>
              Reset
            </Button>
          )}
        </div>
      </Card>

      <VendorListTable
        vendors={vendorList}
        isLoading={isLoading}
        canUpdateVendor={canUpdateVendor}
        canDeleteVendor={canDeleteVendor}
        canExport={canExport}
        onDelete={(id) => setDeleteVendorId(id)}
        onExport={handleExport}
      />

      <ConfirmModal
        show={!!deleteVendorId}
        title="Delete Vendor"
        message="Are you sure you want to delete this vendor? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeletingVendor}
        onConfirm={handleDeleteVendorConfirm}
        onCancel={() => setDeleteVendorId(null)}
      />
    </div>
  );
};
