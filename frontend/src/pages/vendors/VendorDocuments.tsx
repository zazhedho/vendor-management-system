import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, AlertCircle, Upload, ArrowLeft, Save } from 'lucide-react';
import { vendorsApi } from '../../api/vendors';
import { useAuth } from '../../context/AuthContext';
import { Vendor, VendorProfile, VendorProfileFile } from '../../types';
import { Button, Card, Spinner, Badge } from '../../components/ui';
import { toast } from 'react-toastify';

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

const companyDocs = ['ktp', 'domisili', 'siup', 'nib', 'skt', 'npwp', 'sppkp', 'akta', 'bank_book'];
const individualDocs = ['ktp', 'npwp', 'bank_book'];

export const VendorDocuments: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, hasPermission } = useAuth();

  const isVendorRole = useMemo(() => user?.role === 'vendor', [user?.role]);
  const canVerifyDocs = useMemo(() => hasPermission('vendor', 'update_status'), [hasPermission]);

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isUpdatingFileStatus, setIsUpdatingFileStatus] = useState(false);
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        let response;
        if (isVendorRole || !id) {
          response = await vendorsApi.getMyVendorProfile();
        } else {
          response = await vendorsApi.getById(id);
        }
        if (response.status && response.data) {
          const data = response.data as any;
          const vendorData = data.vendor || data;
          const profileData = data.profile || null;
          setVendor(vendorData?.id ? vendorData : null);
          setProfile(profileData);
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Gagal memuat data dokumen');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, isVendorRole]);

  const handleFileUpload = (fileType: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !profile?.id) return;
    if (profile?.files?.some((f) => f.file_type === fileType)) {
      toast.error(`Dokumen ${formatFileType(fileType)} sudah diunggah, hapus dulu sebelum mengganti`);
      e.target.value = '';
      return;
    }

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
    try {
      const response = await vendorsApi.uploadProfileFile(profile.id, file, fileType);
      if (response.status) {
        toast.success('File uploaded successfully');
        await refreshProfile();
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

  const handleDeleteFileClick = (fileId: string) => setDeleteFileId(fileId);

  const handleDeleteFileConfirm = async () => {
    if (!profile?.id || !deleteFileId) return;
    setIsDeletingFile(true);
    try {
      const response = await vendorsApi.deleteProfileFile(profile.id, deleteFileId);
      if (response.status) {
        toast.success('File deleted successfully');
        await refreshProfile();
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

  const refreshProfile = async () => {
    try {
      let response;
      if (isVendorRole || !id) {
        response = await vendorsApi.getMyVendorProfile();
      } else {
        response = await vendorsApi.getById(id);
      }
      if (response.status && response.data) {
        const data = response.data as any;
        const vendorData = data.vendor || data;
        const profileData = data.profile || null;
        setVendor(vendorData?.id ? vendorData : null);
        setProfile(profileData);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal memuat data dokumen');
    }
  };

  const handleFileStatusChange = async (fileId: string, status: 'approved' | 'rejected') => {
    if (!profile?.id) return;
    const reason = status === 'rejected' ? window.prompt('Alasan penolakan dokumen?') || '' : undefined;
    setIsUpdatingFileStatus(true);
    try {
      const response = await vendorsApi.updateFileStatus(fileId, status, reason);
      if (response.status) {
        toast.success('Status file diperbarui');
        await refreshProfile();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal update status file');
    } finally {
      setIsUpdatingFileStatus(false);
    }
  };

  const canUpload = useMemo(() => {
    if (!profile?.id) return false;
    if (isVendorRole) return hasPermission('vendor', 'update');
    return false;
  }, [profile?.id, isVendorRole, hasPermission]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile || !vendor) {
    return (
      <Card className="max-w-3xl mx-auto p-8 text-center">
        <p className="text-secondary-600">Vendor profile tidak ditemukan. Lengkapi profil terlebih dahulu.</p>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => navigate('/vendor/profile')}>Kembali</Button>
        </div>
      </Card>
    );
  }

  const docs = profile.files || [] as VendorProfileFile[];
  const requiredDocs = vendor.vendor_type === 'individual' ? individualDocs : companyDocs;

  const uploadedCount = docs.filter((d) => d.file_url).length;
  const totalRequired = requiredDocs.length;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/vendor/profile')} leftIcon={<ArrowLeft size={16} />}>Kembali</Button>
          <h1 className="text-2xl font-bold text-secondary-900">Upload Dokumen</h1>
        </div>
        <Badge variant="info" className="capitalize">{vendor.status}</Badge>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm text-secondary-600">Progress upload</p>
            <p className="text-lg font-semibold text-secondary-900">{uploadedCount}/{totalRequired} dokumen disarankan</p>
          </div>
          <div className="w-full md:w-1/2 h-2 rounded-full bg-secondary-100 overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all"
              style={{ width: `${Math.round((uploadedCount / totalRequired) * 100)}%` }}
            />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-4">
          <p className="text-sm text-secondary-600">
            {vendor.vendor_type === 'individual'
              ? 'Perorangan dianjurkan unggah: KTP, NPWP, Buku Tabungan.'
              : 'Perusahaan dianjurkan unggah: KTP pemilik, Izin Domisili, SIUP/NIB, SKT, NPWP, SP-PKP, Akta Perusahaan, Rekening (halaman depan/buku tabungan).'}
          </p>
          {!canUpload && (
            <div className="mt-3 p-3 border border-secondary-200 rounded-lg bg-secondary-50 text-sm text-secondary-700">
              Anda tidak memiliki izin untuk mengunggah dokumen.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {requiredDocs.map((type) => {
            const existing = docs.find((f) => f.file_type === type);
            if (existing) {
              return (
                <div
                  key={type}
                  className={`flex items-center gap-3 p-3 border rounded-xl shadow-sm ${existing.status === 'rejected'
                    ? 'border-danger-200 bg-danger-50/70'
                    : existing.status === 'approved'
                      ? 'border-success-200 bg-success-50/70'
                      : 'border-secondary-200 bg-secondary-50'
                    }`}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/60 border border-white/70">
                    <FileText size={18} className={existing.status === 'rejected'
                      ? 'text-danger-500'
                      : existing.status === 'approved'
                        ? 'text-success-600'
                        : 'text-primary-600'
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-secondary-900 truncate">{formatFileType(existing.file_type)}</p>
                    <p className="text-xs text-secondary-500 truncate capitalize">Status: {existing.status}</p>
                    {existing.status === 'rejected' && existing.reject_reason && (
                      <p className="text-[11px] text-danger-700 mt-1 whitespace-pre-line">Alasan: {existing.reject_reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canUpload && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFileClick(existing.id)}
                        className="text-danger-600 hover:bg-danger-50"
                        leftIcon={<AlertCircle size={14} />}
                      >
                        Delete
                      </Button>
                    )}
                    {canVerifyDocs && existing.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleFileStatusChange(existing.id, 'approved')}
                          disabled={isUpdatingFileStatus}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleFileStatusChange(existing.id, 'rejected')}
                          disabled={isUpdatingFileStatus}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <label
                key={type}
                className={`flex flex-col items-center justify-center h-28 border border-dashed border-secondary-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all group shadow-sm ${!canUpload ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
              >
                <Upload className="w-5 h-5 text-secondary-400 group-hover:text-primary-500 mb-1" />
                <span className="text-sm font-medium text-secondary-700 group-hover:text-primary-600 text-center px-2">
                  {formatFileType(type)}
                </span>
                <p className="text-[11px] text-secondary-500 mt-1">PDF/JPG/PNG</p>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileUpload(type)}
                  className="hidden"
                  disabled={uploadingFile || !canUpload}
                />
              </label>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="text-lg font-semibold text-secondary-900 mb-3 flex items-center gap-2">
          <FileText size={18} className="text-primary-600" /> Dokumen Terunggah
        </h4>
        {docs.length === 0 ? (
          <p className="text-secondary-500 text-sm">Belum ada dokumen diunggah.</p>
        ) : (
          <div className="divide-y divide-secondary-100">
            {docs.map((file) => (
              <div key={file.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText size={18} className={file.status === 'rejected'
                    ? 'text-danger-500'
                    : file.status === 'approved'
                      ? 'text-success-600'
                      : 'text-primary-600'
                  } />
                  <div className="min-w-0">
                    <a href={file.file_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary-700 hover:underline">
                      {formatFileType(file.file_type)}
                    </a>
                    <p className="text-xs text-secondary-500">Status: {file.status}</p>
                    {file.status === 'rejected' && file.reject_reason && (
                      <p className="text-xs text-danger-700 mt-1 whitespace-pre-line">Alasan: {file.reject_reason}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {canUpload && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFileClick(file.id)}
                      className="text-danger-600 hover:bg-danger-50"
                      leftIcon={<AlertCircle size={14} />}
                    >
                      Delete
                    </Button>
                  )}
                  {canVerifyDocs && file.status === 'pending' && (
                    <div className="flex gap-2">
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
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => navigate('/vendor/profile')} leftIcon={<Save size={16} />}>
          Save & Finish
        </Button>
      </div>

      {/* Confirm delete */}
      {deleteFileId && (
        <Card className="p-4">
          <p className="text-secondary-700 mb-3">Hapus dokumen ini?</p>
          <div className="flex gap-3">
            <Button variant="danger" isLoading={isDeletingFile} onClick={handleDeleteFileConfirm}>Delete</Button>
            <Button variant="secondary" onClick={() => setDeleteFileId(null)}>Cancel</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default VendorDocuments;
