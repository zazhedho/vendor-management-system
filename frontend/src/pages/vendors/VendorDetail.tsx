import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { vendorsApi } from '../../api/vendors';
import { Vendor, VendorProfile, VendorProfileFile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, 
  Edit, 
  ShoppingBag, 
  MapPin, 
  Phone, 
  Mail, 
  Building, 
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Button, Card, Badge, Spinner } from '../../components/ui';
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

export const VendorDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const isVendor = hasRole('vendor');
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [updatingFileId, setUpdatingFileId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchVendorData(id);
  }, [id]);

  const fetchVendorData = async (vendorId: string) => {
    setIsLoading(true);
    try {
      const response = await vendorsApi.getById(vendorId);
      console.log('Vendor detail response:', response);
      if (response.status && response.data) {
        const data = response.data as any;
        
        // Check if response has vendor and profile nested
        if (data.vendor && data.profile) {
          setVendor(data.vendor);
          setProfile(data.profile);
        } else if (data.vendor_id) {
          // Response is profile data only, need to construct vendor
          setProfile(data);
          setVendor({
            id: data.vendor_id || vendorId,
            user_id: data.created_by || '',
            vendor_type: data.vendor_type || 'perusahaan',
            status: data.status || data.vendor_status || 'pending',
            created_at: data.created_at,
            created_by: data.created_by,
            updated_at: data.updated_at,
            updated_by: data.updated_by,
          });
        } else {
          // Response is vendor data directly
          setVendor(data);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch vendor:', error);
      toast.error('Failed to load vendor data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!vendor) return;
    setIsUpdatingStatus(true);
    try {
      const response = await vendorsApi.updateStatus(vendor.id, newStatus);
      if (response.status) {
        setVendor({ ...vendor, status: newStatus });
        toast.success(`Vendor status updated to ${newStatus}`);
      }
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast.error(error.response?.data?.message || 'Failed to update vendor status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleApproveFile = async (fileId: string) => {
    setUpdatingFileId(fileId);
    try {
      const response = await vendorsApi.updateFileStatus(fileId, 'approved');
      if (response.status) {
        // Update local state
        if (profile?.files) {
          const updatedFiles = profile.files.map(f => 
            f.id === fileId ? { ...f, status: 'approved' } : f
          );
          setProfile({ ...profile, files: updatedFiles });
        }
        toast.success('Document approved');
      }
    } catch (error: any) {
      console.error('Failed to approve file:', error);
      toast.error(error.response?.data?.message || 'Failed to approve document');
    } finally {
      setUpdatingFileId(null);
    }
  };

  const handleRejectFile = async (fileId: string) => {
    setUpdatingFileId(fileId);
    try {
      const response = await vendorsApi.updateFileStatus(fileId, 'rejected', rejectReason);
      if (response.status) {
        if (profile?.files) {
          const updatedFiles = profile.files.map(f => 
            f.id === fileId ? { ...f, status: 'rejected' } : f
          );
          setProfile({ ...profile, files: updatedFiles });
        }
        toast.success('Document rejected');
        setShowRejectModal(null);
        setRejectReason('');
      }
    } catch (error: any) {
      console.error('Failed to reject file:', error);
      toast.error(error.response?.data?.message || 'Failed to reject document');
    } finally {
      setUpdatingFileId(null);
    }
  };

  const getStatusVariant = (status?: string): 'success' | 'info' | 'danger' | 'warning' => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'verified': return 'info';
      case 'approved': return 'success';
      case 'suspended': return 'danger';
      case 'rejected': return 'danger';
      default: return 'warning';
    }
  };

  const getFileStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return <CheckCircle size={16} className="text-success-500" />;
      case 'rejected': return <XCircle size={16} className="text-danger-500" />;
      default: return <Clock size={16} className="text-warning-500" />;
    }
  };

  const vendorStatuses = ['pending', 'verified', 'active', 'suspended', 'rejected'];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <Card className="text-center py-12">
        <h3 className="text-lg font-medium text-secondary-900 mb-2">Vendor not found</h3>
        <Button onClick={() => navigate('/vendor/profile')}>Back to Vendors</Button>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/vendor/profile')} leftIcon={<ArrowLeft size={14} />}>
          Back
        </Button>
        {isVendor && (
          <Button size="sm" onClick={() => navigate(`/vendor/profile/${id}/edit`)} leftIcon={<Edit size={14} />}>
            Edit
          </Button>
        )}
      </div>

      {/* Main Info - Compact */}
      <Card className="bg-gradient-to-r from-secondary-900 to-secondary-800 text-white border-none p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
            <ShoppingBag className="text-white" size={24} />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{profile?.vendor_name || `Vendor #${vendor.id.slice(0, 8)}`}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getStatusVariant(vendor.status)} className="bg-white/20 text-white border-none text-xs">
                {vendor.status}
              </Badge>
              <span className="text-secondary-300 capitalize text-sm">{vendor.vendor_type}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {profile ? (
            <>
              <Card className="p-4">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-secondary-700">
                  <Building size={16} className="text-primary-600" />
                  Business Information
                </h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-secondary-500">Email</p>
                    <p className="text-secondary-900">{profile.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500">Phone</p>
                    <p className="text-secondary-900">{profile.phone || profile.telephone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500">Business Field</p>
                    <p className="text-secondary-900">{profile.business_field || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500">NPWP</p>
                    <p className="text-secondary-900 font-mono text-xs">{profile.npwp_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500">Tax Status</p>
                    <p className="text-secondary-900">{profile.tax_status || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500">KTP Name</p>
                    <p className="text-secondary-900">{profile.ktp_name || '-'}</p>
                  </div>
                </div>
              </Card>

              {(profile.address || profile.province_name) && (
                <Card className="p-4">
                  <h2 className="text-sm font-semibold mb-2 flex items-center gap-2 text-secondary-700">
                    <MapPin size={16} className="text-primary-600" />
                    Location
                  </h2>
                  <p className="text-sm text-secondary-900">{profile.address || '-'}</p>
                  <p className="text-xs text-secondary-500 mt-1">
                    {[profile.district_name, profile.city_name, profile.province_name].filter(Boolean).join(', ')}
                    {profile.postal_code && ` - ${profile.postal_code}`}
                  </p>
                </Card>
              )}

              {/* Bank & Contact - Combined */}
              {(profile.bank_name || profile.contact_person) && (
                <Card className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.bank_name && (
                      <div>
                        <h3 className="text-xs font-semibold text-secondary-500 mb-2">Bank Information</h3>
                        <p className="text-sm text-secondary-900">{profile.bank_name} - {profile.bank_branch || '-'}</p>
                        <p className="text-xs text-secondary-600 font-mono">{profile.account_number || '-'}</p>
                        <p className="text-xs text-secondary-500">{profile.account_holder_name || '-'}</p>
                      </div>
                    )}
                    {profile.contact_person && (
                      <div>
                        <h3 className="text-xs font-semibold text-secondary-500 mb-2">Contact Person</h3>
                        <p className="text-sm text-secondary-900">{profile.contact_person}</p>
                        <p className="text-xs text-secondary-600">{profile.contact_email || '-'}</p>
                        <p className="text-xs text-secondary-500">{profile.contact_phone || '-'}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Documents - Compact */}
              <Card className="p-4">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-secondary-700">
                  <FileText size={16} className="text-primary-600" />
                  Documents
                </h2>
                {profile.files && profile.files.length > 0 ? (
                  <div className="space-y-2">
                    {profile.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between py-2 px-3 border border-secondary-100 rounded-lg hover:bg-secondary-50">
                        <div className="flex items-center gap-2">
                          {getFileStatusIcon(file.status)}
                          <span className="text-sm font-medium text-secondary-900">{formatFileType(file.file_type)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <a href={file.file_url} target="_blank" rel="noreferrer" className="p-1.5 text-secondary-400 hover:text-primary-600 rounded">
                            <ExternalLink size={14} />
                          </a>
                          {file.status === 'pending' && (
                            <>
                              <button onClick={() => handleApproveFile(file.id)} disabled={updatingFileId === file.id} className="p-1.5 text-success-500 hover:bg-success-50 rounded">
                                <CheckCircle size={14} />
                              </button>
                              <button onClick={() => setShowRejectModal(file.id)} disabled={updatingFileId === file.id} className="p-1.5 text-danger-500 hover:bg-danger-50 rounded">
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-secondary-500 text-center py-3 text-sm">No documents</p>
                )}
              </Card>
            </>
          ) : (
            <Card className="py-8 text-center">
              <p className="text-secondary-500">No profile information available.</p>
            </Card>
          )}
        </div>

        {/* Right Column - Compact */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-secondary-500 mb-2">Update Status</h3>
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
            {isUpdatingStatus && <p className="text-xs text-secondary-500 mt-2 flex items-center gap-1"><Spinner size="sm" /> Updating...</p>}
          </Card>

          <Card className="p-4">
            <h3 className="text-xs font-semibold text-secondary-500 mb-2">System Info</h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-secondary-500">ID: </span>
                <span className="font-mono text-secondary-700">{vendor.id.slice(0, 8)}...</span>
              </div>
              <div>
                <span className="text-secondary-500">Created: </span>
                <span className="text-secondary-700">{new Date(vendor.created_at).toLocaleDateString()}</span>
              </div>
              {vendor.updated_at && (
                <div>
                  <span className="text-secondary-500">Updated: </span>
                  <span className="text-secondary-700">{new Date(vendor.updated_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Reject Document</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                Reason (optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => {
                setShowRejectModal(null);
                setRejectReason('');
              }}>
                Cancel
              </Button>
              <Button 
                variant="primary"
                onClick={() => handleRejectFile(showRejectModal)}
                isLoading={updatingFileId === showRejectModal}
                className="bg-danger-600 hover:bg-danger-700"
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
