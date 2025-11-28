import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, Vendor, VendorProfile } from '../types';

export const vendorsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Vendor>>('/vendors', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Vendor>>(`/vendor/${id}`);
    return response.data;
  },

  create: async (data: { user_id: string; vendor_type: string; status?: string }) => {
    const response = await apiClient.post<ApiResponse<Vendor>>('/vendor', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Vendor>) => {
    const response = await apiClient.put<ApiResponse<Vendor>>(`/vendor/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse>(`/vendor/${id}`);
    return response.data;
  },

  getProfile: async (vendorId: string) => {
    const response = await apiClient.get<ApiResponse<VendorProfile>>(`/vendor/${vendorId}/profile`);
    return response.data;
  },

  createProfile: async (data: Partial<VendorProfile>) => {
    const response = await apiClient.post<ApiResponse<VendorProfile>>('/vendor/profile', data);
    return response.data;
  },

  updateProfile: async (id: string, data: Partial<VendorProfile>) => {
    const response = await apiClient.put<ApiResponse<VendorProfile>>(`/vendor/profile/${id}`, data);
    return response.data;
  },

  getMyVendor: async () => {
    const response = await apiClient.get<ApiResponse<Vendor>>('/vendor/me');
    return response.data;
  },
};
