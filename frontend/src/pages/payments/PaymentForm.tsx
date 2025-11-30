import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { paymentsApi } from '../../api/payments';
import { vendorsApi } from '../../api/vendors';
import { toast } from 'react-toastify';
import { Save, X, Upload, FileText, Trash2 } from 'lucide-react';
import { Button, Input, Card, Spinner } from '../../components/ui';

export const PaymentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    invoice_number: '',
    vendor_id: '',
    amount: '',
    status: 'pending',
    payment_date: '',
    description: '',
  });
  const [vendors, setVendors] = useState<any[]>([]);
  const [files, setFiles] = useState<{ file: File; file_type: string; caption: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    fetchVendors();
    if (isEditMode && id) {
      fetchPayment(id);
    }
  }, [id, isEditMode]);

  const fetchVendors = async () => {
    setIsLoadingData(true);
    try {
      const response = await vendorsApi.getAll({ limit: 100 });
      if (response.status && response.data) {
        setVendors(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchPayment = async (paymentId: string) => {
    try {
      const response = await paymentsApi.getById(paymentId);
      if (response.status && response.data) {
        const payment = response.data;
        setFormData({
          invoice_number: payment.invoice_number || '',
          vendor_id: payment.vendor_id || '',
          amount: payment.amount || '',
          status: payment.status || 'pending',
          payment_date: payment.payment_date ? payment.payment_date.split('T')[0] : '',
          description: payment.description || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch payment:', error);
      toast.error('Failed to load payment data');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload PDF, DOC, DOCX, or image files');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setFiles([...files, { file, file_type: fileType, caption: '' }]);
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleCaptionChange = (index: number, caption: string) => {
    const updated = [...files];
    updated[index].caption = caption;
    setFiles(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.invoice_number || !formData.vendor_id || !formData.amount) {
      toast.error('Invoice Number, Vendor, and Amount are required');
      return;
    }

    setIsLoading(true);

    try {
      const submitData: any = {
        invoice_number: formData.invoice_number,
        vendor_id: formData.vendor_id,
        amount: parseFloat(formData.amount) || 0,
        status: formData.status,
        payment_date: formData.payment_date || undefined,
        description: formData.description || undefined,
      };

      let paymentId = id;

      if (isEditMode && id) {
        const response = await paymentsApi.update(id, submitData);
        if (!response.status) throw new Error(response.message || 'Failed to update payment');
      } else {
        const response = await paymentsApi.create(submitData);
        if (!response.status) throw new Error(response.message || 'Failed to create payment');
        paymentId = response.data?.id;
      }

      // Upload files if any
      if (files.length > 0 && paymentId) {
        let uploadedCount = 0;
        for (const fileData of files) {
          try {
            const response = await paymentsApi.uploadFile(
              paymentId,
              fileData.file,
              fileData.file_type,
              fileData.caption || undefined
            );
            if (response.status) uploadedCount++;
          } catch (e) {
            console.error('Failed to upload file:', e);
          }
        }
        if (uploadedCount > 0) toast.success(`${uploadedCount} files uploaded`);
      }

      toast.success(isEditMode ? 'Payment updated successfully' : 'Payment created successfully');
      navigate('/payments');
    } catch (error: any) {
      console.error('Failed to save payment:', error);
      toast.error(error.message || 'Failed to save payment');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-secondary-900">
          {isEditMode ? 'Edit Payment' : 'Create New Payment'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="space-y-6">
            {/* Invoice Number */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Invoice Number <span className="text-danger-500">*</span>
              </label>
              <Input
                type="text"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleChange}
                placeholder="e.g., INV-2024-001"
                required
              />
            </div>

            {/* Vendor Selection */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Vendor <span className="text-danger-500">*</span>
              </label>
              <select
                name="vendor_id"
                value={formData.vendor_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Select Vendor</option>
                {vendors.map((vendor: any) => (
                  <option key={vendor.vendor?.id} value={vendor.vendor?.id}>
                    {vendor.profile?.vendor_name || vendor.vendor?.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Amount <span className="text-danger-500">*</span>
              </label>
              <Input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0"
                step="0.01"
                min="0"
                required
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Status <span className="text-danger-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Payment Date
              </label>
              <Input
                type="date"
                name="payment_date"
                value={formData.payment_date}
                onChange={handleChange}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter payment description..."
              />
            </div>

            {/* File Upload Section */}
            {!isEditMode && (
              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-secondary-700 mb-3 flex items-center gap-2">
                  <FileText size={16} />
                  Attach Documents
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  {['proof', 'invoice', 'receipt'].map((fileType) => (
                    <label
                      key={fileType}
                      className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-secondary-100 hover:bg-secondary-200 rounded-lg transition-colors border-2 border-dashed border-secondary-300"
                    >
                      <Upload size={16} />
                      <span className="capitalize">{fileType}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={(e) => handleFileAdd(e, fileType)}
                        className="hidden"
                      />
                    </label>
                  ))}
                </div>
                <p className="text-xs text-secondary-500">Max 5MB per file. Accepted: PDF, DOC, DOCX, Images</p>

                {files.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {files.map((fileData, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center gap-4">
                          <FileText size={24} className="text-secondary-400" />
                          <div className="flex-1 space-y-2">
                            <p className="text-sm font-medium text-secondary-900">
                              {fileData.file.name}
                            </p>
                            <p className="text-xs text-secondary-500">
                              Type: {fileData.file_type} • Size: {(fileData.file.size / 1024).toFixed(2)} KB
                            </p>
                            <Input
                              type="text"
                              value={fileData.caption}
                              onChange={(e) => handleCaptionChange(index, e.target.value)}
                              placeholder="Add caption (optional)"
                              className="text-sm"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveFile(index)}
                            leftIcon={<Trash2 size={14} />}
                          >
                            Remove
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/payments')}
              leftIcon={<X size={16} />}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Save size={16} />}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : isEditMode ? 'Update Payment' : 'Create Payment'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
