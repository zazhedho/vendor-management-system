import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { vendorsApi } from '../../api/vendors';
import { locationApi, LocationItem } from '../../api/location';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Save, X, Upload, FileText, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { VendorProfile, VendorProfileFile } from '../../types';
import { Button, Input, Card, Stepper, Spinner, ConfirmModal } from '../../components/ui';
import { useErrorHandler } from '../../hooks/useErrorHandler';

// Helper to format file type with proper capitalization
const formatFileType = (type: string): string => {
  const upperCaseTypes: Record<string, string> = {
    ktp: 'KTP',
    npwp: 'NPWP',
    nib: 'NIB',
    siup: 'SIUP',
    akta: 'Akta',
    bank_book: 'Bank Book',
    sppkp: 'SPPKP',
    domisili: 'Izin Domisili',
    skt: 'SKT',
    rekening: 'Rekening',
  };
  return upperCaseTypes[type.toLowerCase()] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const VendorForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { handleSilentError } = useErrorHandler();

  // Check if this is vendor editing their own profile (routes like /vendor/profile/edit or /vendor/profile/new)
  const isVendorSelfEdit = location.pathname.startsWith('/vendor/profile');
  const isEditMode = !!id || (isVendorSelfEdit && !location.pathname.endsWith('/new'));

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  const [vendorData, setVendorData] = useState({
    user_id: '',
    vendor_type: '',
    status: 'pending',
  });

  const [profileData, setProfileData] = useState<Partial<VendorProfile> & { vendor_type?: string }>({
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

  const companyDocs = ['ktp', 'domisili', 'siup', 'nib', 'skt', 'npwp', 'sppkp', 'akta', 'bank_book'];
  const individualDocs = ['ktp', 'npwp', 'bank_book'];

  // Location states
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [cities, setCities] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedCityCode, setSelectedCityCode] = useState('');

  const steps = [
    { title: 'General Info', description: 'Basic vendor details' },
    { title: 'Address', description: 'Location information' },
    { title: 'Legal & Bank', description: 'Documents & Finance' },
    { title: 'Documents', description: 'Upload files' },
  ];

  useEffect(() => {
    fetchProvinces();
    if (isEditMode) {
      if (id) {
        fetchVendor(id);
      } else if (isVendorSelfEdit) {
        fetchMyVendorProfile();
      }
    }
  }, [id, isEditMode, isVendorSelfEdit]);

  useEffect(() => {
    if (selectedProvinceCode) {
      fetchCities(selectedProvinceCode);
      setCities([]);
      setDistricts([]);
      setSelectedCityCode('');
    }
  }, [selectedProvinceCode]);

  useEffect(() => {
    if (selectedProvinceCode && selectedCityCode) {
      fetchDistricts(selectedProvinceCode, selectedCityCode);
      setDistricts([]);
    }
  }, [selectedCityCode]);

  const fetchProvinces = async () => {
    try {
      const response = await locationApi.getProvinces();
      if (response.status && response.data) {
        setProvinces(response.data);
      }
    } catch (error) {
      handleSilentError(error, 'Fetching provinces');
    }
  };

  const fetchCities = async (provinceCode: string) => {
    try {
      const response = await locationApi.getCities(provinceCode);
      if (response.status && response.data) {
        setCities(response.data);
      }
    } catch (error) {
      handleSilentError(error, `Fetching cities for province ${provinceCode}`);
    }
  };

  const fetchDistricts = async (provinceCode: string, cityCode: string) => {
    try {
      const response = await locationApi.getDistricts(provinceCode, cityCode);
      if (response.status && response.data) {
        setDistricts(response.data);
      }
    } catch (error) {
      handleSilentError(error, `Fetching districts for province ${provinceCode}, city ${cityCode}`);
    }
  };

  const fetchMyVendorProfile = async () => {
    setIsInitialLoading(true);
    try {
      const response = await vendorsApi.getMyVendorProfile();
      if (response.status && response.data) {
        const data = response.data as any;
        const vendor = data.vendor;
        const profile = data.profile;

        if (vendor) {
          setVendorData({
            user_id: vendor.user_id || user?.id || '',
            vendor_type: vendor.vendor_type || '',
            status: vendor.status || 'pending',
          });
        }

        if (profile) {
          setProfileData({ ...profile, vendor_type: vendor?.vendor_type });
          if (profile.files) {
            setProfileFiles(profile.files);
          }
          if (profile.province_id) setSelectedProvinceCode(profile.province_id);
          if (profile.city_id) setSelectedCityCode(profile.city_id);
        }
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        handleSilentError(error, 'Fetching vendor profile');
        toast.error('Failed to load vendor profile');
      }
    } finally {
      setIsInitialLoading(false);
    }
  };

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
          setProfileData({ ...profileResponse.data, vendor_type: vendor.vendor_type });
          if (profileResponse.data.files) {
            setProfileFiles(profileResponse.data.files);
          }
          if (profileResponse.data.province_id) setSelectedProvinceCode(profileResponse.data.province_id);
          if (profileResponse.data.city_id) setSelectedCityCode(profileResponse.data.city_id);
        }
      }
    } catch (error) {
      handleSilentError(error, `Fetching vendor data for ID ${id}`);
      toast.error('Failed to load vendor data');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleVendorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVendorData({ ...vendorData, [name]: value });
    if (name === 'vendor_type') {
      setProfileData({ ...profileData, vendor_type: value });
    }
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
      // Create/Update Profile (akan auto create vendor jika belum ada)
      const profileSubmitData = {
        ...profileData,
        vendor_type: vendorData.vendor_type,
        bank_account_number: profileData.account_number,
        bank_account_name: profileData.account_holder_name,
      };

      let response;
      if (isVendorSelfEdit) {
        // Vendor editing own profile - use POST /vendor/profile (create or update)
        response = await vendorsApi.createProfile(profileSubmitData);
      } else if (profileData.id) {
        // Admin editing existing vendor profile
        response = await vendorsApi.updateProfile(profileData.id, profileSubmitData);
      } else {
        // Admin creating new vendor profile
        response = await vendorsApi.createProfile(profileSubmitData);
      }

      if (!response.status) throw new Error(response.message || 'Failed to save profile');
      
      const savedProfile = (response.data as any)?.profile || response.data;
      if (savedProfile) setProfileData(savedProfile);

      // Upload Files
      if (newFiles.length > 0 && savedProfile?.id) {
        let uploadedCount = 0;
        for (const fileData of newFiles) {
          try {
            const fileResponse = await vendorsApi.uploadProfileFile(savedProfile.id, fileData.file, fileData.type);
            if (fileResponse.status) uploadedCount++;
          } catch (e) { handleSilentError(e, `Uploading file: ${fileData.type}`); }
        }
        if (uploadedCount > 0) toast.success(`${uploadedCount} files uploaded`);
      }

      toast.success(isEditMode ? 'Vendor updated' : 'Vendor created');
      // Redirect based on context
      if (isVendorSelfEdit) {
        navigate('/vendor/profile/detail');
      } else {
        navigate('/vendors');
      }
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
    <div className="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">
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
          <Card className="animate-fade-in p-6 md:p-8 lg:p-10">
            <h2 className="text-xl font-semibold mb-6">General Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {!isVendorSelfEdit && (
                <Input
                  label="User ID"
                  name="user_id"
                  value={vendorData.user_id}
                  onChange={handleVendorChange}
                  disabled={isEditMode}
                  required
                  placeholder="UUID"
                />
              )}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  Vendor Type <span className="text-danger-500">*</span>
                </label>
                <select
                  name="vendor_type"
                  value={vendorData.vendor_type}
                  onChange={handleVendorChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="company">Company</option>
                  <option value="individual">Individual</option>
                </select>
              </div>
              <Input
                label="Vendor Name"
                name="vendor_name"
                value={profileData.vendor_name}
                onChange={handleProfileChange}
                placeholder="Enter vendor company name"
                required
              />
              <Input
                label="Email"
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                placeholder="vendor@example.com"
                required
              />
              <Input
                label="Phone"
                name="phone"
                value={profileData.phone}
                onChange={handleProfileChange}
                placeholder="08123456789"
              />
              <Input
                label="Telephone"
                name="telephone"
                value={profileData.telephone}
                onChange={handleProfileChange}
                placeholder="021-12345678"
              />
              <Input
                label="Fax"
                name="fax"
                value={profileData.fax}
                onChange={handleProfileChange}
                placeholder="021-87654321"
              />
              <Input
                label="Business Field"
                name="business_field"
                value={profileData.business_field}
                onChange={handleProfileChange}
                placeholder="e.g., Catering Services, Event Management"
                className="md:col-span-2"
              />
            </div>
          </Card>
        )}

        {/* Step 2: Address */}
        {currentStep === 1 && (
          <Card className="animate-fade-in p-6 md:p-8 lg:p-10">
            <h2 className="text-xl font-semibold mb-6">Address Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  Province <span className="text-danger-500">*</span>
                </label>
                <select
                  value={selectedProvinceCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    const selected = provinces.find(p => p.code === code);
                    setSelectedProvinceCode(code);
                    setProfileData({
                      ...profileData,
                      province_id: code,
                      province_name: selected?.name || '',
                      city_id: '',
                      city_name: '',
                      district_id: '',
                      district_name: '',
                    });
                  }}
                  className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  required
                >
                  <option value="">Select Province</option>
                  {provinces.map((prov) => (
                    <option key={prov.code} value={prov.code}>{prov.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  City <span className="text-danger-500">*</span>
                </label>
                <select
                  value={selectedCityCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    const selected = cities.find(c => c.code === code);
                    setSelectedCityCode(code);
                    setProfileData({
                      ...profileData,
                      city_id: code,
                      city_name: selected?.name || '',
                      district_id: '',
                      district_name: '',
                    });
                  }}
                  disabled={!selectedProvinceCode}
                  className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none disabled:bg-secondary-50 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Select City</option>
                  {cities.map((city) => (
                    <option key={city.code} value={city.code}>{city.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  District <span className="text-danger-500">*</span>
                </label>
                <select
                  value={profileData.district_id}
                  onChange={(e) => {
                    const code = e.target.value;
                    const selected = districts.find(d => d.code === code);
                    setProfileData({
                      ...profileData,
                      district_id: code,
                      district_name: selected?.name || '',
                    });
                  }}
                  disabled={!selectedCityCode}
                  className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none disabled:bg-secondary-50 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Select District</option>
                  {districts.map((dist) => (
                    <option key={dist.code} value={dist.code}>{dist.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              <Input
                label="Postal Code"
                name="postal_code"
                value={profileData.postal_code}
                onChange={handleProfileChange}
                placeholder="e.g., 12345"
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">Full Address</label>
                <textarea
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  rows={4}
                  placeholder="Enter complete address including street name, building number, etc."
                  className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Legal & Bank */}
        {currentStep === 2 && (
          <Card className="animate-fade-in p-6 md:p-8 lg:p-10">
            <h2 className="text-xl font-semibold mb-6">Legal & Financial</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Input
                  label="KTP Number"
                  name="ktp_number"
                  value={profileData.ktp_number}
                  onChange={handleProfileChange}
                  placeholder="16 digit KTP number"
                  maxLength={16}
                />
                <Input
                  label="Name on KTP"
                  name="ktp_name"
                  value={profileData.ktp_name}
                  onChange={handleProfileChange}
                  placeholder="Full name as on KTP"
                />
                <Input
                  label="NPWP Number"
                  name="npwp_number"
                  value={profileData.npwp_number}
                  onChange={handleProfileChange}
                  placeholder="15 digit NPWP number"
                  maxLength={15}
                />
                <Input
                  label="Name on NPWP"
                  name="npwp_name"
                  value={profileData.npwp_name}
                  onChange={handleProfileChange}
                  placeholder="Full name as on NPWP"
                />
                {vendorData.vendor_type === 'company' && (
                  <Input
                    label="NIB Number"
                    name="nib_number"
                    value={profileData.nib_number}
                    onChange={handleProfileChange}
                    placeholder="Business identification number"
                  />
                )}
              </div>

              <div className="border-t border-secondary-100 pt-6">
                <h3 className="text-lg font-medium mb-4">Bank Account</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <Input
                    label="Bank Name"
                    name="bank_name"
                    value={profileData.bank_name}
                    onChange={handleProfileChange}
                    placeholder="e.g., BCA, Mandiri"
                  />
                  <Input
                    label="Account Number"
                    name="account_number"
                    value={profileData.account_number}
                    onChange={handleProfileChange}
                    placeholder="Bank account number"
                  />
                  <Input
                    label="Account Holder"
                    name="account_holder_name"
                    value={profileData.account_holder_name}
                    onChange={handleProfileChange}
                    placeholder="Account holder name"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step 4: Documents */}
        {currentStep === 3 && (
          <Card className="animate-fade-in p-6 md:p-8 lg:p-10">
            <h2 className="text-xl font-semibold mb-6">Document Uploads</h2>
            <p className="text-sm text-secondary-600 mb-4">
              {vendorData.vendor_type === 'individual'
                ? 'Perorangan wajib unggah: KTP, NPWP, Buku Tabungan.'
                : 'Perusahaan wajib unggah: KTP pemilik, Izin Domisili, SIUP/NIB, SKT, NPWP, SP-PKP, Akta Perusahaan, Rekening (halaman depan/buku tabungan).'}
            </p>

            {vendorData.vendor_type === '' && (
              <div className="mb-6 p-4 border border-warning-200 rounded-lg bg-warning-50 text-sm text-warning-800">
                Pilih Vendor Type terlebih dahulu agar daftar dokumen sesuai.
              </div>
            )}

            {/* Document Grid - show existing file OR upload slot for each type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {(vendorData.vendor_type === 'individual' ? individualDocs : companyDocs).map((type) => {
                const existingFile = profileFiles.find((f) => f.file_type === type);
                const pendingFile = newFiles.find((f) => f.type === type);

                // Show existing uploaded file
                if (existingFile) {
                  return (
                    <div
                      key={type}
                      className={`flex items-center gap-3 p-4 border rounded-xl shadow-sm ${
                        existingFile.status === 'rejected'
                          ? 'border-danger-200 bg-danger-50/70'
                          : existingFile.status === 'approved'
                            ? 'border-success-200 bg-success-50/70'
                            : 'border-secondary-200 bg-secondary-50'
                      }`}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/60 border border-white/70">
                        <FileText size={18} className={
                          existingFile.status === 'rejected'
                            ? 'text-danger-500'
                            : existingFile.status === 'approved'
                              ? 'text-success-600'
                              : 'text-primary-600'
                        } />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-secondary-900 truncate">{formatFileType(existingFile.file_type)}</p>
                        <p className="text-xs text-secondary-500 truncate capitalize">Status: {existingFile.status}</p>
                        {existingFile.status === 'rejected' && existingFile.reject_reason && (
                          <p className="text-[11px] text-danger-700 mt-1 whitespace-pre-line">Alasan: {existingFile.reject_reason}</p>
                        )}
                        <a href={existingFile.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:underline">
                          View
                        </a>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExistingFileClick(existingFile.id)}
                        className="text-danger-600 hover:bg-danger-50 hover:text-danger-700 flex-shrink-0"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  );
                }

                // Show pending file (ready to upload)
                if (pendingFile) {
                  const pendingIndex = newFiles.findIndex((f) => f.type === type);
                  return (
                    <div
                      key={type}
                      className="flex items-center gap-3 p-4 border border-warning-200 rounded-xl bg-warning-50/70 shadow-sm"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/60 border border-white/70">
                        <FileText size={18} className="text-warning-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-secondary-900 truncate">{formatFileType(type)}</p>
                        <p className="text-xs text-warning-700 truncate">{pendingFile.file.name}</p>
                        <p className="text-[11px] text-warning-600">Ready to upload</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveNewFile(pendingIndex)}
                        className="text-danger-600 hover:bg-danger-50 hover:text-danger-700 flex-shrink-0"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  );
                }

                // Show upload slot
                return (
                  <label
                    key={type}
                    className={`flex flex-col items-center justify-center h-32 border-2 border-dashed border-secondary-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all group ${
                      !vendorData.vendor_type ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    <Upload className="w-6 h-6 text-secondary-400 group-hover:text-primary-500 mb-2" />
                    <span className="text-sm font-medium text-secondary-600 group-hover:text-primary-600 text-center px-2">
                      {formatFileType(type)}
                    </span>
                    <p className="text-[11px] text-secondary-400 mt-1">PDF/JPG/PNG</p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileAdd(e, type)}
                      disabled={!vendorData.vendor_type}
                    />
                  </label>
                );
              })}
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
