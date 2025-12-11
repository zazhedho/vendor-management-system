import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { paymentsApi } from '../../api/payments';
import { vendorsApi } from '../../api/vendors';
import { toast } from 'react-toastify';
import { Save, X, Upload, FileText, Trash2, Download, Search, Loader2 } from 'lucide-react';
import { Button, Input, Card, Spinner, ConfirmModal } from '../../components/ui';
import { PaymentFile, Vendor, VendorProfile } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';

export const PaymentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { handleSilentError } = useErrorHandler();

  const [formData, setFormData] = useState({
    invoice_number: '',
    vendor_id: '',
    amount: '',
    status: 'pending',
    payment_date: '',
    description: '',
  });
  type VendorListItem = { vendor: Vendor; profile?: VendorProfile | null };
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [files, setFiles] = useState<{ file: File; file_type: string; caption: string }[]>([]);
  const [existingFiles, setExistingFiles] = useState<PaymentFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState('proof');
  const [customFileType, setCustomFileType] = useState('');
  const [isFetchingVendors, setIsFetchingVendors] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [vendorPage, setVendorPage] = useState(1);
  const [vendorTotalPages, setVendorTotalPages] = useState(1);
  const [isInitialVendorLoad, setIsInitialVendorLoad] = useState(true);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchVendors(1, false, '');
    if (isEditMode && id) {
      fetchPayment(id);
    }
  }, [id, isEditMode]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(vendorSearch);
      fetchVendors(1, false, vendorSearch);
    }, 350);
    return () => clearTimeout(handle);
  }, [vendorSearch]);

  const fetchVendors = async (page = 1, append = false, search = debouncedSearch) => {
    setIsFetchingVendors(true);
    if (!append && isInitialVendorLoad) setIsLoadingData(true);
    try {
      const response = await vendorsApi.getAll({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        'filters[status]': 'active',
      });
      if (response.status && response.data) {
        const data = (response.data || []).map((item: any) => {
          const vendor = item.vendor || item;
          const profile = item.profile || item.vendor?.profile || null;
          return { vendor, profile } as VendorListItem;
        });
        setVendors((prev) => append ? [...prev, ...data] : data);
        setVendorTotalPages(response.total_pages || 1);
        setVendorPage(page);
      }
    } catch (error) {
      handleSilentError(error, `Fetching vendors (page ${page}, search: "${search}")`);
      toast.error('Failed to load vendors');
    } finally {
      setIsFetchingVendors(false);
      setIsLoadingData(false);
      if (isInitialVendorLoad) setIsInitialVendorLoad(false);
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
        setExistingFiles(payment.files || []);
      }
    } catch (error) {
      handleSilentError(error, `Fetching payment ID ${id}`);
      toast.error('Failed to load payment data');
    }
  };

  const handleDeleteExistingFile = async () => {
    if (!deleteFileId || !id) return;
    setIsDeletingFile(true);
    try {
      await paymentsApi.deleteFile(id, deleteFileId);
      toast.success('File deleted successfully');
      setExistingFiles(existingFiles.filter(f => f.id !== deleteFileId));
    } catch (error: any) {
      handleSilentError(error, `Deleting file ${deleteFileId}`);
      toast.error(error?.response?.data?.error || 'Failed to delete file');
    } finally {
      setIsDeletingFile(false);
      setDeleteFileId(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      // Determine file type
      const fileType = selectedFileType === 'other' 
        ? (customFileType.trim() || 'other')
        : selectedFileType;

      setFiles([...files, { file, file_type: fileType, caption: '' }]);
      e.target.value = '';
      
      // Reset custom type after adding
      if (selectedFileType === 'other') {
        setCustomFileType('');
      }
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
            handleSilentError(e, `Uploading file type ${fileData.file_type}`);
          }
        }
        if (uploadedCount > 0) toast.success(`${uploadedCount} files uploaded`);
      }

      toast.success(isEditMode ? 'Payment updated successfully' : 'Payment created successfully');
      navigate('/payments');
    } catch (error: any) {
      handleSilentError(error, `Saving payment (mode: ${isEditMode ? 'update' : 'create'})`);
      toast.error(error.message || 'Failed to save payment');
    } finally {
      setIsLoading(false);
    }
  };

  const showInitialLoading = isInitialVendorLoad && isLoadingData;

  if (showInitialLoading) {
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
            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary-700">
                Vendor <span className="text-danger-500">*</span>
              </label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      value={vendorSearch}
                      onChange={(e) => setVendorSearch(e.target.value)}
                      placeholder="Search vendors by name or email..."
                      leftIcon={<Search size={16} className="text-secondary-400" />}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setVendorSearch('');
                      setDebouncedSearch('');
                      fetchVendors(1, false, '');
                    }}
                    disabled={isFetchingVendors}
                  >
                    Reset
                  </Button>
                </div>

                {isLoadingData && vendors.length === 0 ? (
                  <div className="flex justify-center py-6">
                    <Spinner size="md" />
                  </div>
                ) : vendors.length === 0 ? (
                  <Card className="py-6 text-center">
                    <p className="text-sm text-secondary-600">No vendors found. Try another search.</p>
                  </Card>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {vendors.map((item) => (
                      <div
                        key={item.vendor.id}
                        onClick={() => setFormData({ ...formData, vendor_id: item.vendor.id })}
                        className={`p-3 border rounded-lg cursor-pointer transition ${
                          formData.vendor_id === item.vendor.id
                            ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-400'
                            : 'border-secondary-200 hover:border-primary-300 hover:bg-secondary-50'
                        }`}
                      >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-secondary-900 truncate">
                                {item.profile?.vendor_name || item.vendor.id}
                              </p>
                              {item.vendor.vendor_code && (
                                <p className="text-[11px] text-secondary-500 font-mono">{item.vendor.vendor_code}</p>
                              )}
                              <p className="text-xs text-secondary-500 truncate">
                                {item.profile?.email || 'No email'}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-1 text-xs text-secondary-600">
                                {item.profile?.city_name && <span>{item.profile.city_name}</span>}
                              {item.profile?.province_name && <span>• {item.profile.province_name}</span>}
                              <span className="capitalize px-2 py-0.5 bg-secondary-100 rounded-full text-secondary-700">
                                {item.vendor.status}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border-2 mt-1 flex items-center justify-center ${
                              formData.vendor_id === item.vendor.id ? 'border-primary-500 bg-primary-500' : 'border-secondary-300'
                            }`}
                          >
                            {formData.vendor_id === item.vendor.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isFetchingVendors && (
                      <div className="flex justify-center py-2 text-secondary-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    )}
                    {vendorPage < vendorTotalPages && !isFetchingVendors && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        onClick={() => fetchVendors(vendorPage + 1, true)}
                      >
                        Load More
                      </Button>
                    )}
                  </div>
                )}
              </div>
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
                placeholder="Enter payment amount"
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

            {/* Existing Files (Edit Mode) */}
            {isEditMode && existingFiles.length > 0 && (
              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-secondary-700 mb-3 flex items-center gap-2">
                  <FileText size={16} />
                  Existing Documents ({existingFiles.length})
                </label>
                <div className="space-y-3">
                  {existingFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-secondary-50 border border-secondary-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-secondary-400" />
                        <div>
                          <p className="text-sm font-medium text-secondary-900 uppercase">{file.file_type}</p>
                          <p className="text-xs text-secondary-500">{file.caption || 'No caption'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Download size={16} />
                        </a>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleteFileId(file.id)}
                          leftIcon={<Trash2 size={14} />}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Upload Section */}
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-secondary-700 mb-3 flex items-center gap-2">
                <FileText size={16} />
                {isEditMode ? 'Add More Documents' : 'Attach Documents'}
              </label>

              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                {/* File Type Dropdown */}
                <div className="flex-1">
                  <select
                    value={selectedFileType}
                    onChange={(e) => setSelectedFileType(e.target.value)}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="proof">Proof</option>
                    <option value="invoice">Invoice</option>
                    <option value="receipt">Receipt</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Custom Type Input (shown when "other" is selected) */}
                {selectedFileType === 'other' && (
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={customFileType}
                      onChange={(e) => setCustomFileType(e.target.value)}
                      placeholder="Enter custom type..."
                    />
                  </div>
                )}

                {/* Upload Button */}
                <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors">
                  <Upload size={16} />
                  Select File
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={handleFileAdd}
                    className="hidden"
                  />
                </label>
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

      <ConfirmModal
        show={!!deleteFileId}
        title="Delete File"
        message="Are you sure you want to delete this file? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeletingFile}
        onConfirm={handleDeleteExistingFile}
        onCancel={() => setDeleteFileId(null)}
      />
    </div>
  );
};

export default PaymentForm;
