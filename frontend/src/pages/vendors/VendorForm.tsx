import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { vendorsApi } from '../../api/vendors';
import { Save, X } from 'lucide-react';

export const VendorForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    user_id: '',
    vendor_type: '',
    status: 'active',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode && id) {
      fetchVendor(id);
    }
  }, [id]);

  const fetchVendor = async (vendorId: string) => {
    try {
      const response = await vendorsApi.getById(vendorId);
      if (response.status && response.data) {
        const vendor = response.data;
        setFormData({
          user_id: vendor.user_id,
          vendor_type: vendor.vendor_type,
          status: vendor.status,
        });
      }
    } catch (error) {
      console.error('Failed to fetch vendor:', error);
      setError('Failed to load vendor data');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isEditMode && id) {
        await vendorsApi.update(id, formData);
      } else {
        await vendorsApi.create(formData);
      }
      navigate('/vendors');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save vendor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Vendor' : 'Create New Vendor'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditMode ? 'Update vendor information' : 'Fill in the details to create a new vendor'}
        </p>
      </div>

      <div className="card">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">User ID *</label>
            <input
              type="text"
              name="user_id"
              value={formData.user_id}
              onChange={handleChange}
              className="input"
              placeholder="Enter user ID"
              required
              disabled={isEditMode}
            />
            {isEditMode && (
              <p className="text-sm text-gray-500 mt-1">User ID cannot be changed</p>
            )}
          </div>

          <div>
            <label className="label">Vendor Type *</label>
            <select
              name="vendor_type"
              value={formData.vendor_type}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">Select vendor type</option>
              <option value="catering">Catering</option>
              <option value="decoration">Decoration</option>
              <option value="photography">Photography</option>
              <option value="entertainment">Entertainment</option>
              <option value="venue">Venue</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="label">Status *</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/vendors')}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <X size={20} />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Save size={20} />
              <span>{isLoading ? 'Saving...' : 'Save Vendor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
