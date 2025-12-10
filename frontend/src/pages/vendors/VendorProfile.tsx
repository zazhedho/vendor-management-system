import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { vendorsApi } from '../../api/vendors';
import { useAuth } from '../../context/AuthContext';
import { Vendor, VendorProfile as VendorProfileType } from '../../types';
import {
  ShoppingBag,
  MapPin,
  Building,
  FileText,
  CreditCard,
  X,
  ArrowLeft,
  Download,
  Edit
} from 'lucide-react';
import { Button, Card, Badge, Spinner, Input, ConfirmModal, EmptyState } from '../../components/ui';
import { toast } from 'react-toastify';

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
    tdp: 'TDP',
    skdp: 'SKDP',
    domisili: 'Izin Domisili',
    skt: 'SKT',
    rekening: 'Rekening',
  };
  return upperCaseTypes[type.toLowerCase()] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const VendorProfile: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, hasPermission, isLoading: authLoading } = useAuth();

  // Determine view mode based on permissions and ownership
  const isVendorRole = useMemo(() => user?.role === 'vendor', [user?.role]);
  const canViewVendors = useMemo(() => hasPermission('vendor', 'view'), [hasPermission]);
  const canUpdateVendor = useMemo(() => hasPermission('vendor', 'update'), [hasPermission]);
  const canUpdateStatus = useMemo(() => hasPermission('vendor', 'update_status'), [hasPermission]);
  const canDeleteVendor = useMemo(() => hasPermission('vendor', 'delete'), [hasPermission]);

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [profile, setProfile] = useState<VendorProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [showFileStatusModal, setShowFileStatusModal] = useState(false);
  const [isUpdatingFileStatus, setIsUpdatingFileStatus] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const canExport = useMemo(() => canViewVendors, [canViewVendors]);
  const activeVendorId = useMemo(() => id || vendor?.id || '', [id, vendor?.id]);
  const canVerifyDocs = useMemo(() => hasPermission('vendor', 'update_status'), [hasPermission]);

  // Delete file modal
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  // Delete vendor modal
  const [deleteVendorId, setDeleteVendorId] = useState<string | null>(null);
  const [isDeletingVendor, setIsDeletingVendor] = useState(false);

  // Vendor code modal
  const [showVendorCodeModal, setShowVendorCodeModal] = useState(false);
  const [vendorCodeInput, setVendorCodeInput] = useState('');
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [fileStatusModal, setFileStatusModal] = useState<{ fileId: string; status: 'approved' | 'rejected'; reason: string }>({
    fileId: '',
    status: 'approved',
    reason: '',
  });


  useEffect(() => {
    if (!user || authLoading) return;

    const loadData = async () => {
      // Vendor viewing own profile OR admin viewing/editing specific vendor
      await fetchVendorProfile(id);
    };
    loadData();
  }, [user, authLoading, id]);

  const extractFilename = (contentDisposition?: string | null) => {
    if (!contentDisposition) return '';
    // Try RFC 5987 encoding first (filename*)
    const starMatch = contentDisposition.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
    if (starMatch && starMatch[1]) {
      try {
        return decodeURIComponent(starMatch[1].trim().replace(/(^\"|\"$)/g, ''));
      } catch {
        return starMatch[1].trim().replace(/(^\"|\"$)/g, '');
      }
    }
    const match = contentDisposition.match(/filename=\"?([^\";]+)\"?/i);
    if (match && match[1]) return match[1].trim();
    return '';
  };

  const ensureXlsxExtension = (name: string) => {
    if (!name) return 'vendor_profile.xlsx';
    return name.toLowerCase().endsWith('.xlsx') ? name : `${name}.xlsx`;
  };

  const handleExport = async () => {
    if (!activeVendorId || !canExport) return;
    setIsExporting(true);
    try {
      const response = await vendorsApi.exportProfile(activeVendorId);
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
    } finally {
      setIsExporting(false);
    }
  };


  const fetchVendorProfile = async (vendorId?: string) => {
    setIsLoading(true);
    try {
      let response;
      if (isVendorRole || !vendorId) {
        response = await vendorsApi.getMyVendorProfile();
      } else {
        response = await vendorsApi.getById(vendorId);
      }

      if (response.status && response.data) {
        const data = response.data;
        // Handle both direct response and nested data structure
        const vendorData = (data as any).vendor || data;
        const profileData = (data as any).profile || null;

        setVendor(vendorData?.id ? vendorData : null);
        setProfile(profileData);
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

  const handleFileStatusChange = (fileId: string, status: 'approved' | 'rejected') => {
    if (!canVerifyDocs) return;
    if (status === 'approved') {
      return handleFileStatusConfirm(fileId, status, '');
    }
    setFileStatusModal({ fileId, status, reason: '' });
    setShowFileStatusModal(true);
  };

  const handleFileStatusConfirm = async (fileId: string, status: 'approved' | 'rejected', reason?: string) => {
    setIsUpdatingFileStatus(true);
    try {
      const response = await vendorsApi.updateFileStatus(fileId, status, reason);
      if (response.status) {
        toast.success(`File ${status === 'approved' ? 'approved' : 'rejected'}`);
        await fetchVendorProfile(id);
      } else {
        toast.error('Failed to update file status');
      }
    } catch (error: any) {
      console.error('Failed to update file status:', error);
      toast.error(error?.response?.data?.message || 'Failed to update file status');
    } finally {
      setIsUpdatingFileStatus(false);
      setShowFileStatusModal(false);
      setFileStatusModal({ fileId: '', status: 'approved', reason: '' });
    }
  };

  const handleFileStatusModalConfirm = () => {
    if (!fileStatusModal.fileId) return;
    if (fileStatusModal.status === 'rejected' && !fileStatusModal.reason.trim()) {
      toast.error('Alasan penolakan dokumen wajib diisi');
      return;
    }
    handleFileStatusConfirm(fileStatusModal.fileId, fileStatusModal.status, fileStatusModal.reason.trim());
  };

  const handleFileStatusModalCancel = () => {
    setShowFileStatusModal(false);
    setFileStatusModal({ fileId: '', status: 'approved', reason: '' });
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!vendor || !canUpdateStatus) return;
    setPendingStatus(null);

    if (newStatus === 'active') {
      const hasUnapprovedDocs = !profile?.files?.length || profile.files.some((file) => file.status !== 'approved');
      if (hasUnapprovedDocs) {
        toast.error('Setujui/approve semua dokumen terlebih dahulu sebelum mengaktifkan vendor');
        return;
      }

      setPendingStatus(newStatus);
      setVendorCodeInput(vendor.vendor_code || '');
      setShowVendorCodeModal(true);
      return;
    }

    if (newStatus === 'rejected') {
      setPendingStatus(newStatus);
      setRejectReasonInput(vendor.reject_reason || '');
      setShowRejectReasonModal(true);
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const response = await vendorsApi.updateStatus(vendor.id, newStatus);
      if (response.status && response.data) {
        setVendor({
          ...vendor,
          status: response.data.status || newStatus,
          vendor_code: response.data.vendor_code || vendor.vendor_code,
          reject_reason: response.data.reject_reason,
        });
      } else {
        setVendor({ ...vendor, status: newStatus, reject_reason: undefined });
      }
      toast.success(`Vendor status updated to ${newStatus}`);
    } catch (error: any) {
      console.error('Failed to update vendor status:', error);
      toast.error(error?.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteVendorConfirm = async () => {
    if (!deleteVendorId) return;
    setIsDeletingVendor(true);
    try {
      const response = await vendorsApi.delete(deleteVendorId);
      if (response.status) {
        toast.success('Vendor deleted successfully');
        navigate('/vendor/profile');
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

  const handleVendorCodeConfirm = async () => {
    if (!vendor || !pendingStatus) return;
    if (!vendorCodeInput.trim()) {
      toast.error('Vendor Code wajib diisi untuk mengaktifkan vendor');
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const response = await vendorsApi.updateStatus(vendor.id, pendingStatus, vendorCodeInput.trim());
      if (response.status && response.data) {
        setVendor({ ...vendor, status: response.data.status || pendingStatus, vendor_code: response.data.vendor_code || vendorCodeInput.trim() });
      } else {
        setVendor({ ...vendor, status: pendingStatus, vendor_code: vendorCodeInput.trim() });
      }
      toast.success(`Vendor status updated to ${pendingStatus}`);
    } catch (error: any) {
      console.error('Failed to update vendor status:', error);
      toast.error(error?.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
      setShowVendorCodeModal(false);
      setPendingStatus(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!vendor || !pendingStatus) return;
    if (!rejectReasonInput.trim()) {
      toast.error('Reject reason wajib diisi');
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const response = await vendorsApi.updateStatus(vendor.id, pendingStatus, undefined, rejectReasonInput.trim());
      if (response.status && response.data) {
        setVendor({
          ...vendor,
          status: response.data.status || pendingStatus,
          reject_reason: response.data.reject_reason || rejectReasonInput.trim(),
        });
      } else {
        setVendor({ ...vendor, status: pendingStatus, reject_reason: rejectReasonInput.trim() });
      }
      toast.success(`Vendor status updated to ${pendingStatus}`);
    } catch (error: any) {
      console.error('Failed to update vendor status:', error);
      toast.error(error?.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
      setShowRejectReasonModal(false);
      setPendingStatus(null);
    }
  };

  const handleRejectCancel = () => {
    setShowRejectReasonModal(false);
    setPendingStatus(null);
    setRejectReasonInput('');
  };


  const handleVendorCodeCancel = () => {
    setShowVendorCodeModal(false);
    setPendingStatus(null);
  };

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'verify': return 'info';
      case 'suspended': return 'danger';
      case 'rejected': return 'danger';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  if (authLoading || !user || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const vendorStatuses = ['pending', 'verify', 'active', 'suspended', 'rejected'];

  const handleBack = () => navigate('/vendor/profile');

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {id && (
            <Button variant="ghost" size="sm" onClick={handleBack} leftIcon={<ArrowLeft size={16} />}>
              Back
            </Button>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Vendor Profile</h1>
        </div>
        <div className="flex items-center gap-3">
          {canExport && activeVendorId && (
            <Button
              variant="secondary"
              onClick={handleExport}
              isLoading={isExporting}
              leftIcon={<Download size={16} />}
            >
              Export
            </Button>
          )}
          {canUpdateVendor && activeVendorId && (
            <Button
              onClick={() => {
                if (isVendorRole) {
                  navigate('/vendor/profile/edit');
                } else {
                  navigate(`/vendors/${activeVendorId}/edit`);
                }
              }}
              leftIcon={<Edit size={16} />}
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Header Card */}
      <Card className="bg-gradient-to-r from-secondary-900 to-secondary-800 text-white border-none p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <ShoppingBag className="text-white" size={40} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {profile?.vendor_name || 'My Vendor Profile'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {vendor && (
                <>
                  <Badge
                    variant={getStatusVariant(vendor.status)}
                    className="bg-white/90 text-secondary-900 border border-white/60 font-semibold capitalize"
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

      {/* Detail View */}
      {!profile ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Vendor Profile Yet"
          description={
            isVendorRole
              ? 'You haven\'t created your vendor profile yet. Complete your profile to get started.'
              : 'This vendor has not created a profile yet.'
          }
          actionLabel={canUpdateVendor && isVendorRole ? 'Create Vendor Profile' : undefined}
          onAction={canUpdateVendor && isVendorRole ? () => navigate('/vendor/profile/new') : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {profile && (
              <>
                {/* Business Information */}
                <Card className="overflow-hidden">
                  <div className="bg-secondary-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-secondary-200">
                    <h3 className="font-semibold text-base sm:text-lg text-secondary-900 flex items-center gap-2">
                      <Building size={18} className="text-primary-600" />
                      Business Information
                    </h3>
                  </div>
                  <div className="divide-y divide-secondary-100">
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">Vendor Name</span>
                      <span className="text-secondary-900 font-medium text-sm">{profile.vendor_name || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">Business Field</span>
                      <span className="text-secondary-900 text-sm">{profile.business_field || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">Transaction Type</span>
                      <span className="text-secondary-900 text-sm">{profile.transaction_type || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">Purch Group</span>
                      <span className="text-secondary-900 text-sm">{profile.purch_group || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">Region/SO</span>
                      <span className="text-secondary-900 text-sm">{profile.region_or_so || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">Email</span>
                      <span className="text-secondary-900 text-sm">{profile.email || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">Phone</span>
                      <span className="text-secondary-900 text-sm">{profile.phone || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">Telephone</span>
                      <span className="text-secondary-900 text-sm">{profile.telephone || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">Fax</span>
                      <span className="text-secondary-900 text-sm">{profile.fax || '-'}</span>
                    </div>
                  </div>
                </Card>

                {/* Location */}
                <Card className="overflow-hidden">
                  <div className="bg-secondary-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-secondary-200">
                    <h3 className="font-semibold text-base sm:text-lg text-secondary-900 flex items-center gap-2">
                      <MapPin size={18} className="text-primary-600" />
                      Location
                    </h3>
                  </div>
                  <div className="divide-y divide-secondary-100">
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">Address</span>
                      <span className="text-secondary-900 text-sm">{profile.address || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">Province</span>
                      <span className="text-secondary-900 text-sm">{profile.province_name || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">City</span>
                      <span className="text-secondary-900 text-sm">{profile.city_name || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">District</span>
                      <span className="text-secondary-900 text-sm">{profile.district_name || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">Postal Code</span>
                      <span className="text-secondary-900 text-sm">{profile.postal_code || '-'}</span>
                    </div>
                  </div>
                </Card>

                {/* Legal Information */}
                <Card className="overflow-hidden">
                  <div className="bg-secondary-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-secondary-200">
                    <h3 className="font-semibold text-base sm:text-lg text-secondary-900 flex items-center gap-2">
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
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">NPWP Number</span>
                      <span className="text-secondary-900 font-mono text-sm">{profile.npwp_number || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">NPWP Name</span>
                      <span className="text-secondary-900 text-sm">{profile.npwp_name || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">NPWP Address</span>
                      <span className="text-secondary-900 text-sm">{profile.npwp_address || '-'}</span>
                    </div>
                <div className="flex py-2.5 px-4">
                  <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">Tax Status</span>
                  <span className="text-secondary-900 text-sm">{profile.tax_status || '-'}</span>
                </div>
                {vendor?.vendor_type === 'company' && (
                  <div className="flex py-2.5 px-4">
                    <span className="text-secondary-500 w-40 flex-shrink-0 text-sm">NIB Number</span>
                    <span className="text-secondary-900 font-mono text-sm">{profile.nib_number || '-'}</span>
                  </div>
                )}
              </div>
            </Card>

                {/* Bank Account */}
                <Card className="overflow-hidden">
                  <div className="bg-secondary-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-secondary-200">
                    <h3 className="font-semibold text-base sm:text-lg text-secondary-900 flex items-center gap-2">
                      <CreditCard size={18} className="text-primary-600" />
                      Bank Account
                    </h3>
                  </div>
                  <div className="divide-y divide-secondary-100">
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">Bank Name</span>
                      <span className="text-secondary-900 text-sm">{profile.bank_name || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">Branch</span>
                      <span className="text-secondary-900 text-sm">{profile.bank_branch || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">Account Number</span>
                      <span className="text-secondary-900 font-mono text-sm">{profile.account_number || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-3 px-4 sm:px-6 gap-1 sm:gap-4">
                      <span className="text-secondary-500 sm:w-48 flex-shrink-0 text-sm font-medium">Account Holder</span>
                      <span className="text-secondary-900 text-sm">{profile.account_holder_name || '-'}</span>
                    </div>
                  </div>
                </Card>

                {/* Documents */}
                <Card className="overflow-hidden">
                  <div className="bg-secondary-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-secondary-200">
                    <h3 className="font-semibold text-base sm:text-lg text-secondary-900 flex items-center gap-2">
                      <FileText size={18} className="text-primary-600" />
                      Documents
                    </h3>
                  </div>
                  {profile.files && profile.files.length > 0 ? (
                    <div className="divide-y divide-secondary-100">
                      {profile.files.map((file) => (
                        <div key={file.id} className="py-2.5 px-4 hover:bg-secondary-50">
                          <div className="flex items-start justify-between gap-3">
                            <a
                              href={file.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-3 flex-1 min-w-0"
                            >
                              <FileText size={18} className={`flex-shrink-0 ${file.status === 'rejected' ? 'text-danger-500' :
                                file.status === 'approved' ? 'text-success-500' : 'text-secondary-400'
                                }`} />
                              <span className="text-sm font-medium text-secondary-900 truncate">{formatFileType(file.file_type)}</span>
                              <span className={`text-xs capitalize ${file.status === 'rejected' ? 'text-danger-600' :
                                file.status === 'approved' ? 'text-success-600' : 'text-warning-600'
                                }`}>({file.status})</span>
                            </a>
                            {canVerifyDocs && file.status === 'pending' && (
                              <div className="flex gap-2 flex-shrink-0">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleFileStatusChange(file.id, 'approved')}
                                  disabled={isUpdatingFileStatus}
                                >
                                  Approve
                                </Button>
                                <Button
                                  type="button"
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleFileStatusChange(file.id, 'rejected')}
                                  disabled={isUpdatingFileStatus}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                          {file.status === 'rejected' && file.reject_reason && (
                            <div className="mt-2 pt-2 border-t border-danger-200 bg-danger-50 rounded-md px-3 py-2">
                              <p className="text-xs text-secondary-900 font-semibold">Rejection Reason</p>
                              <p className="text-xs text-danger-800 mt-1 whitespace-pre-line">
                                {file.reject_reason}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-secondary-500 text-sm py-4 px-4">No documents uploaded yet</p>
                  )}
                </Card>
              </>
            )}
          </div>

          <div className="space-y-6">
            {vendor && (
              <Card className="p-6">
                <h3 className="font-semibold text-lg text-secondary-900 mb-4">Vendor Status</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-secondary-500">Status</p>
                    <Badge
                      variant={getStatusVariant(vendor.status)}
                      className="mt-1 capitalize font-semibold px-3 py-1"
                    >
                      {vendor.status}
                    </Badge>
                  </div>
                  {vendor.status === 'rejected' && vendor.reject_reason && (
                    <div className="p-3 rounded-lg border border-danger-200 bg-danger-50">
                      <p className="text-xs text-danger-700 font-semibold">Reject Reason</p>
                      <p className="text-sm text-danger-800 mt-1 whitespace-pre-line">{vendor.reject_reason}</p>
                    </div>
                  )}
                  {vendor.vendor_code && (
                    <div>
                      <p className="text-xs text-secondary-500">Vendor Code</p>
                      <p className="text-sm font-semibold text-secondary-900">{vendor.vendor_code}</p>
                    </div>
                  )}
                  {canUpdateStatus && (
                    <div className="space-y-2">
                      <p className="text-xs text-secondary-500">Update Status</p>
                      <select
                        value={vendor.status}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        disabled={isUpdatingStatus}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none capitalize disabled:opacity-50"
                      >
                        {vendorStatuses.map((status) => (
                          <option key={status} value={status} className="capitalize">{status}</option>
                        ))}
                      </select>
                      {isUpdatingStatus && (
                        <p className="text-xs text-secondary-500 flex items-center gap-1">
                          <Spinner size="sm" /> Updating...
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-secondary-500">Vendor Type</p>
                    <p className="text-sm text-secondary-900 capitalize">{vendor.vendor_type}</p>
                  </div>
                  {canDeleteVendor && (
                    <Button
                      variant="danger"
                      size="sm"
                      className="w-full"
                      onClick={() => setDeleteVendorId(vendor.id)}
                    >
                      Delete Vendor
                    </Button>
                  )}
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

      {showVendorCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={handleVendorCodeCancel} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900">Set Vendor Code</h3>
                  <p className="text-sm text-secondary-600 mt-1">
                    Vendor Code wajib diisi sebelum mengaktifkan vendor.
                  </p>
                </div>
                <button
                  className="text-secondary-400 hover:text-secondary-600"
                  onClick={handleVendorCodeCancel}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-700">Vendor Code</label>
                <Input
                  value={vendorCodeInput}
                  onChange={(e) => setVendorCodeInput(e.target.value)}
                  placeholder="Masukkan Vendor Code"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={handleVendorCodeCancel} disabled={isUpdatingStatus}>
                  Batal
                </Button>
                <Button variant="primary" onClick={handleVendorCodeConfirm} isLoading={isUpdatingStatus}>
                  Simpan & Aktifkan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={handleRejectCancel} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900">Reject Vendor</h3>
                  <p className="text-sm text-secondary-600 mt-1">
                    Beri alasan penolakan sebelum mengubah status ke rejected.
                  </p>
                </div>
                <button
                  className="text-secondary-400 hover:text-secondary-600"
                  onClick={handleRejectCancel}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-700">Reject Reason</label>
                <textarea
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  placeholder="Tulis alasan penolakan"
                  className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={handleRejectCancel} disabled={isUpdatingStatus}>
                  Batal
                </Button>
                <Button variant="primary" onClick={handleRejectConfirm} isLoading={isUpdatingStatus}>
                  Simpan & Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFileStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={handleFileStatusModalCancel} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900">
                    {fileStatusModal.status === 'approved' ? 'Approve Document' : 'Reject Document'}
                  </h3>
                  <p className="text-sm text-secondary-600 mt-1">
                    {fileStatusModal.status === 'approved'
                      ? 'Setujui dokumen vendor ini.'
                      : 'Berikan alasan penolakan dokumen ini.'}
                  </p>
                </div>
                <button
                  className="text-secondary-400 hover:text-secondary-600"
                  onClick={handleFileStatusModalCancel}
                >
                  <X size={18} />
                </button>
              </div>
              {fileStatusModal.status === 'rejected' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary-700">Reject Reason</label>
                  <textarea
                    value={fileStatusModal.reason}
                    onChange={(e) => setFileStatusModal({ ...fileStatusModal, reason: e.target.value })}
                    placeholder="Tulis alasan penolakan"
                    className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    rows={3}
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={handleFileStatusModalCancel} disabled={isUpdatingFileStatus}>
                  Batal
                </Button>
                <Button variant="primary" onClick={handleFileStatusModalConfirm} isLoading={isUpdatingFileStatus}>
                  {fileStatusModal.status === 'approved' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
