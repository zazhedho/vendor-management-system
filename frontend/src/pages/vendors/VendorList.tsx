import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendorsApi } from '../../api/vendors';
import { Vendor } from '../../types';
import { Plus, Search, ShoppingBag, Eye, Edit, Trash2 } from 'lucide-react';

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
        limit: 12,
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;

    try {
      await vendorsApi.delete(id);
      fetchVendors();
    } catch (error) {
      console.error('Failed to delete vendor:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'inactive':
        return 'bg-gray-100 text-gray-700';
      case 'suspended':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600 mt-2">Manage vendor information and profiles</p>
        </div>
        <button
          onClick={() => navigate('/vendors/new')}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Vendor</span>
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : vendors.length === 0 ? (
        <div className="card text-center py-12">
          <ShoppingBag className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
          <p className="text-gray-600 mb-4">Start by adding your first vendor</p>
          <button
            onClick={() => navigate('/vendors/new')}
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Vendor</span>
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <ShoppingBag className="text-primary-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Vendor #{vendor.id.slice(0, 8)}</h3>
                      <p className="text-sm text-gray-600">{vendor.vendor_type}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vendor.status)}`}>
                    {vendor.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <span className="text-gray-500">User ID:</span>
                    <span className="ml-2 font-mono text-xs">{vendor.user_id.slice(0, 12)}...</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <span>Created:</span>
                    <span className="ml-2">
                      {new Date(vendor.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/vendors/${vendor.id}`)}
                    className="flex-1 btn btn-secondary text-sm py-2 flex items-center justify-center space-x-1"
                  >
                    <Eye size={16} />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => navigate(`/vendors/${vendor.id}/edit`)}
                    className="flex-1 btn btn-primary text-sm py-2 flex items-center justify-center space-x-1"
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(vendor.id)}
                    className="btn bg-red-50 text-red-600 hover:bg-red-100 text-sm py-2 px-3"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
