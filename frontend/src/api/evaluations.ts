import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, Evaluation } from '../types';

export const evaluationsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Evaluation>>('/evaluations', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Evaluation>>(`/evaluation/${id}`);
    return response.data;
  },

  create: async (data: Partial<Evaluation>) => {
    const response = await apiClient.post<ApiResponse<Evaluation>>('/evaluation', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Evaluation>) => {
    const response = await apiClient.put<ApiResponse<Evaluation>>(`/evaluation/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse>(`/evaluation/${id}`);
    return response.data;
  },

  getByEvent: async (eventId: string) => {
    const response = await apiClient.get<ApiResponse<Evaluation[]>>(`/event/${eventId}/evaluations`);
    return response.data;
  },

  getByVendor: async (vendorId: string) => {
    const response = await apiClient.get<ApiResponse<Evaluation[]>>(`/vendor/${vendorId}/evaluations`);
    return response.data;
  },
};
