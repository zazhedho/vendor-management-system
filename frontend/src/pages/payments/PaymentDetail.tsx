import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { paymentsApi } from '../../api/payments';
import { Payment } from '../../types';
import { ArrowLeft, DollarSign, FileText, Calendar, Download } from 'lucide-react';
import { Button, Card, Badge, Spinner } from '../../components/ui';

export const PaymentDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) fetchPayment(id);
  }, [id]);

  const fetchPayment = async (paymentId: string) => {
    setIsLoading(true);
    try {
      const response = await paymentsApi.getById(paymentId);
      if (response.status && response.data) {
        setPayment(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch payment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
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
      </div>

      <Card className="bg-gradient-to-r from-secondary-900 to-secondary-800 text-white border-none">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-secondary-300 text-sm mb-1">Invoice Number</p>
            <h1 className="text-3xl font-bold mb-4">{payment.invoice_number}</h1>
            <Badge variant={getStatusVariant(payment.status)} className="bg-white/20 text-white border-none backdrop-blur-sm">
              {payment.status}
            </Badge>
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
                <p className="text-xs text-secondary-500 mb-1">Vendor ID</p>
                <p className="text-sm font-mono text-secondary-900 break-all">{payment.vendor_id}</p>
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
    </div>
  );
};
