import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { vendorsApi } from '../../api/vendors';
import { locationApi, LocationItem } from '../../api/location';
import { useAuth } from '../../context/AuthContext';
import { Vendor, VendorProfile as VendorProfileType } from '../../types';
import {
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Building,
  FileText,
  Save,
  Upload,
  CreditCard,
  User,
  AlertCircle,
  Eye,
  Search
} from 'lucide-react';
import { Button, Card, Badge, Spinner, Input, ConfirmModal } from '../../components/ui';
import { toast } from 'react-toastify';

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

interface VendorWithProfile {
  vendor: Vendor;
  profile: VendorProfileType;
}

export const VendorProfile: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  
  // Determine view mode based on role and URL
  const isVendorRole = useMemo(() => user?.role === 'vendor', [user?.role]);
  const isEditMode = location.pathname.endsWith('/edit');
  const isNewMode = location.pathname.endsWith('/new');
  const isDetailMode = location.pathname.endsWith('/detail');
  
  // For vendor role: always show their own profile form
  // For admin role: show list on /vendor/profile, detail/edit on other routes
  const showListView = useMemo(() => {
    if (isVendorRole) return false;
    // Admin sees list only on exact /vendor/profile path
    return location.pathname === '/vendor/profile';
  }, [isVendorRole, location.pathname]);
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [profile, setProfile] = useState<VendorProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // isEditing based on URL for proper routing
  const isEditing = isEditMode || isNewMode;
  
  // For admin list view
  const [vendorList, setVendorList] = useState<VendorWithProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Location states
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [cities, setCities] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedCityCode, setSelectedCityCode] = useState('');

  const [formData, setFormData] = useState({
    vendor_name: '',
    email: '',
    telephone: '',
    fax: '',
    phone: '',
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

  // File upload states
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState<string>('');
  
  // Delete file modal
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      if (showListView) {
        // Admin viewing list
        await fetchVendorsList();
      } else {
        // Vendor viewing own profile OR admin viewing/editing specific vendor
        await fetchVendorProfile();
        await fetchProvinces();
      }
    };
    loadData();
  }, [user, showListView, id]);
  
  useEffect(() => {
    if (!user || !showListView) return;
    if (currentPage > 1 || searchTerm) {
      fetchVendorsList();
    }
  }, [currentPage, searchTerm]);

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

  // Fetch vendors list for admin/superadmin/client
  const fetchVendorsList = async () => {
    setIsLoading(true);
    try {
      const response = await vendorsApi.getAll({ 
        page: currentPage, 
        limit: 10,
        search: searchTerm 
      });
      console.log('Vendors list response:', response);
      if (response.status) {
        setVendorList(response.data || []);
        setTotalPages(response.total_pages || 1);
      }
    } catch (error: any) {
      console.error('Failed to fetch vendors:', error);
      setVendorList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      const response = await locationApi.getProvinces();
      if (response.status && response.data) {
        setProvinces(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch provinces:', error);
    }
  };

  const fetchCities = async (provinceCode: string) => {
    try {
      const response = await locationApi.getCities(provinceCode);
      if (response.status && response.data) {
        setCities(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    }
  };

  const fetchDistricts = async (provinceCode: string, cityCode: string) => {
    try {
      const response = await locationApi.getDistricts(provinceCode, cityCode);
      if (response.status && response.data) {
        setDistricts(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch districts:', error);
    }
  };

  const fetchVendorProfile = async () => {
    setIsLoading(true);
    try {
      const response = await vendorsApi.getMyVendorProfile();
      console.log('Vendor profile response:', response);
      if (response.status && response.data) {
        const data = response.data;
        // Handle both direct response and nested data structure
        const vendorData = (data as any).vendor || data;
        const profileData = (data as any).profile || null;
        
        setVendor(vendorData?.id ? vendorData : null);
        setProfile(profileData);

        if (profileData) {
          setFormData({
            vendor_name: profileData.vendor_name || '',
            email: profileData.email || '',
            telephone: profileData.telephone || '',
            fax: profileData.fax || '',
            phone: profileData.phone || '',
            address: profileData.address || '',
            province_id: profileData.province_id || '',
            province_name: profileData.province_name || '',
            city_id: profileData.city_id || '',
            city_name: profileData.city_name || '',
            district_id: profileData.district_id || '',
            district_name: profileData.district_name || '',
            postal_code: profileData.postal_code || '',
            business_field: profileData.business_field || '',
            ktp_number: profileData.ktp_number || '',
            ktp_name: profileData.ktp_name || '',
            npwp_number: profileData.npwp_number || '',
            npwp_name: profileData.npwp_name || '',
            npwp_address: profileData.npwp_address || '',
            tax_status: profileData.tax_status || '',
            nib_number: profileData.nib_number || '',
            bank_name: profileData.bank_name || '',
            bank_branch: profileData.bank_branch || '',
            account_number: profileData.account_number || '',
            account_holder_name: profileData.account_holder_name || '',
            transaction_type: profileData.transaction_type || '',
            purch_group: profileData.purch_group || '',
            region_or_so: profileData.region_or_so || '',
            contact_person: profileData.contact_person || '',
            contact_email: profileData.contact_email || '',
            contact_phone: profileData.contact_phone || '',
          });
          // Set location codes for dropdowns
          if (profileData.province_id) setSelectedProvinceCode(profileData.province_id);
          if (profileData.city_id) setSelectedCityCode(profileData.city_id);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch vendor profile:', error);
      // 404 is expected when vendor profile doesn't exist yet
      // 403 means user is not a vendor
      if (error.response?.status === 403) {
        toast.error('You are not authorized to view vendor profile. Only vendors can access this page.');
      } else if (error.response?.status !== 404) {
        toast.error('Failed to load vendor profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await vendorsApi.createOrUpdateProfile(formData);
      if (response.status) {
        toast.success('Profile saved successfully');
        navigate(getBackUrl());
        fetchVendorProfile();
      } else {
        toast.error(response.message || 'Failed to save profile');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    if (!e.target.files || !e.target.files[0] || !profile?.id) return;

    const file = e.target.files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and PDF files are allowed');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      e.target.value = '';
      return;
    }

    setUploadingFile(true);
    setSelectedFileType(fileType);
    try {
      const response = await vendorsApi.uploadProfileFile(profile.id, file, fileType);
      if (response.status) {
        toast.success('File uploaded successfully');
        await fetchVendorProfile();
      } else {
        toast.error('Failed to upload file');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
      setSelectedFileType('');
      e.target.value = '';
    }
  };

  const handleDeleteFileClick = (fileId: string) => {
    if (!profile?.id) return;
    setDeleteFileId(fileId);
  };

  const handleDeleteFileConfirm = async () => {
    if (!profile?.id || !deleteFileId) return;
    setIsDeletingFile(true);
    try {
      const response = await vendorsApi.deleteProfileFile(profile.id, deleteFileId);
      if (response.status) {
        toast.success('File deleted successfully');
        await fetchVendorProfile();
      } else {
        toast.error('Failed to delete file');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete file');
    } finally {
      setIsDeletingFile(false);
      setDeleteFileId(null);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'verified': return 'info';
      case 'suspended': return 'danger';
      case 'rejected': return 'danger';
      default: return 'warning';
    }
  };

  const renderFormFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Vendor/Company Name"
          value={formData.vendor_name}
          onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
          leftIcon={<Building size={18} />}
          required
        />
        <Input
          label="Business Field"
          value={formData.business_field}
          onChange={(e) => setFormData({ ...formData, business_field: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          leftIcon={<Mail size={18} />}
          required
        />
        <Input
          label="Phone (Mobile)"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          leftIcon={<Phone size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Telephone"
          value={formData.telephone}
          onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
          leftIcon={<Phone size={18} />}
        />
        <Input
          label="Fax"
          value={formData.fax}
          onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
        />
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium text-secondary-700 mb-4">Address</h4>
        <Input
          label="Full Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          leftIcon={<MapPin size={18} />}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Province <span className="text-danger-500">*</span></label>
            <select
              value={selectedProvinceCode}
              onChange={(e) => {
                const code = e.target.value;
                const selected = provinces.find(p => p.code === code);
                setSelectedProvinceCode(code);
                setFormData({ 
                  ...formData, 
                  province_id: code,
                  province_name: selected?.name || '',
                  city_id: '',
                  city_name: '',
                  district_id: '',
                  district_name: ''
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
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">City <span className="text-danger-500">*</span></label>
            <select
              value={selectedCityCode}
              onChange={(e) => {
                const code = e.target.value;
                const selected = cities.find(c => c.code === code);
                setSelectedCityCode(code);
                setFormData({ 
                  ...formData, 
                  city_id: code,
                  city_name: selected?.name || '',
                  district_id: '',
                  district_name: ''
                });
              }}
              disabled={!selectedProvinceCode}
              className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none disabled:bg-secondary-100 disabled:cursor-not-allowed"
              required
            >
              <option value="">Select City</option>
              {cities.map((city) => (
                <option key={city.code} value={city.code}>{city.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">District <span className="text-danger-500">*</span></label>
            <select
              value={formData.district_id}
              onChange={(e) => {
                const code = e.target.value;
                const selected = districts.find(d => d.code === code);
                setFormData({ 
                  ...formData, 
                  district_id: code,
                  district_name: selected?.name || ''
                });
              }}
              disabled={!selectedCityCode}
              className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none disabled:bg-secondary-100 disabled:cursor-not-allowed"
              required
            >
              <option value="">Select District</option>
              {districts.map((dist) => (
                <option key={dist.code} value={dist.code}>{dist.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <Input
            label="Postal Code"
            value={formData.postal_code}
            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            placeholder="e.g. 12345"
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium text-secondary-700 mb-4">KTP Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="KTP Number"
            value={formData.ktp_number}
            onChange={(e) => setFormData({ ...formData, ktp_number: e.target.value })}
            leftIcon={<CreditCard size={18} />}
          />
          <Input
            label="KTP Name"
            value={formData.ktp_name}
            onChange={(e) => setFormData({ ...formData, ktp_name: e.target.value })}
            leftIcon={<User size={18} />}
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium text-secondary-700 mb-4">NPWP & NIB Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="NPWP Number"
            value={formData.npwp_number}
            onChange={(e) => setFormData({ ...formData, npwp_number: e.target.value })}
          />
          <Input
            label="NPWP Name"
            value={formData.npwp_name}
            onChange={(e) => setFormData({ ...formData, npwp_name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Input
            label="NPWP Address"
            value={formData.npwp_address}
            onChange={(e) => setFormData({ ...formData, npwp_address: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Tax Status</label>
            <select
              value={formData.tax_status}
              onChange={(e) => setFormData({ ...formData, tax_status: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
            >
              <option value="">Select Tax Status</option>
              <option value="PKP">PKP</option>
              <option value="non-PKP">Non-PKP</option>
            </select>
          </div>
          <Input
            label="NIB Number"
            value={formData.nib_number}
            onChange={(e) => setFormData({ ...formData, nib_number: e.target.value })}
            placeholder="e.g. 1234567890123"
            leftIcon={<FileText size={18} />}
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium text-secondary-700 mb-4">Bank Account</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Bank Name"
            value={formData.bank_name}
            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
          />
          <Input
            label="Bank Branch"
            value={formData.bank_branch}
            onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input
            label="Account Number"
            value={formData.account_number}
            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
          />
          <Input
            label="Account Holder Name"
            value={formData.account_holder_name}
            onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium text-secondary-700 mb-4">Business Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Transaction Type"
            value={formData.transaction_type}
            onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
          />
          <Input
            label="Purch Group"
            value={formData.purch_group}
            onChange={(e) => setFormData({ ...formData, purch_group: e.target.value })}
          />
          <Input
            label="Region/SO"
            value={formData.region_or_so}
            onChange={(e) => setFormData({ ...formData, region_or_so: e.target.value })}
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium text-secondary-700 mb-4">Contact Person</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Contact Person Name"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
          />
          <Input
            label="Contact Email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
          />
          <Input
            label="Contact Phone"
            value={formData.contact_phone}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
          />
        </div>
      </div>

      {profile && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-secondary-700 mb-4 flex items-center gap-2">
            <FileText size={18} />
            Document Uploads
          </h4>

          {/* Existing Files */}
          {profile.files && profile.files.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-secondary-500 mb-3">Uploaded Documents</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profile.files.map((file) => (
                  <div 
                    key={file.id} 
                    className={`flex flex-col p-3 border rounded-lg ${
                      file.status === 'rejected' 
                        ? 'border-danger-300 bg-danger-50' 
                        : file.status === 'approved'
                        ? 'border-success-300 bg-success-50'
                        : 'border-secondary-200 bg-secondary-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className={`flex-shrink-0 ${
                          file.status === 'rejected' ? 'text-danger-500' : 
                          file.status === 'approved' ? 'text-success-500' : 'text-primary-600'
                        }`} size={20} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-secondary-900 capitalize truncate">
                            {formatFileType(file.file_type)}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs capitalize ${
                              file.status === 'rejected' ? 'text-danger-600' : 
                              file.status === 'approved' ? 'text-success-600' : 'text-warning-600'
                            }`}>
                              {file.status}
                            </span>
                            <span className="text-secondary-300">•</span>
                            <a
                              href={file.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary-600 hover:underline"
                            >
                              View File
                            </a>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFileClick(file.id)}
                        className="text-danger-600 hover:bg-danger-50 flex-shrink-0"
                        leftIcon={<AlertCircle size={14} />}
                      >
                        Delete
                      </Button>
                    </div>
                    {file.status === 'rejected' && file.reject_reason && (
                      <div className="mt-2 pt-2 border-t border-danger-200">
                        <p className="text-xs text-danger-700">
                          <span className="font-medium">Rejection Reason:</span> {file.reject_reason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {['ktp', 'npwp', 'bank_book', 'nib', 'siup', 'akta'].map((type) => (
              <label
                key={type}
                className={`flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                  uploadingFile && selectedFileType === type
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-secondary-300 hover:border-primary-500 hover:bg-primary-50'
                }`}
              >
                {uploadingFile && selectedFileType === type ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-secondary-400 mb-1" />
                    <span className="text-xs font-medium text-secondary-600 text-center px-2">
                      {formatFileType(type)}
                    </span>
                  </>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileUpload(e, type)}
                  disabled={uploadingFile}
                />
              </label>
            ))}
          </div>
          <p className="text-xs text-secondary-500 mt-2">
            Accepted formats: JPG, PNG, PDF (Max 5MB per file)
          </p>
        </div>
      )}
    </>
  );

  if (!user || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Admin/Superadmin/Client view - show vendors list
  if (showListView) {
    const getStatusVariant = (status: string): 'success' | 'info' | 'danger' | 'warning' => {
      switch (status?.toLowerCase()) {
        case 'active': return 'success';
        case 'verified': return 'info';
        case 'suspended': return 'danger';
        case 'rejected': return 'danger';
        default: return 'warning';
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-secondary-900">Vendor Profiles</h1>
        </div>

        {/* Search */}
        <Card>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Vendors Table */}
        <Card className="p-0 overflow-hidden">
          {vendorList.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag size={40} className="mx-auto text-secondary-300 mb-3" />
              <h3 className="font-medium text-secondary-900 mb-1">No vendors found</h3>
              <p className="text-sm text-secondary-500">No vendor profiles available.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="text-left py-2.5 px-4 font-medium text-secondary-600">Vendor</th>
                      <th className="text-left py-2.5 px-4 font-medium text-secondary-600">Email</th>
                      <th className="text-left py-2.5 px-4 font-medium text-secondary-600">Phone</th>
                      <th className="text-left py-2.5 px-4 font-medium text-secondary-600">Type</th>
                      <th className="text-left py-2.5 px-4 font-medium text-secondary-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {vendorList.map((item, index) => (
                      <tr 
                        key={item?.vendor?.id || index} 
                        className="hover:bg-secondary-50 cursor-pointer"
                        onClick={() => navigate(`/vendor/profile/${item?.vendor?.id}/detail`)}
                      >
                        <td className="py-2.5 px-4">
                          <p className="font-medium text-secondary-900">{item?.profile?.vendor_name || '-'}</p>
                          <p className="text-xs text-secondary-500">{item?.profile?.city_name || '-'}, {item?.profile?.province_name || '-'}</p>
                        </td>
                        <td className="py-2.5 px-4 text-secondary-700">{item?.profile?.email || '-'}</td>
                        <td className="py-2.5 px-4 text-secondary-700">{item?.profile?.phone || '-'}</td>
                        <td className="py-2.5 px-4 text-secondary-700 capitalize">{item?.vendor?.vendor_type || '-'}</td>
                        <td className="py-2.5 px-4">
                          <Badge variant={getStatusVariant(item?.vendor?.status || '')}>{item?.vendor?.status || 'pending'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-3 py-2.5 border-t border-secondary-100 bg-secondary-50">
                  <span className="text-xs text-secondary-500">Page {currentPage}/{totalPages}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</Button>
                    <Button variant="ghost" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    );
  }

  // Vendor role - show own profile
  // No vendor record yet - show create form prompt
  if (!vendor && !profile && !isEditing) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-warning-500 mb-4" />
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">
            Vendor Profile Not Found
          </h2>
          <p className="text-secondary-500 mb-6">
            Your account is not registered as a vendor yet. Please complete your vendor profile to get started.
          </p>
          <Button onClick={() => navigate('/vendor/profile/new')}>
            Create Vendor Profile
          </Button>
        </Card>
      </div>
    );
  }

  // Show create form when on /new route
  if (isNewMode || (!vendor && !profile && isEditing)) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <h3 className="text-lg font-semibold mb-6">Create Vendor Profile</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderFormFields()}
            <div className="flex gap-3">
              <Button type="submit" isLoading={isSaving} leftIcon={<Save size={16} />}>
                Save Profile
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/vendor/profile')}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  // Helper to get back URL based on role
  const getBackUrl = () => {
    if (isVendorRole) return '/vendor/profile';
    return '/vendor/profile';
  };

  // Helper to get edit URL based on role
  const getEditUrl = () => {
    if (isVendorRole) return '/vendor/profile/edit';
    return id ? `/vendor/profile/${id}/edit` : '/vendor/profile/edit';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Vendor Profile</h1>
        {!isEditing && (
          <Button onClick={() => navigate(getEditUrl())}>Edit Profile</Button>
        )}
        {isEditing && (
          <Button variant="secondary" onClick={() => navigate(getBackUrl())}>Cancel</Button>
        )}
      </div>

      {/* Header Card */}
      <Card className="bg-gradient-to-r from-secondary-900 to-secondary-800 text-white border-none">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <ShoppingBag className="text-white" size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {profile?.vendor_name || 'My Vendor Profile'}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              {vendor && (
                <>
                  <Badge
                    variant={getStatusVariant(vendor.status)}
                    className="bg-white/20 text-white border-none backdrop-blur-sm"
                  >
                    {vendor.status}
                  </Badge>
                  <span className="text-secondary-300 capitalize">{vendor.vendor_type}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {isEditing ? (
        <Card>
          <h3 className="text-lg font-semibold mb-6">Edit Profile</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderFormFields()}
            <div className="flex gap-3">
              <Button type="submit" isLoading={isSaving} leftIcon={<Save size={16} />}>
                Save Changes
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(getBackUrl())}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {profile ? (
              <>
                <Card>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Building size={20} className="text-primary-600" />
                    Business Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-secondary-500 mb-1">Email Address</p>
                      <div className="flex items-center gap-2 text-secondary-900">
                        <Mail size={16} className="text-secondary-400" />
                        {profile.email || '-'}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-500 mb-1">Phone Number</p>
                      <div className="flex items-center gap-2 text-secondary-900">
                        <Phone size={16} className="text-secondary-400" />
                        {profile.phone || profile.telephone || '-'}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-500 mb-1">Business Field</p>
                      <p className="text-secondary-900">{profile.business_field || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-500 mb-1">NPWP</p>
                      <p className="text-secondary-900 font-mono">{profile.npwp_number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-500 mb-1">NIB Number</p>
                      <p className="text-secondary-900 font-mono">{profile.nib_number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-500 mb-1">Tax Status</p>
                      <p className="text-secondary-900">{profile.tax_status || '-'}</p>
                    </div>
                  </div>
                </Card>

                {(profile.address || profile.province_name) && (
                  <Card>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin size={20} className="text-primary-600" />
                      Location
                    </h2>
                    <p className="text-secondary-900">{profile.address || '-'}</p>
                    <p className="text-secondary-500 mt-1">
                      {[profile.district_name, profile.city_name, profile.province_name].filter(Boolean).join(', ')}
                      {profile.postal_code && ` - ${profile.postal_code}`}
                    </p>
                  </Card>
                )}

                {(profile.bank_name || profile.bank_account_number) && (
                  <Card>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CreditCard size={20} className="text-primary-600" />
                      Bank Account
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-secondary-500 mb-1">Bank Name</p>
                        <p className="text-secondary-900">{profile.bank_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-500 mb-1">Bank Branch</p>
                        <p className="text-secondary-900">{profile.bank_branch || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-500 mb-1">Account Number</p>
                        <p className="text-secondary-900 font-mono">{profile.account_number || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-500 mb-1">Account Name</p>
                        <p className="text-secondary-900">{profile.account_holder_name || '-'}</p>
                      </div>
                    </div>
                  </Card>
                )}

                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <FileText size={20} className="text-primary-600" />
                      Documents
                    </h2>
                  </div>

                  {/* Existing Files */}
                  {profile.files && profile.files.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {profile.files.map((file) => (
                        <div
                          key={file.id}
                          className={`flex flex-col p-3 border rounded-lg bg-white group transition-all ${
                            file.status === 'rejected' 
                              ? 'border-danger-300 bg-danger-50' 
                              : file.status === 'approved'
                              ? 'border-success-300 bg-success-50'
                              : 'border-secondary-200 hover:border-primary-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <a
                              href={file.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-3 flex-1 min-w-0"
                            >
                              <FileText size={20} className={`flex-shrink-0 ${
                                file.status === 'rejected' ? 'text-danger-500' : 
                                file.status === 'approved' ? 'text-success-500' : 'text-secondary-400'
                              }`} />
                              <div className="overflow-hidden flex-1">
                                <p className="font-medium text-secondary-900 capitalize truncate">
                                  {formatFileType(file.file_type)}
                                </p>
                                <p className={`text-xs capitalize ${
                                  file.status === 'rejected' ? 'text-danger-600' : 
                                  file.status === 'approved' ? 'text-success-600' : 'text-warning-600'
                                }`}>
                                  {file.status}
                                </p>
                              </div>
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFileClick(file.id)}
                              className="text-danger-600 hover:bg-danger-50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            >
                              <AlertCircle size={16} />
                            </Button>
                          </div>
                          {file.status === 'rejected' && file.reject_reason && (
                            <div className="mt-2 pt-2 border-t border-danger-200">
                              <p className="text-xs text-danger-700">
                                <span className="font-medium">Reason:</span> {file.reject_reason}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-secondary-500 text-sm mb-6">No documents uploaded yet</p>
                  )}

                  {/* Upload Section */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-secondary-700 mb-3">Upload New Document</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['ktp', 'npwp', 'bank_book', 'nib', 'siup', 'akta'].map((type) => (
                        <label
                          key={type}
                          className={`flex flex-col items-center justify-center h-20 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                            uploadingFile && selectedFileType === type
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-secondary-300 hover:border-primary-500 hover:bg-primary-50'
                          }`}
                        >
                          {uploadingFile && selectedFileType === type ? (
                            <Spinner size="sm" />
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-secondary-400 mb-1" />
                              <span className="text-xs font-medium text-secondary-600 text-center px-2">
                                {formatFileType(type)}
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => handleFileUpload(e, type)}
                            disabled={uploadingFile}
                          />
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-secondary-500 mt-2">
                      JPG, PNG, PDF (Max 5MB)
                    </p>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="py-8 text-center">
                <p className="text-secondary-500">No profile information available.</p>
                <Button variant="secondary" className="mt-4" onClick={() => navigate(getEditUrl())}>
                  Complete Profile
                </Button>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {vendor && (
              <Card>
                <h3 className="font-semibold text-secondary-900 mb-4">Vendor Status</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-secondary-500">Status</p>
                    <Badge variant={getStatusVariant(vendor.status)} className="mt-1">
                      {vendor.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500">Vendor Type</p>
                    <p className="text-sm text-secondary-900 capitalize">{vendor.vendor_type}</p>
                  </div>
                  {vendor.verified_at && (
                    <div>
                      <p className="text-xs text-secondary-500">Verified At</p>
                      <p className="text-sm text-secondary-900">
                        {new Date(vendor.verified_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                  <div className="pt-4 border-t border-secondary-100">
                    <p className="text-xs text-secondary-500">Created At</p>
                    <p className="text-sm text-secondary-900">
                      {new Date(vendor.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        show={!!deleteFileId}
        title="Delete File"
        message="Are you sure you want to delete this file?"
        confirmText="Delete"
        variant="danger"
        isLoading={isDeletingFile}
        onConfirm={handleDeleteFileConfirm}
        onCancel={() => setDeleteFileId(null)}
      />
    </div>
  );
};
