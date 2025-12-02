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
  Search,
  Plus,
  Eye,
  Trash2
} from 'lucide-react';
import { Button, Card, Badge, Spinner, Input, ConfirmModal, ActionMenu } from '../../components/ui';
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
    vendor_type: '',
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
  const [selectedFileType, setSelectedFileType] = useState<string>('ktp');
  const [customFileType, setCustomFileType] = useState('');

  // Delete file modal
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  // Delete vendor modal
  const [deleteVendorId, setDeleteVendorId] = useState<string | null>(null);
  const [isDeletingVendor, setIsDeletingVendor] = useState(false);

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
    if (currentPage > 1) {
      fetchVendorsList();
    }
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

  useEffect(() => {
    console.log('deleteVendorId changed:', deleteVendorId);
  }, [deleteVendorId]);

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
        setVendorList((response.data || []) as unknown as VendorWithProfile[]);
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
            vendor_type: vendorData?.vendor_type || '',
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

      // Check if status is true OR if we have valid data returned
      // This handles cases where backend might return data but status is missing/false
      // Also check for 'id' in case data is returned directly (response IS the data)
      const resAny = response as any;
      const isSuccess = response.status === true ||
        (response.data && (response.data.vendor || response.data.profile || resAny.data?.id)) ||
        resAny.id ||
        resAny.vendor_id;

      if (isSuccess) {
        // Update local state with returned data if available
        if (response.data) {
          const vData = response.data.vendor || (resAny.data?.id ? response.data : null);
          const pData = response.data.profile || (resAny.data?.id ? response.data : null);

          if (vData) setVendor(vData);
          if (pData) setProfile(pData);
        } else if (resAny.id) {
          // If response is the data itself
          setProfile(resAny);
        }

        // Always navigate back to profile view as requested
        toast.success('Profile saved successfully');
        navigate('/vendor/profile');
      } else {
        console.error('Save profile failed. Response:', response);
        toast.error(response.message || 'Failed to save profile');
      }
    } catch (error: any) {
      console.error('Save profile error:', error);
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Determine file type
    const fileType = selectedFileType === 'other'
      ? (customFileType.trim() || 'other')
      : selectedFileType;

    setUploadingFile(true);
    try {
      const response = await vendorsApi.uploadProfileFile(profile.id, file, fileType);
      if (response.status) {
        toast.success('File uploaded successfully');
        await fetchVendorProfile();
        // Reset custom type after successful upload
        if (selectedFileType === 'other') {
          setCustomFileType('');
        }
      } else {
        toast.error('Failed to upload file');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
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
    <div className="space-y-6">
      {/* Company Information */}
      <Card>
        <h4 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
          <Building size={20} className="text-primary-600" />
          Company Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
              Vendor Type <span className="text-danger-500">*</span>
            </label>
            <select
              value={formData.vendor_type}
              onChange={(e) => setFormData({ ...formData, vendor_type: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
              required
            >
              <option value="">Select Type</option>
              <option value="company">Company</option>
              <option value="individual">Individual</option>
            </select>
          </div>
          <Input
            label="Vendor/Company Name"
            value={formData.vendor_name}
            onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
            placeholder="Enter vendor or company name"
            leftIcon={<Building size={18} />}
            required
          />
          <Input
            label="Business Field"
            value={formData.business_field}
            onChange={(e) => setFormData({ ...formData, business_field: e.target.value })}
            placeholder="e.g., Catering, Event Management"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="vendor@example.com"
            leftIcon={<Mail size={18} />}
            required
          />
          <Input
            label="Phone (Mobile)"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="08123456789"
            leftIcon={<Phone size={18} />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input
            label="Telephone"
            value={formData.telephone}
            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            placeholder="021-12345678"
            leftIcon={<Phone size={18} />}
          />
          <Input
            label="Fax"
            value={formData.fax}
            onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
            placeholder="021-87654321"
          />
        </div>
      </Card>

      {/* Address */}
      <Card>
        <h4 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
          <MapPin size={20} className="text-primary-600" />
          Address
        </h4>
        <Input
          label="Full Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Enter complete address"
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
              className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
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
              className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none disabled:bg-secondary-50 disabled:cursor-not-allowed transition-all"
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
              className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none disabled:bg-secondary-50 disabled:cursor-not-allowed transition-all"
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
      </Card>

      {/* Legal Information */}
      <Card>
        <h4 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-primary-600" />
          Legal Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="KTP Number"
            value={formData.ktp_number}
            onChange={(e) => setFormData({ ...formData, ktp_number: e.target.value })}
            placeholder="16 digit KTP number"
            leftIcon={<CreditCard size={18} />}
          />
          <Input
            label="KTP Name"
            value={formData.ktp_name}
            onChange={(e) => setFormData({ ...formData, ktp_name: e.target.value })}
            placeholder="Full name as on KTP"
            leftIcon={<User size={18} />}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input
            label="NPWP Number"
            value={formData.npwp_number}
            onChange={(e) => setFormData({ ...formData, npwp_number: e.target.value })}
            placeholder="15 digit NPWP number"
          />
          <Input
            label="NPWP Name"
            value={formData.npwp_name}
            onChange={(e) => setFormData({ ...formData, npwp_name: e.target.value })}
            placeholder="Full name as on NPWP"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Input
            label="NPWP Address"
            value={formData.npwp_address}
            onChange={(e) => setFormData({ ...formData, npwp_address: e.target.value })}
            placeholder="Enter NPWP address"
          />
          <Input
            label="Tax Status"
            value={formData.tax_status}
            onChange={(e) => setFormData({ ...formData, tax_status: e.target.value })}
            placeholder="e.g., PKP, Non-PKP"
          />
          <Input
            label="NIB Number"
            value={formData.nib_number}
            onChange={(e) => setFormData({ ...formData, nib_number: e.target.value })}
            placeholder="e.g. 1234567890123"
            leftIcon={<FileText size={18} />}
          />
        </div>
      </Card>

      {/* Bank Account */}
      <Card>
        <h4 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
          <CreditCard size={20} className="text-primary-600" />
          Bank Account
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Bank Name"
            value={formData.bank_name}
            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
            placeholder="e.g., BCA, Mandiri"
          />
          <Input
            label="Bank Branch"
            value={formData.bank_branch}
            onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
            placeholder="e.g., Jakarta Pusat"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input
            label="Account Number"
            value={formData.account_number}
            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
            placeholder="Bank account number"
          />
          <Input
            label="Account Holder Name"
            value={formData.account_holder_name}
            onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
            placeholder="Account holder name"
          />
        </div>
      </Card>

      {/* Business Information */}
      <Card>
        <h4 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
          <Building size={20} className="text-primary-600" />
          Business Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Transaction Type"
            value={formData.transaction_type}
            onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
            placeholder="e.g., B2B, B2C"
          />
          <Input
            label="Purch Group"
            value={formData.purch_group}
            onChange={(e) => setFormData({ ...formData, purch_group: e.target.value })}
            placeholder="Purchase group code"
          />
          <Input
            label="Region/SO"
            value={formData.region_or_so}
            onChange={(e) => setFormData({ ...formData, region_or_so: e.target.value })}
            placeholder="Region or sales office"
          />
        </div>
      </Card>

      {/* Contact Person */}
      <Card>
        <h4 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
          <User size={20} className="text-primary-600" />
          Contact Person
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Contact Person Name"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            placeholder="Contact person name"
          />
          <Input
            label="Contact Email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            placeholder="contact@example.com"
          />
          <Input
            label="Contact Phone"
            value={formData.contact_phone}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            placeholder="08123456789"
          />
        </div>
      </Card>
    </div>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Vendor Profiles</h1>
            <p className="text-secondary-500 text-sm mt-1">Manage and view all registered vendors</p>
          </div>
          {user?.role === 'superadmin' && (
            <Button
              onClick={() => navigate('/vendor/profile/new')}
              leftIcon={<Plus size={20} />}
            >
              Add Vendor
            </Button>
          )}
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
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
              />
            </div>
            <Button onClick={handleSearch}>
              <Search size={16} className="mr-2" />
              Search
            </Button>
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
                      {user?.role === 'superadmin' && (
                        <th className="text-right py-2.5 px-4 font-medium text-secondary-600">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {vendorList.map((item, index) => (
                      <tr
                        key={item?.vendor?.id || index}
                        className="hover:bg-secondary-50"
                      >
                        <td
                          className="py-2.5 px-4 cursor-pointer"
                          onClick={() => navigate(`/vendor/profile/${item?.vendor?.id}/detail`)}
                        >
                          <p className="font-medium text-secondary-900">{item?.profile?.vendor_name || '-'}</p>
                          <p className="text-xs text-secondary-500">{item?.profile?.city_name || '-'}, {item?.profile?.province_name || '-'}</p>
                        </td>
                        <td
                          className="py-2.5 px-4 text-secondary-700 cursor-pointer"
                          onClick={() => navigate(`/vendor/profile/${item?.vendor?.id}/detail`)}
                        >{item?.profile?.email || '-'}</td>
                        <td
                          className="py-2.5 px-4 text-secondary-700 cursor-pointer"
                          onClick={() => navigate(`/vendor/profile/${item?.vendor?.id}/detail`)}
                        >{item?.profile?.phone || '-'}</td>
                        <td
                          className="py-2.5 px-4 text-secondary-700 capitalize cursor-pointer"
                          onClick={() => navigate(`/vendor/profile/${item?.vendor?.id}/detail`)}
                        >{item?.vendor?.vendor_type || '-'}</td>
                        <td
                          className="py-2.5 px-4 cursor-pointer"
                          onClick={() => navigate(`/vendor/profile/${item?.vendor?.id}/detail`)}
                        >
                          <Badge variant={getStatusVariant(item?.vendor?.status || '')}>{item?.vendor?.status || 'pending'}</Badge>
                        </td>
                        {user?.role === 'superadmin' && (
                          <td className="py-2.5 px-4 text-right">
                            <ActionMenu
                              items={[
                                {
                                  label: 'View',
                                  icon: <Eye size={14} />,
                                  onClick: () => navigate(`/vendor/profile/${item?.vendor?.id}/detail`),
                                },
                                {
                                  label: 'Delete',
                                  icon: <Trash2 size={14} />,
                                  onClick: () => setDeleteVendorId(item?.vendor?.id || ''),
                                  variant: 'danger',
                                },
                              ]}
                            />
                          </td>
                        )}
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
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-bold text-secondary-900">Edit Profile</h3>
              <p className="text-secondary-500 text-sm mt-1">Update vendor information and documents</p>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => navigate(getBackUrl())}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSaving} leftIcon={<Save size={16} />} onClick={handleSubmit}>
                Save Changes
              </Button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderFormFields()}
            {/* Document Upload Section */}
            <Card>
              <h4 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-primary-600" />
                Document Uploads
              </h4>
              {/* Existing Files */}
              {profile && profile.files && profile.files.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm text-secondary-500 mb-3">Uploaded Documents</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {profile.files.map((file) => (
                      <div
                        key={file.id}
                        className={`flex flex-col p-3 border rounded-lg ${file.status === 'rejected'
                          ? 'border-danger-300 bg-danger-50'
                          : file.status === 'approved'
                            ? 'border-success-300 bg-success-50'
                            : 'border-secondary-200 bg-secondary-50'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className={`flex-shrink-0 ${file.status === 'rejected' ? 'text-danger-500' :
                              file.status === 'approved' ? 'text-success-500' : 'text-primary-600'
                              }`} size={20} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-secondary-900 capitalize truncate">
                                {formatFileType(file.file_type)}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs capitalize ${file.status === 'rejected' ? 'text-danger-600' :
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
                            type="button"
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

              {/* Upload Section */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                {/* File Type Dropdown */}
                <div className="flex-1">
                  <select
                    value={selectedFileType}
                    onChange={(e) => setSelectedFileType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="ktp">KTP</option>
                    <option value="npwp">NPWP</option>
                    <option value="bank_book">Bank Book</option>
                    <option value="nib">NIB</option>
                    <option value="siup">SIUP</option>
                    <option value="akta">Akta</option>
                    <option value="sppkp">SPPKP</option>
                    <option value="tdp">TDP</option>
                    <option value="skdp">SKDP</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Custom Type Input (shown when "other" is selected) */}
                {selectedFileType === 'other' && (
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={customFileType}
                      onChange={(e) => setCustomFileType(e.target.value)}
                      placeholder="Enter custom document type..."
                    />
                  </div>
                )}

                {/* Upload Button */}
                <label className={`cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 font-medium rounded-lg transition-colors ${uploadingFile
                  ? 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }`}>
                  {uploadingFile ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <Upload size={16} />
                      Select File
                    </>
                  )}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingFile}
                  />
                </label>
              </div>
              <p className="text-xs text-secondary-500">
                Accepted formats: JPG, PNG, PDF (Max 5MB per file)
              </p>
            </Card>

            <div className="flex gap-3 pt-4">
              <Button type="submit" isLoading={isSaving} leftIcon={<Save size={16} />} className="w-full sm:w-auto">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {profile ? (
              <>
                {/* Business Information */}
                <Card className="overflow-hidden">
                  <div className="bg-secondary-50 px-4 py-3 border-b border-secondary-200">
                    <h3 className="font-semibold text-secondary-900 flex items-center gap-2">
                      <Building size={18} className="text-primary-600" />
                      Business Information
                    </h3>
                  </div>
                  <div className="divide-y divide-secondary-100">
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">Vendor Name</span>
                      <span className="text-secondary-900 font-medium text-sm">{profile.vendor_name || '-'}</span>
                    </div>
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">Business Field</span>
                      <span className="text-secondary-900 text-sm">{profile.business_field || '-'}</span>
                    </div>
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">Email</span>
                      <span className="text-secondary-900 text-sm">{profile.email || '-'}</span>
                    </div>
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">Phone</span>
                      <span className="text-secondary-900 text-sm">{profile.phone || '-'}</span>
                    </div>
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">Telephone</span>
                      <span className="text-secondary-900 text-sm">{profile.telephone || '-'}</span>
                    </div>
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">Fax</span>
                      <span className="text-secondary-900 text-sm">{profile.fax || '-'}</span>
                    </div>
                  </div>
                </Card>

                {/* Location */}
                <Card className="overflow-hidden">
                  <div className="bg-secondary-50 px-4 py-3 border-b border-secondary-200">
                    <h3 className="font-semibold text-secondary-900 flex items-center gap-2">
                      <MapPin size={18} className="text-primary-600" />
                      Location
                    </h3>
                  </div>
                  <div className="divide-y divide-secondary-100">
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">Address</span>
                      <span className="text-secondary-900 text-sm">{profile.address || '-'}</span>
                    </div>
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">Province</span>
                      <span className="text-secondary-900 text-sm">{profile.province_name || '-'}</span>
                    </div>
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">City</span>
                      <span className="text-secondary-900 text-sm">{profile.city_name || '-'}</span>
                    </div>
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">District</span>
                      <span className="text-secondary-900 text-sm">{profile.district_name || '-'}</span>
                    </div>
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">Postal Code</span>
                      <span className="text-secondary-900 text-sm">{profile.postal_code || '-'}</span>
                    </div>
                  </div>
                </Card>

                {/* Legal Information */}
                <Card className="overflow-hidden">
                  <div className="bg-secondary-50 px-4 py-3 border-b border-secondary-200">
                    <h3 className="font-semibold text-secondary-900 flex items-center gap-2">
                      <FileText size={18} className="text-primary-600" />
                      Legal Information
                    </h3>
                  </div>
                  <div className="divide-y divide-secondary-100">
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">KTP Number</span>
                      <span className="text-secondary-900 font-mono text-sm">{profile.ktp_number || '-'}</span>
                    </div>
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">KTP Name</span>
                      <span className="text-secondary-900 text-sm">{profile.ktp_name || '-'}</span>
                    </div>
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">NPWP Number</span>
                      <span className="text-secondary-900 font-mono text-sm">{profile.npwp_number || '-'}</span>
                    </div>
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">NPWP Name</span>
                      <span className="text-secondary-900 text-sm">{profile.npwp_name || '-'}</span>
                    </div>
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">NPWP Address</span>
                      <span className="text-secondary-900 text-sm">{profile.npwp_address || '-'}</span>
                    </div>
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">Tax Status</span>
                      <span className="text-secondary-900 text-sm">{profile.tax_status || '-'}</span>
                    </div>
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">NIB Number</span>
                      <span className="text-secondary-900 font-mono text-sm">{profile.nib_number || '-'}</span>
                    </div>
                  </div>
                </Card>

                {/* Bank Account */}
                <Card className="overflow-hidden">
                  <div className="bg-secondary-50 px-4 py-3 border-b border-secondary-200">
                    <h3 className="font-semibold text-secondary-900 flex items-center gap-2">
                      <CreditCard size={18} className="text-primary-600" />
                      Bank Account
                    </h3>
                  </div>
                  <div className="divide-y divide-secondary-100">
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">Bank Name</span>
                      <span className="text-secondary-900 text-sm">{profile.bank_name || '-'}</span>
                    </div>
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">Branch</span>
                      <span className="text-secondary-900 text-sm">{profile.bank_branch || '-'}</span>
                    </div>
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">Account Number</span>
                      <span className="text-secondary-900 font-mono text-sm">{profile.account_number || '-'}</span>
                    </div>
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">Account Holder</span>
                      <span className="text-secondary-900 text-sm">{profile.account_holder_name || '-'}</span>
                    </div>
                  </div>
                </Card>

                {/* Contact Person */}
                <Card className="overflow-hidden">
                  <div className="bg-secondary-50 px-4 py-3 border-b border-secondary-200">
                    <h3 className="font-semibold text-secondary-900 flex items-center gap-2">
                      <User size={18} className="text-primary-600" />
                      Contact Person
                    </h3>
                  </div>
                  <div className="divide-y divide-secondary-100">
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">Name</span>
                      <span className="text-secondary-900 text-sm">{profile.contact_person || '-'}</span>
                    </div>
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">Email</span>
                      <span className="text-secondary-900 text-sm">{profile.contact_email || '-'}</span>
                    </div>
                    <div className="flex py-2.5 px-4">
                      <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">Phone</span>
                      <span className="text-secondary-900 text-sm">{profile.contact_phone || '-'}</span>
                    </div>
                  </div>
                </Card>

                {/* Documents */}
                <Card className="overflow-hidden">
                  <div className="bg-secondary-50 px-4 py-3 border-b border-secondary-200">
                    <h3 className="font-semibold text-secondary-900 flex items-center gap-2">
                      <FileText size={18} className="text-primary-600" />
                      Documents
                    </h3>
                  </div>
                  {profile.files && profile.files.length > 0 ? (
                    <div className="divide-y divide-secondary-100">
                      {profile.files.map((file) => (
                        <a
                          key={file.id}
                          href={file.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between py-2.5 px-4 hover:bg-secondary-50"
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={18} className={`flex-shrink-0 ${file.status === 'rejected' ? 'text-danger-500' :
                              file.status === 'approved' ? 'text-success-500' : 'text-secondary-400'
                              }`} />
                            <span className="text-sm font-medium text-secondary-900">{formatFileType(file.file_type)}</span>
                            <span className={`text-xs capitalize ${file.status === 'rejected' ? 'text-danger-600' :
                              file.status === 'approved' ? 'text-success-600' : 'text-warning-600'
                              }`}>({file.status})</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-secondary-500 text-sm py-4 px-4">No documents uploaded yet</p>
                  )}
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
