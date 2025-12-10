import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../../api/payments';
import { Payment } from '../../types';
import { Plus, CreditCard, Eye, Edit, Trash2, X } from 'lucide-react';
import { Button, Card, Table, Badge, ConfirmModal, ActionMenu } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { usePagination, useDebounce } from '../../hooks';
import { toast } from 'react-toastify';

export const PaymentList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('payment', 'create');
  const canUpdate = hasPermission('payment', 'update');
  const canDelete = hasPermission('payment', 'delete');
  const isSelfService = !(canCreate || canUpdate || canDelete);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { currentPage, setCurrentPage, goToNextPage, goToPrevPage, canGoNext, canGoPrev } = usePagination(1);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['payments', { page: currentPage, search: debouncedSearch, status: statusFilter, type: isSelfService ? 'my' : 'all' }],
    queryFn: () => {
      const params: any = { page: currentPage, limit: 10, search: debouncedSearch };
      if (statusFilter) params['filters[status]'] = statusFilter;
      return isSelfService ? paymentsApi.getMyPayments(params) : paymentsApi.getAll(params);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setDeletePaymentId(null);
      toast.success('Payment deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to delete payment');
    },
  });

  const payments = response?.data || [];
  const totalPages = response?.total_pages || 1;

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(parseFloat(amount));
  };

  const columns = [
    {
      header: 'Invoice',
      accessor: (payment: Payment) => (
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-secondary-400" />
          <span className="font-medium text-secondary-900">{payment.invoice_number}</span>
        </div>
      )
    },
    {
      header: 'Vendor',
      accessor: (payment: Payment) => (
        <div className="flex flex-col">
          <span className="font-semibold text-secondary-900">
            {payment.vendor?.profile?.vendor_name || '-'}
          </span>
          {payment.vendor?.vendor_code && (
            <span className="text-xs text-secondary-500 font-mono">{payment.vendor.vendor_code}</span>
          )}
        </div>
      )
    },
    {
      header: 'Amount',
      accessor: (payment: Payment) => (
        <span className="font-semibold text-secondary-900">{formatCurrency(payment.amount)}</span>
      )
    },
    {
      header: 'Status',
      accessor: (payment: Payment) => (
        <Badge variant={getStatusVariant(payment.status)} className="capitalize">
          {payment.status}
        </Badge>
      )
    },
    {
      header: 'Date',
      accessor: (payment: Payment) => (
        <span className="text-secondary-600 text-sm">
          {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (payment: Payment) => (
        <ActionMenu
          items={[
            {
              label: 'View',
              icon: <Eye size={14} />,
              onClick: () => navigate(`/payments/${payment.id}`),
            },
            {
              label: 'Edit',
              icon: <Edit size={14} />,
              onClick: () => navigate(`/payments/${payment.id}/edit`),
              hidden: !canUpdate,
            },
            {
              label: 'Delete',
              icon: <Trash2 size={14} />,
              onClick: () => setDeletePaymentId(payment.id),
              variant: 'danger',
              hidden: !canDelete,
            },
          ]}
        />
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Payments</h1>
          <p className="text-secondary-500">{isSelfService ? "View your payment history" : "Track and manage payment transactions"}</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => navigate('/payments/new')}
            leftIcon={<Plus size={20} />}
          >
            Create Payment
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by invoice number or vendor name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {(searchTerm || statusFilter) && (
            <Button onClick={handleReset} variant="secondary" leftIcon={<X size={20} />}>
              Reset
            </Button>
          )}
        </div>
      </Card>

      <Table
        data={payments}
        columns={columns}
        keyField="id"
        isLoading={isLoading}
        onRowClick={(payment) => navigate(`/payments/${payment.id}`)}
        emptyMessage={isSelfService ? "No payments found for your account." : "No payments found."}
      />

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="secondary"
            onClick={goToPrevPage}
            disabled={!canGoPrev}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-secondary-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={goToNextPage}
            disabled={!canGoNext(totalPages)}
          >
            Next
          </Button>
        </div>
      )}

      <ConfirmModal
        show={!!deletePaymentId}
        title="Delete Payment"
        message="Are you sure you want to delete this payment? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deletePaymentId && deleteMutation.mutate(deletePaymentId)}
        onCancel={() => setDeletePaymentId(null)}
      />
    </div>
  );
};
