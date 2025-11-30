import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { vendorsApi } from '../../api/vendors';
import { toast } from 'react-toastify';
import { Save, X, Upload, FileText, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { VendorProfile, VendorProfileFile } from '../../types';
import { Button, Input, Card, Stepper, Spinner, ConfirmModal } from '../../components/ui';

// Helper to format file type with proper capitalization
const formatFileType = (type: string): string => {
  const upperCaseTypes: Record<string, string> = {
    'ktp': 'KTP',
    'npwp': 'NPWP',
    'nib': 'NIB',
    'siup': 'SIUP',
    'akta': 'Akta',
    'bank_book': 'Bank Book',
    'sppkp': 'SPPKP',
    'tdp': 'TDP',
    'skdp': 'SKDP',
  };
  return upperCaseTypes[type.toLowerCase()] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const VendorForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  const [vendorData, setVendorData] = useState({
    user_id: '',
    vendor_type: '',
    status: 'pending',
  });

  const [profileData, setProfileData] = useState<Partial<VendorProfile>>({
    vendor_name: '',
    email: '',
    phone: '',
    telephone: '',
    fax: '',
    address: '',
    province_id: '',
    province_name: '',
    city_id: '',
    city_name: '',
    district_id: '',
    district_name: '',
    postal_code: '',
    business_field: '',
    // KTP
    ktp_number: '',
    ktp_name: '',
    // NPWP
    npwp_number: '',
    npwp_name: '',
    npwp_address: '',
    tax_status: '',
    // NIB
    nib_number: '',
    // Bank
    bank_name: '',
    bank_branch: '',
    account_number: '',
    account_holder_name: '',
    // Business
    transaction_type: '',
    purch_group: '',
    region_or_so: '',
    // Contact
    contact_person: '',
    contact_email: '',
    contact_phone: '',
  });

  const [profileFiles, setProfileFiles] = useState<VendorProfileFile[]>([]);
  const [newFiles, setNewFiles] = useState<{ file: File; type: string }[]>([]);
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  const steps = [
    { title: 'General Info', description: 'Basic vendor details' },
    { title: 'Address', description: 'Location information' },
    { title: 'Legal & Bank', description: 'Documents & Finance' },
    { title: 'Documents', description: 'Upload files' },
  ];

  useEffect(() => {
    if (isEditMode && id) {
      fetchVendor(id);
    }
  }, [id, isEditMode]);

  const fetchVendor = async (vendorId: string) => {
    setIsInitialLoading(true);
    try {
      const response = await vendorsApi.getById(vendorId);
      if (response.status && response.data) {
        const vendor = response.data;
        setVendorData({
          user_id: vendor.user_id,
          vendor_type: vendor.vendor_type,
          status: vendor.status,
        });

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
    } finally {
      setIsInitialLoading(false);
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
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and PDF files are allowed');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
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

  const handleDeleteExistingFileClick = (fileId: string) => {
    if (!profileData.id) return;
    setDeleteFileId(fileId);
  };

  const handleDeleteExistingFileConfirm = async () => {
    if (!profileData.id || !deleteFileId) return;
    setIsDeletingFile(true);
    try {
      const response = await vendorsApi.deleteProfileFile(profileData.id, deleteFileId);
      if (response.status) {
        setProfileFiles(profileFiles.filter(f => f.id !== deleteFileId));
        toast.success('File deleted');
      }
    } catch (error) {
      toast.error('Failed to delete file');
    } finally {
      setIsDeletingFile(false);
      setDeleteFileId(null);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      let vendorId = id;

      // 1. Create/Update Vendor
      if (isEditMode && id) {
        const response = await vendorsApi.update(id, vendorData);
        if (!response.status) throw new Error(response.message || 'Failed to update vendor');
      } else {
        const response = await vendorsApi.create(vendorData);
        if (!response.status) throw new Error(response.message || 'Failed to create vendor');
        vendorId = response.data?.id;
      }

      // 2. Create/Update Profile
      if (vendorId) {
        // Map frontend fields to backend DTO fields
        const profileSubmitData = {
          ...profileData,
          vendor_id: vendorId,
          bank_account_number: profileData.account_number,
          bank_account_name: profileData.account_holder_name,
        };

        if (profileData.id) {
          const response = await vendorsApi.updateProfile(profileData.id, profileSubmitData);
          if (!response.status) throw new Error(response.message || 'Failed to update profile');
        } else {
          const response = await vendorsApi.createProfile(profileSubmitData);
          if (!response.status) throw new Error(response.message || 'Failed to create profile');
          if (response.data) setProfileData(response.data);
        }
      }

      // 3. Upload Files
      if (newFiles.length > 0 && profileData.id) {
        let uploadedCount = 0;
        for (const fileData of newFiles) {
          try {
            const response = await vendorsApi.uploadProfileFile(profileData.id, fileData.file, fileData.type);
            if (response.status) uploadedCount++;
          } catch (e) { console.error(e); }
        }
        if (uploadedCount > 0) toast.success(`${uploadedCount} files uploaded`);
      }

      toast.success(isEditMode ? 'Vendor updated' : 'Vendor created');
      navigate('/vendors');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save vendor');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  if (isInitialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">
          {isEditMode ? 'Edit Vendor Profile' : 'New Vendor Registration'}
        </h1>
        <p className="text-secondary-500 mt-2">
          Complete the wizard below to {isEditMode ? 'update' : 'register'} a vendor.
        </p>
      </div>

      <Stepper steps={steps} currentStep={currentStep} />

      <div className="mt-8">
        {/* Step 1: General Info */}
        {currentStep === 0 && (
          <Card className="animate-fade-in">
            <h2 className="text-xl font-semibold mb-6">General Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="User ID"
                name="user_id"
                value={vendorData.user_id}
                onChange={handleVendorChange}
                disabled={isEditMode}
                required
                placeholder="UUID"
              />
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">Vendor Type</label>
                <select
                  name="vendor_type"
                  value={vendorData.vendor_type}
                  onChange={handleVendorChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                >
                  <option value="">Select Type</option>
                  <option value="catering">Catering</option>
                  <option value="decoration">Decoration</option>
                  <option value="photography">Photography</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="venue">Venue</option>
                  <option value="transportation">Transportation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <Input
                label="Vendor Name"
                name="vendor_name"
                value={profileData.vendor_name}
                onChange={handleProfileChange}
                required
              />
              <Input
                label="Email"
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                required
              />
              <Input
                label="Phone"
                name="phone"
                value={profileData.phone}
                onChange={handleProfileChange}
              />
              <Input
                label="Telephone"
                name="telephone"
                value={profileData.telephone}
                onChange={handleProfileChange}
              />
              <Input
                label="Fax"
                name="fax"
                value={profileData.fax}
                onChange={handleProfileChange}
              />
              <Input
                label="Business Field"
                name="business_field"
                value={profileData.business_field}
                onChange={handleProfileChange}
                className="md:col-span-2"
              />
            </div>
          </Card>
        )}

        {/* Step 2: Address */}
        {currentStep === 1 && (
          <Card className="animate-fade-in">
            <h2 className="text-xl font-semibold mb-6">Address Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Province ID"
                name="province_id"
                value={profileData.province_id}
                onChange={handleProfileChange}
              />
              <Input
                label="Province Name"
                name="province_name"
                value={profileData.province_name}
                onChange={handleProfileChange}
              />
              <Input
                label="City ID"
                name="city_id"
                value={profileData.city_id}
                onChange={handleProfileChange}
              />
              <Input
                label="City Name"
                name="city_name"
                value={profileData.city_name}
                onChange={handleProfileChange}
              />
              <Input
                label="District ID"
                name="district_id"
                value={profileData.district_id}
                onChange={handleProfileChange}
              />
              <Input
                label="District Name"
                name="district_name"
                value={profileData.district_name}
                onChange={handleProfileChange}
              />
              <Input
                label="Postal Code"
                name="postal_code"
                value={profileData.postal_code}
                onChange={handleProfileChange}
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">Full Address</label>
                <textarea
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Legal & Bank */}
        {currentStep === 2 && (
          <Card className="animate-fade-in">
            <h2 className="text-xl font-semibold mb-6">Legal & Financial</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="KTP Number"
                  name="ktp_number"
                  value={profileData.ktp_number}
                  onChange={handleProfileChange}
                  maxLength={16}
                />
                <Input
                  label="Name on KTP"
                  name="ktp_name"
                  value={profileData.ktp_name}
                  onChange={handleProfileChange}
                />
                <Input
                  label="NPWP Number"
                  name="npwp_number"
                  value={profileData.npwp_number}
                  onChange={handleProfileChange}
                  maxLength={15}
                />
                <Input
                  label="Name on NPWP"
                  name="npwp_name"
                  value={profileData.npwp_name}
                  onChange={handleProfileChange}
                />
                <Input
                  label="NIB Number"
                  name="nib_number"
                  value={profileData.nib_number}
                  onChange={handleProfileChange}
                />
              </div>

              <div className="border-t border-secondary-100 pt-6">
                <h3 className="text-lg font-medium mb-4">Bank Account</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input
                    label="Bank Name"
                    name="bank_name"
                    value={profileData.bank_name}
                    onChange={handleProfileChange}
                  />
                  <Input
                    label="Account Number"
                    name="account_number"
                    value={profileData.account_number}
                    onChange={handleProfileChange}
                  />
                  <Input
                    label="Account Holder"
                    name="account_holder_name"
                    value={profileData.account_holder_name}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step 4: Documents */}
        {currentStep === 3 && (
          <Card className="animate-fade-in">
            <h2 className="text-xl font-semibold mb-6">Document Uploads</h2>

            {/* Existing Files */}
            {profileFiles.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-secondary-500 mb-3 uppercase tracking-wider">Uploaded Files</h3>
                <div className="space-y-3">
                  {profileFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg bg-secondary-50">
                      <div className="flex items-center gap-3">
                        <FileText className="text-primary-600" size={20} />
                        <div>
                          <p className="font-medium text-secondary-900">{formatFileType(file.file_type)}</p>
                          <a href={file.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:underline">
                            View Document
                          </a>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExistingFileClick(file.id)}
                        className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Files List */}
            {newFiles.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-secondary-500 mb-3 uppercase tracking-wider">Ready to Upload</h3>
                <div className="space-y-3">
                  {newFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border border-success-200 rounded-lg bg-success-50">
                      <div className="flex items-center gap-3">
                        <FileText className="text-success-600" size={20} />
                        <div>
                          <p className="font-medium text-success-900 capitalize">{file.type.replace('_', ' ')}</p>
                          <p className="text-xs text-success-700">{file.file.name}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveNewFile(idx)}
                        className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['ktp', 'npwp', 'bank_book', 'nib', 'siup', 'akta'].map((type) => (
                <label key={type} className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-secondary-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all group">
                  <Upload className="w-6 h-6 text-secondary-400 group-hover:text-primary-500 mb-2" />
                  <span className="text-sm font-medium text-secondary-600 group-hover:text-primary-600">
                    {formatFileType(type)}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileAdd(e, type)}
                  />
                </label>
              ))}
            </div>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="secondary"
            onClick={prevStep}
            disabled={currentStep === 0 || isLoading}
            leftIcon={<ArrowLeft size={16} />}
          >
            Previous
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              variant="primary"
              onClick={nextStep}
              rightIcon={<ArrowRight size={16} />}
            >
              Next Step
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isLoading}
              leftIcon={<Save size={16} />}
            >
              {isEditMode ? 'Update Vendor' : 'Create Vendor'}
            </Button>
          )}
        </div>
      </div>

      <ConfirmModal
        show={!!deleteFileId}
        title="Delete File"
        message="Are you sure you want to delete this file?"
        confirmText="Delete"
        variant="danger"
        isLoading={isDeletingFile}
        onConfirm={handleDeleteExistingFileConfirm}
        onCancel={() => setDeleteFileId(null)}
      />
    </div>
  );
};
