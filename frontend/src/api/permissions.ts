import { apiClient } from './client';
import { Permission, ApiResponse, PaginatedResponse } from '../types';

export const permissionsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Permission>>('/permissions', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Permission>>(`/permission/${id}`);
    return response.data;
  },

  create: async (data: Partial<Permission>) => {
    const response = await apiClient.post<ApiResponse<Permission>>('/permission', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Permission>) => {
    const response = await apiClient.put<ApiResponse<Permission>>(`/permission/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse>(`/permission/${id}`);
    return response.data;
  },
};
