import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../../api/payments';
import { 
  ArrowLeft, FileText, Calendar, Download, Edit, Trash2, Loader2,
  Building2, Receipt, CheckCircle, Clock, XCircle, AlertCircle,
  DollarSign, Image as ImageIcon, File
} from 'lucide-react';
import { Button, Card, Badge, Spinner, ConfirmModal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export const PaymentDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission('payment', 'update');
  const canDelete = hasPermission('payment', 'delete');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => (canUpdate || canDelete) ? paymentsApi.getById(id!) : paymentsApi.getMyPaymentById(id!),
    enabled: !!id,
    select: (response) => response.data,
  });

  const deleteMutation = useMutation({
    mutationFn: () => paymentsApi.delete(id!),
    onSuccess: () => {
      toast.success('Payment deleted successfully');
      navigate('/payments');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to delete payment');
    },
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => paymentsApi.update(id!, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
      toast.success('Payment status updated');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to update status');
    },
  });

  const handleStatusChange = (newStatus: string) => {
    if (!id || !payment || !canUpdate) return;
    statusMutation.mutate(newStatus);
  };

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': 
        return { 
          variant: 'success' as const, 
          icon: CheckCircle, 
          color: 'text-success-500',
          bg: 'bg-success-500',
          label: 'Paid'
        };
      case 'pending': 
        return { 
          variant: 'warning' as const, 
          icon: Clock, 
          color: 'text-warning-500',
          bg: 'bg-warning-500',
          label: 'Pending'
        };
      case 'failed': 
        return { 
          variant: 'danger' as const, 
          icon: XCircle, 
          color: 'text-danger-500',
          bg: 'bg-danger-500',
          label: 'Failed'
        };
      case 'cancelled': 
        return { 
          variant: 'secondary' as const, 
          icon: AlertCircle, 
          color: 'text-secondary-500',
          bg: 'bg-secondary-500',
          label: 'Cancelled'
        };
      default: 
        return { 
          variant: 'secondary' as const, 
          icon: Clock, 
          color: 'text-secondary-500',
          bg: 'bg-secondary-500',
          label: status
        };
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isImageFile = (url: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!payment) {
    return (
      <Card className="text-center py-12">
        <h3 className="text-lg font-medium text-secondary-900 mb-2">Payment not found</h3>
        <Button onClick={() => navigate('/payments')}>Back to Payments</Button>
      </Card>
    );
  }

  const statusConfig = getStatusConfig(payment.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/payments')} leftIcon={<ArrowLeft size={16} />}>
          Back
        </Button>
        {(canUpdate || canDelete) && (
          <div className="flex gap-2">
            {canUpdate && (
              <Button
                variant="secondary"
                onClick={() => navigate(`/payments/${id}/edit`)}
                leftIcon={<Edit size={16} />}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
                leftIcon={<Trash2 size={16} />}
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Hero Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-8 text-white">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-emerald-100 text-sm">Invoice Number</p>
                  <h1 className="text-2xl font-bold">{payment.invoice_number}</h1>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <Badge 
                  variant={statusConfig.variant}
                  className="flex items-center gap-1.5 px-3 py-1.5"
                >
                  <StatusIcon size={14} />
                  {statusConfig.label}
                </Badge>
                
                {canUpdate && (
                  <div className="flex items-center gap-2">
                    <select
                      value={payment.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={statusMutation.isPending}
                      className="px-3 py-1.5 text-sm rounded-lg bg-white/10 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-60"
                    >
                      {['pending', 'paid', 'cancelled', 'failed'].map((status) => (
                        <option key={status} value={status} className="text-secondary-900 capitalize">
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                    {statusMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-left md:text-right">
              <p className="text-emerald-100 text-sm mb-1">Total Amount</p>
              <p className="text-4xl font-bold">{formatCurrency(payment.amount)}</p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-secondary-200 bg-secondary-50">
          <div className="px-6 py-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-secondary-400" />
            </div>
            <p className="text-sm font-semibold text-secondary-900">{formatDate(payment.payment_date)}</p>
            <p className="text-xs text-secondary-500">Payment Date</p>
          </div>
          <div className="px-6 py-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-secondary-400" />
            </div>
            <p className="text-sm font-semibold text-secondary-900">{payment.files?.length || 0}</p>
            <p className="text-xs text-secondary-500">Attachments</p>
          </div>
          <div className="px-6 py-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-secondary-400" />
            </div>
            <p className="text-sm font-semibold text-secondary-900 truncate">
              {payment.vendor?.profile?.vendor_name?.split(' ')[0] || '-'}
            </p>
            <p className="text-xs text-secondary-500">Vendor</p>
          </div>
          <div className="px-6 py-4 text-center">
            <div className={`flex items-center justify-center gap-2 mb-1`}>
              <div className={`w-2 h-2 rounded-full ${statusConfig.bg}`}></div>
            </div>
            <p className="text-sm font-semibold text-secondary-900 capitalize">{payment.status}</p>
            <p className="text-xs text-secondary-500">Status</p>
          </div>
        </div>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Vendor Card */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">Vendor</p>
              <p className="text-sm font-semibold text-secondary-900 truncate mt-1">
                {payment.vendor?.profile?.vendor_name || 'N/A'}
              </p>
              {payment.vendor?.vendor_code && (
                <p className="text-xs text-secondary-500 font-mono mt-0.5">
                  {payment.vendor.vendor_code}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Amount Card */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-success-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">Amount</p>
              <p className="text-sm font-semibold text-secondary-900 mt-1">
                {formatCurrency(payment.amount)}
              </p>
            </div>
          </div>
        </Card>

        {/* Date Card */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-info-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-info-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">Created</p>
              <p className="text-sm font-semibold text-secondary-900 mt-1">
                {formatDate(payment.created_at)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Description Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-secondary-400" />
          <h3 className="font-semibold text-secondary-900">Description</h3>
        </div>
        {payment.description ? (
          <p className="text-secondary-700 whitespace-pre-wrap bg-secondary-50 rounded-lg p-4">
            {payment.description}
          </p>
        ) : (
          <p className="text-secondary-400 italic bg-secondary-50 rounded-lg p-4">
            No description provided
          </p>
        )}
      </Card>

      {/* Files Section */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-secondary-200 bg-secondary-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-secondary-900">Payment Files</h3>
                <p className="text-sm text-secondary-500">
                  {payment.files?.length || 0} attachment{(payment.files?.length || 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {payment.files && payment.files.length > 0 ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {payment.files.map((file, index) => (
              <div 
                key={file.id}
                className="group relative rounded-xl overflow-hidden border-2 border-secondary-200 hover:border-primary-300 transition-all"
              >
                {/* Preview */}
                <div className="relative aspect-video bg-secondary-100">
                  {isImageFile(file.file_url) ? (
                    <img
                      src={file.file_url}
                      alt={`File ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <File className="w-12 h-12 text-secondary-400 mb-2" />
                      <span className="text-xs text-secondary-500 uppercase font-medium">
                        {file.file_type}
                      </span>
                    </div>
                  )}
                  
                  {/* File Number */}
                  <div className="absolute top-2 left-2 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {index + 1}
                  </div>

                  {/* Download Overlay */}
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                      <Download className="w-5 h-5 text-primary-600" />
                    </div>
                  </a>
                </div>

                {/* Content */}
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isImageFile(file.file_url) ? (
                        <ImageIcon size={14} className="text-secondary-400" />
                      ) : (
                        <File size={14} className="text-secondary-400" />
                      )}
                      <span className="text-sm font-medium text-secondary-900 uppercase">
                        {file.file_type}
                      </span>
                    </div>
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                  <p className="text-xs text-secondary-500 mt-1 truncate">
                    {file.file_url.split('/').pop()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
            <p className="text-secondary-600 font-medium">No files attached</p>
            <p className="text-sm text-secondary-400 mt-1">
              Payment attachments will appear here
            </p>
          </div>
        )}
      </Card>

      <ConfirmModal
        show={showDeleteModal}
        title="Delete Payment"
        message="Are you sure you want to delete this payment? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
