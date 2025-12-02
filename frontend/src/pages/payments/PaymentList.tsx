import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentsApi } from '../../api/payments';
import { Payment } from '../../types';
import { Plus, Search, CreditCard, Eye, Edit, Trash2 } from 'lucide-react';
import { Button, Card, Table, Badge, ConfirmModal, ActionMenu } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export const PaymentList: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole, hasPermission } = useAuth();
  const isVendor = hasRole(['vendor']);
  const canCreate = hasPermission('create_payment');
  const canUpdate = hasPermission('update_payment');
  const canDelete = hasPermission('delete_payment');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [currentPage, searchTerm, isVendor]);

  const handleDelete = async () => {
    if (!deletePaymentId) return;
    setIsDeleting(true);
    try {
      await paymentsApi.delete(deletePaymentId);
      toast.success('Payment deleted successfully');
      fetchPayments();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete payment');
    } finally {
      setIsDeleting(false);
      setDeletePaymentId(null);
    }
  };

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      // Vendor uses different endpoint
      if (isVendor) {
        const response = await paymentsApi.getMyPayments();
        if (response.status) {
          setPayments(response.data || []);
          setTotalPages(1); // No pagination for vendor endpoint
        }
      } else {
        const response = await paymentsApi.getAll({
          page: currentPage,
          limit: 10,
          search: searchTerm,
        });
        if (response.status) {
          setPayments(response.data || []);
          setTotalPages(response.total_pages || 1);
        }
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      case 'processing': return 'info';
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
        <span className="font-semibold text-secondary-900">
          {payment.vendor?.profile?.vendor_name || '-'}
        </span>
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
      header: '',
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
          <p className="text-secondary-500">{isVendor ? "View your payment history" : "Track and manage payment transactions"}</p>
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
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" size={20} />
          <input
            type="text"
            placeholder="Search invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
      </Card>

      <Table
        data={payments}
        columns={columns}
        keyField="id"
        isLoading={isLoading}
        onRowClick={(payment) => navigate(`/payments/${payment.id}`)}
        emptyMessage={isVendor ? "No payments found for your account." : "No payments found."}
      />

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-secondary-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
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
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletePaymentId(null)}
      />
    </div>
  );
};
