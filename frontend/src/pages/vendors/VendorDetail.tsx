import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { vendorsApi } from '../../api/vendors';
import { Vendor, VendorProfile } from '../../types';
import { ArrowLeft, Edit, ShoppingBag, MapPin, Phone, Mail, Building } from 'lucide-react';

export const VendorDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchVendorData(id);
    }
  }, [id]);

  const fetchVendorData = async (vendorId: string) => {
    setIsLoading(true);
    try {
      const vendorResponse = await vendorsApi.getById(vendorId);
      if (vendorResponse.status && vendorResponse.data) {
        setVendor(vendorResponse.data);
      }

      try {
        const profileResponse = await vendorsApi.getProfile(vendorId);
        if (profileResponse.status && profileResponse.data) {
          setProfile(profileResponse.data);
        }
      } catch (error) {
        console.log('No profile found for vendor');
      }
    } catch (error) {
      console.error('Failed to fetch vendor:', error);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="card text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Vendor not found</h3>
        <button onClick={() => navigate('/vendors')} className="btn btn-primary mt-4">
          Back to Vendors
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/vendors')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          <span>Back to Vendors</span>
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="text-primary-600" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {profile?.vendor_name || `Vendor #${vendor.id.slice(0, 8)}`}
              </h1>
              <div className="flex items-center space-x-3 mt-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(vendor.status)}`}>
                  {vendor.status}
                </span>
                <span className="text-sm text-gray-600">{vendor.vendor_type}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/vendors/${id}/edit`)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Edit size={20} />
            <span>Edit</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {profile ? (
            <>
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center text-gray-600 mb-2">
                      <Mail size={16} className="mr-2" />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <p className="text-gray-900 ml-6">{profile.email || 'N/A'}</p>
                  </div>

                  <div>
                    <div className="flex items-center text-gray-600 mb-2">
                      <Phone size={16} className="mr-2" />
                      <span className="text-sm font-medium">Phone</span>
                    </div>
                    <p className="text-gray-900 ml-6">{profile.phone || profile.mobile || 'N/A'}</p>
                  </div>

                  <div>
                    <div className="flex items-center text-gray-600 mb-2">
                      <Building size={16} className="mr-2" />
                      <span className="text-sm font-medium">Business Field</span>
                    </div>
                    <p className="text-gray-900 ml-6">{profile.business_field || 'N/A'}</p>
                  </div>

                  <div>
                    <div className="flex items-center text-gray-600 mb-2">
                      <Building size={16} className="mr-2" />
                      <span className="text-sm font-medium">NPWP</span>
                    </div>
                    <p className="text-gray-900 ml-6">{profile.npwp_number || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {profile.address && (
                <div className="card">
                  <div className="flex items-center space-x-2 mb-4">
                    <MapPin size={20} className="text-gray-500" />
                    <h2 className="text-xl font-semibold text-gray-900">Address</h2>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-900">{profile.address}</p>
                    <div className="text-sm text-gray-600">
                      {[profile.district, profile.city, profile.province].filter(Boolean).join(', ')}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card">
              <p className="text-gray-500 italic">No profile information available</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Vendor Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500">Vendor ID</p>
                <p className="text-sm text-gray-900 font-mono break-all">{vendor.id}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">User ID</p>
                <p className="text-sm text-gray-900 font-mono break-all">{vendor.user_id}</p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm text-gray-900">
                  {new Date(vendor.created_at).toLocaleString('id-ID')}
                </p>
              </div>

              {vendor.updated_at && (
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-sm text-gray-900">
                    {new Date(vendor.updated_at).toLocaleString('id-ID')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
