import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, Payment } from '../types';

export const paymentsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Payment>>('/payments', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Payment>>(`/payment/${id}`);
    return response.data;
  },

  create: async (data: Partial<Payment>) => {
    const response = await apiClient.post<ApiResponse<Payment>>('/payment', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Payment>) => {
    const response = await apiClient.put<ApiResponse<Payment>>(`/payment/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse>(`/payment/${id}`);
    return response.data;
  },

  getMyPayments: async () => {
    const response = await apiClient.get<ApiResponse<Payment[]>>('/vendor/payments');
    return response.data;
  },

  uploadProof: async (paymentId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<Payment>>(`/payment/${paymentId}/proof`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
