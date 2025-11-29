import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { paymentsApi } from '../../api/payments';
import { Payment } from '../../types';
import { ArrowLeft, DollarSign, FileText, Calendar, Download, Upload } from 'lucide-react';
import { toast } from 'react-toastify';

export const PaymentDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPayment(id);
    }
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="card text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Payment not found</h3>
        <button onClick={() => navigate('/payments')} className="btn btn-primary mt-4">
          Back to Payments
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/payments')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          <span>Back to Payments</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{payment.invoice_number}</h1>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(payment.status)}`}>
              {payment.status}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <FileText size={20} className="text-gray-500" />
              <h2 className="text-xl font-semibold text-gray-900">Description</h2>
            </div>
            {payment.description ? (
              <p className="text-gray-700 leading-relaxed">{payment.description}</p>
            ) : (
              <p className="text-gray-500 italic">No description provided</p>
            )}
          </div>

          {payment.files && payment.files.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Files</h2>
              <div className="space-y-2">
                {payment.files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center flex-1">
                      <FileText size={18} className="text-gray-600 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {file.file_type.toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-600">{file.file_url.split('/').pop()}</p>
                        {file.caption && (
                          <p className="text-xs text-gray-500 mt-1">{file.caption}</p>
                        )}
                      </div>
                    </div>
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Details</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <DollarSign size={16} className="mr-2" />
                  <span className="text-sm font-medium">Vendor ID</span>
                </div>
                <p className="text-sm text-gray-900 ml-6 font-mono break-all">{payment.vendor_id}</p>
              </div>

              {payment.payment_date && (
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <Calendar size={16} className="mr-2" />
                    <span className="text-sm font-medium">Payment Date</span>
                  </div>
                  <p className="text-gray-900 ml-6">
                    {new Date(payment.payment_date).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm text-gray-900">
                  {new Date(payment.created_at).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
