import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, Payment, PaymentFile } from '../types';

export const paymentsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Payment>>('/payments', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Payment>>(`/payment/${id}`);
    return response.data;
  },

  create: async (data: Partial<Payment> | FormData) => {
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' },
    } : {};
    const response = await apiClient.post<ApiResponse<Payment>>('/payment', data, config);
    return response.data;
  },

  update: async (id: string, data: Partial<Payment> | FormData) => {
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' },
    } : {};
    const response = await apiClient.put<ApiResponse<Payment>>(`/payment/${id}`, data, config);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse>(`/payment/${id}`);
    return response.data;
  },

  // Payment status management
  markAsPaid: async (id: string, paymentDate?: string) => {
    const response = await apiClient.put<ApiResponse<Payment>>(`/payment/${id}/paid`, { payment_date: paymentDate });
    return response.data;
  },

  cancel: async (id: string) => {
    const response = await apiClient.put<ApiResponse<Payment>>(`/payment/${id}/cancel`);
    return response.data;
  },

  // Payment Files Management
  uploadFile: async (paymentId: string, file: File, fileType: string, caption?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);
    if (caption) formData.append('caption', caption);

    const response = await apiClient.post<ApiResponse<PaymentFile>>(
      `/payment/${paymentId}/files`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  deleteFile: async (paymentId: string, fileId: string) => {
    const response = await apiClient.delete<ApiResponse>(`/payment/${paymentId}/files/${fileId}`);
    return response.data;
  },

  getMyPayments: async () => {
    const response = await apiClient.get<ApiResponse<Payment[]>>('/vendor/payments');
    return response.data;
  },
};
