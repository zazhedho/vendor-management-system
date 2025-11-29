import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { vendorsApi } from '../../api/vendors';
import { toast } from 'react-toastify';
import { Save, X, Upload, FileText, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { VendorProfile, VendorProfileFile } from '../../types';

export const VendorForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [vendorData, setVendorData] = useState({
    user_id: '',
    vendor_type: '',
    status: 'pending',
  });

  const [profileData, setProfileData] = useState<Partial<VendorProfile>>({
    vendor_name: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    province: '',
    city: '',
    district: '',
    business_field: '',
    ktp_number: '',
    ktp_name: '',
    npwp_number: '',
    npwp_name: '',
    npwp_address: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    nib_number: '',
  });

  const [profileFiles, setProfileFiles] = useState<VendorProfileFile[]>([]);
  const [newFiles, setNewFiles] = useState<{ file: File; type: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      fetchVendor(id);
    }
  }, [id, isEditMode]);

  const fetchVendor = async (vendorId: string) => {
    try {
      const response = await vendorsApi.getById(vendorId);
      if (response.status && response.data) {
        const vendor = response.data;
        setVendorData({
          user_id: vendor.user_id,
          vendor_type: vendor.vendor_type,
          status: vendor.status,
        });

        // Fetch vendor profile
        const profileResponse = await vendorsApi.getProfile(vendorId);
        if (profileResponse.status && profileResponse.data) {
          setProfileData(profileResponse.data);
          if (profileResponse.data.files) {
            setProfileFiles(profileResponse.data.files);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch vendor:', error);
      toast.error('Failed to load vendor data');
    }
  };

  const handleVendorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setVendorData({ ...vendorData, [e.target.name]: e.target.value });
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and PDF files are allowed');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setNewFiles([...newFiles, { file, type: fileType }]);
      e.target.value = '';
    }
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
  };

  const handleDeleteExistingFile = async (fileId: string) => {
    if (!profileData.id || !window.confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await vendorsApi.deleteProfileFile(profileData.id, fileId);
      if (response.status) {
        setProfileFiles(profileFiles.filter(f => f.id !== fileId));
        toast.success('File deleted successfully');
      } else {
        toast.error(response.message || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let vendorId = id;

      // Create or Update vendor
      if (isEditMode && id) {
        const response = await vendorsApi.update(id, vendorData);
        if (!response.status) {
          toast.error(response.message || 'Failed to update vendor');
          setIsLoading(false);
          return;
        }
      } else {
        const response = await vendorsApi.create(vendorData);
        if (!response.status) {
          toast.error(response.message || 'Failed to create vendor');
          setIsLoading(false);
          return;
        }
        vendorId = response.data?.id;
      }

      // Create or Update vendor profile
      if (vendorId) {
        const profileSubmitData = {
          ...profileData,
          vendor_id: vendorId,
        };

        if (profileData.id) {
          const response = await vendorsApi.updateProfile(profileData.id, profileSubmitData);
          if (!response.status) {
            toast.error(response.message || 'Failed to update profile');
            setIsLoading(false);
            return;
          }
        } else {
          const response = await vendorsApi.createProfile(profileSubmitData);
          if (!response.status) {
            toast.error(response.message || 'Failed to create profile');
            setIsLoading(false);
            return;
          }
          if (response.data) {
            setProfileData(response.data);
          }
        }
      }

      // Upload new files if provided
      if (newFiles.length > 0 && profileData.id) {
        let uploadedCount = 0;
        let failedCount = 0;

        for (const fileData of newFiles) {
          try {
            const response = await vendorsApi.uploadProfileFile(
              profileData.id,
              fileData.file,
              fileData.type
            );
            if (response.status) {
              uploadedCount++;
            } else {
              failedCount++;
            }
          } catch (uploadError) {
            console.error('Failed to upload file:', uploadError);
            failedCount++;
          }
        }

        if (uploadedCount > 0) {
          toast.success(`${uploadedCount} file(s) uploaded successfully`);
        }
        if (failedCount > 0) {
          toast.warning(`${failedCount} file(s) failed to upload`);
        }
      }

      toast.success(isEditMode ? 'Vendor updated successfully' : 'Vendor created successfully');
      navigate('/vendors');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save vendor';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getFileTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ktp: 'KTP',
      npwp: 'NPWP',
      bank_book: 'Bank Account Book',
      nib: 'NIB',
      siup: 'SIUP',
      akta: 'Akta Perusahaan',
    };
    return labels[type] || type.toUpperCase();
  };

  const getFileStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      approved: 'bg-green-50 border-green-200 text-green-700',
      rejected: 'bg-red-50 border-red-200 text-red-700',
    };
    return colors[status] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Vendor' : 'Create New Vendor'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditMode ? 'Update vendor information and profile' : 'Fill in the details to create a new vendor'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vendor Basic Info */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Vendor Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="label">User ID <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="user_id"
                value={vendorData.user_id}
                onChange={handleVendorChange}
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
              <label className="label">Vendor Type <span className="text-red-500">*</span></label>
              <select
                name="vendor_type"
                value={vendorData.vendor_type}
                onChange={handleVendorChange}
                className="input"
                required
              >
                <option value="">Select vendor type</option>
                <option value="catering">Catering</option>
                <option value="decoration">Decoration</option>
                <option value="photography">Photography</option>
                <option value="entertainment">Entertainment</option>
                <option value="venue">Venue</option>
                <option value="transportation">Transportation</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="label">Status <span className="text-red-500">*</span></label>
              <select
                name="status"
                value={vendorData.status}
                onChange={handleVendorChange}
                className="input"
                required
              >
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vendor Profile */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Vendor Profile</h2>

          <div className="space-y-6">
            {/* Business Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Vendor Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="vendor_name"
                    value={profileData.vendor_name}
                    onChange={handleProfileChange}
                    className="input"
                    placeholder="Company or business name"
                    required
                  />
                </div>

                <div>
                  <label className="label">Business Field</label>
                  <input
                    type="text"
                    name="business_field"
                    value={profileData.business_field}
                    onChange={handleProfileChange}
                    className="input"
                    placeholder="e.g., Catering Services, Wedding Photography"
                  />
                </div>

                <div>
                  <label className="label">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="input"
                    placeholder="business@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="input"
                    placeholder="021-12345678"
                  />
                </div>

                <div>
                  <label className="label">Mobile</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={profileData.mobile}
                    onChange={handleProfileChange}
                    className="input"
                    placeholder="08123456789"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div>
                  <label className="label">Province</label>
                  <input
                    type="text"
                    name="province"
                    value={profileData.province}
                    onChange={handleProfileChange}
                    className="input"
                    placeholder="e.g., DKI Jakarta"
                  />
                </div>

                <div>
                  <label className="label">City</label>
                  <input
                    type="text"
                    name="city"
                    value={profileData.city}
                    onChange={handleProfileChange}
                    className="input"
                    placeholder="e.g., Jakarta Selatan"
                  />
                </div>

                <div>
                  <label className="label">District</label>
                  <input
                    type="text"
                    name="district"
                    value={profileData.district}
                    onChange={handleProfileChange}
                    className="input"
                    placeholder="e.g., Kebayoran Baru"
                  />
                </div>
              </div>

              <div>
                <label className="label">Full Address</label>
                <textarea
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  className="input min-h-24"
                  placeholder="Complete business address"
                  rows={3}
                />
              </div>
            </div>

            {/* KTP Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">KTP (Identity Card)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">KTP Number</label>
                  <input
                    type="text"
                    name="ktp_number"
                    value={profileData.ktp_number}
                    onChange={handleProfileChange}
                    className="input"
                    placeholder="16 digit KTP number"
                    maxLength={16}
                  />
                </div>

                <div>
                  <label className="label">Name on KTP</label>
                  <input
                    type="text"
                    name="ktp_name"
                    value={profileData.ktp_name}
                    onChange={handleProfileChange}
                    className="input"
                    placeholder="Name as shown on KTP"
                  />
                </div>
              </div>
            </div>

            {/* NPWP Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">NPWP (Tax ID)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <label className="label">NPWP Number</label>
                  <input
                    type="text"
                    name="npwp_number"
                    value={profileData.npwp_number}
                    onChange={handleProfileChange}
                    className="input"
                    placeholder="15 digit NPWP number"
                    maxLength={15}
                  />
                </div>

                <div>
                  <label className="label">Name on NPWP</label>
                  <input
                    type="text"
                    name="npwp_name"
                    value={profileData.npwp_name}
                    onChange={handleProfileChange}
                    className="input"
                    placeholder="Name as shown on NPWP"
                  />
                </div>
              </div>

              <div>
                <label className="label">NPWP Address</label>
                <textarea
                  name="npwp_address"
                  value={profileData.npwp_address}
                  onChange={handleProfileChange}
                  className="input min-h-20"
                  placeholder="Address as shown on NPWP"
                  rows={2}
                />
              </div>
            </div>

            {/* Bank Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Bank Account</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="label">Bank Name</label>
                  <input
                    type="text"
                    name="bank_name"
                    value={profileData.bank_name}
                    onChange={handleProfileChange}
                    className="input"
                    placeholder="e.g., BCA, Mandiri"
                  />
                </div>

                <div>
                  <label className="label">Account Number</label>
                  <input
                    type="text"
                    name="bank_account_number"
                    value={profileData.bank_account_number}
                    onChange={handleProfileChange}
                    className="input"
                    placeholder="Bank account number"
                  />
                </div>

                <div>
                  <label className="label">Account Holder Name</label>
                  <input
                    type="text"
                    name="bank_account_name"
                    value={profileData.bank_account_name}
                    onChange={handleProfileChange}
                    className="input"
                    placeholder="Name on bank account"
                  />
                </div>
              </div>
            </div>

            {/* NIB Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">NIB (Business License)</h3>
              <div>
                <label className="label">NIB Number</label>
                <input
                  type="text"
                  name="nib_number"
                  value={profileData.nib_number}
                  onChange={handleProfileChange}
                  className="input"
                  placeholder="13 digit NIB number"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Document Files */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Document Files</h2>

          {/* Existing Files */}
          {profileFiles.length > 0 && (
            <div className="mb-6 space-y-2">
              <p className="text-sm font-medium text-gray-700">Current Files:</p>
              {profileFiles.map((file) => (
                <div key={file.id} className={`flex items-center justify-between p-3 border rounded-lg ${getFileStatusColor(file.status)}`}>
                  <div className="flex items-center flex-1">
                    <FileText size={20} className="mr-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {getFileTypeLabel(file.file_type)}
                      </p>
                      <p className="text-xs">{file.file_url.split('/').pop()}</p>
                      {file.caption && <p className="text-xs mt-1">{file.caption}</p>}
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      {file.status === 'approved' && <CheckCircle size={16} className="text-green-600" />}
                      {file.status === 'rejected' && <XCircle size={16} className="text-red-600" />}
                      <span className="text-xs font-medium uppercase">{file.status}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteExistingFile(file.id)}
                    className="ml-2 p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New Files to Upload */}
          {newFiles.length > 0 && (
            <div className="mb-6 space-y-2">
              <p className="text-sm font-medium text-gray-700">New Files to Upload:</p>
              {newFiles.map((fileData, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center flex-1">
                    <FileText size={20} className="text-green-600 mr-2" />
                    <span className="text-sm text-green-700 font-medium">
                      {getFileTypeLabel(fileData.type)} - {fileData.file.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveNewFile(index)}
                    className="ml-2 p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* File Upload Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['ktp', 'npwp', 'bank_book', 'nib', 'siup', 'akta'].map((fileType) => (
              <label key={fileType} className="flex flex-col items-center justify-center h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <Upload className="w-5 h-5 mb-1 text-gray-500" />
                <span className="text-xs text-gray-600 font-medium text-center px-1">
                  {getFileTypeLabel(fileType)}
                </span>
                <span className="text-xs text-gray-500">JPG, PNG, PDF</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={(e) => handleFileAdd(e, fileType)}
                />
              </label>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Upload required documents: KTP, NPWP, Bank Book, and business licenses (MAX. 5MB per file)
          </p>
        </div>

        {/* Form Actions */}
        <div className="card">
          <div className="flex items-center justify-end space-x-4">
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
              <span>{isLoading ? 'Saving...' : isEditMode ? 'Update Vendor' : 'Create Vendor'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
