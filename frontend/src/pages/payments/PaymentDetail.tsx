import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../../api/payments';
import { ArrowLeft, FileText, Calendar, Download, Edit, Trash2, Loader2 } from 'lucide-react';
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

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'success';
      case 'pending': return 'info';
      case 'failed': return 'danger';
      case 'cancelled': return 'warning';
      default: return 'secondary';
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(parseFloat(amount));
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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

      <Card className="bg-gradient-to-r from-secondary-900 to-secondary-800 text-white border-none">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-secondary-300 text-sm mb-1">Invoice Number</p>
            <h1 className="text-3xl font-bold mb-4">{payment.invoice_number}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Badge
                variant={getStatusVariant(payment.status)}
                className="border border-white/40 bg-white/90 text-secondary-900 capitalize"
              >
                {payment.status}
              </Badge>
              {canUpdate && (
                <div className="flex items-center gap-2">
                  <select
                    value={payment.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={statusMutation.isPending}
                    className="px-3 py-1.5 text-sm rounded-lg bg-white/10 border border-white/30 text-white capitalize focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-60"
                  >
                    {['pending', 'paid', 'cancelled', 'failed'].map((status) => (
                      <option key={status} value={status} className="text-secondary-900 capitalize">
                        {status}
                      </option>
                    ))}
                  </select>
                  {statusMutation.isPending && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-secondary-300 text-sm mb-1">Total Amount</p>
            <p className="text-3xl font-bold">{formatCurrency(payment.amount)}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText size={20} className="text-primary-600" />
              Description
            </h2>
            <p className="text-secondary-700 leading-relaxed">
              {payment.description || <span className="text-secondary-500 italic">No description provided</span>}
            </p>
          </Card>

          {payment.files && payment.files.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText size={20} className="text-primary-600" />
                Payment Files
              </h2>
              <div className="space-y-3">
                {payment.files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-secondary-50 border border-secondary-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-secondary-400" />
                      <div>
                        <p className="text-sm font-medium text-secondary-900">{file.file_type.toUpperCase()}</p>
                        <p className="text-xs text-secondary-500">{file.file_url.split('/').pop()}</p>
                      </div>
                    </div>
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Download size={18} />
                    </a>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-secondary-900 mb-4">Transaction Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-secondary-500 mb-1">Vendor Name</p>
                <p className="text-sm font-medium text-secondary-900">
                  {payment.vendor?.profile?.vendor_name || '-'}
                </p>
              </div>
              <div className="pt-4 border-t border-secondary-100">
                <p className="text-xs text-secondary-500 mb-1">Vendor Code</p>
                <p className="text-xs font-mono text-secondary-600 break-all">
                  {payment.vendor?.vendor_code || payment.vendor_id}
                </p>
              </div>
              <div className="pt-4 border-t border-secondary-100">
                <p className="text-xs text-secondary-500 mb-1">Payment Date</p>
                <div className="flex items-center gap-2 text-secondary-900">
                  <Calendar size={16} className="text-secondary-400" />
                  <span className="text-sm">
                    {payment.payment_date
                      ? new Date(payment.payment_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                      : '-'
                    }
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-secondary-100">
                <p className="text-xs text-secondary-500 mb-1">Created At</p>
                <p className="text-sm text-secondary-900">
                  {new Date(payment.created_at).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

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
