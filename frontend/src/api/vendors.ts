import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, Vendor, VendorProfile, VendorProfileFile } from '../types';

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

  // Vendor verification
  verify: async (id: string) => {
    const response = await apiClient.put<ApiResponse<Vendor>>(`/vendor/${id}/verify`);
    return response.data;
  },

  reject: async (id: string, reason: string) => {
    const response = await apiClient.put<ApiResponse<Vendor>>(`/vendor/${id}/reject`, { reason });
    return response.data;
  },

  activate: async (id: string) => {
    const response = await apiClient.put<ApiResponse<Vendor>>(`/vendor/${id}/activate`);
    return response.data;
  },

  suspend: async (id: string) => {
    const response = await apiClient.put<ApiResponse<Vendor>>(`/vendor/${id}/suspend`);
    return response.data;
  },

  getProfile: async (vendorId: string) => {
    const response = await apiClient.get<ApiResponse<VendorProfile>>(`/vendor/${vendorId}/profile`);
    return response.data;
  },

  createProfile: async (data: Partial<VendorProfile> | FormData) => {
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' },
    } : {};
    const response = await apiClient.post<ApiResponse<VendorProfile>>('/vendor/profile', data, config);
    return response.data;
  },

  updateProfile: async (id: string, data: Partial<VendorProfile> | FormData) => {
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' },
    } : {};
    const response = await apiClient.put<ApiResponse<VendorProfile>>(`/vendor/profile/${id}`, data, config);
    return response.data;
  },

  // Vendor Profile Files Management
  uploadProfileFile: async (profileId: string, file: File, fileType: string, caption?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);
    if (caption) formData.append('caption', caption);

    const response = await apiClient.post<ApiResponse<VendorProfileFile>>(
      `/vendor/profile/${profileId}/files`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  deleteProfileFile: async (profileId: string, fileId: string) => {
    const response = await apiClient.delete<ApiResponse>(`/vendor/profile/${profileId}/files/${fileId}`);
    return response.data;
  },

  verifyProfileFile: async (profileId: string, fileId: string) => {
    const response = await apiClient.put<ApiResponse<VendorProfileFile>>(
      `/vendor/profile/${profileId}/files/${fileId}/verify`
    );
    return response.data;
  },

  rejectProfileFile: async (profileId: string, fileId: string, reason?: string) => {
    const response = await apiClient.put<ApiResponse<VendorProfileFile>>(
      `/vendor/profile/${profileId}/files/${fileId}/reject`,
      { reason }
    );
    return response.data;
  },

  getMyVendor: async () => {
    const response = await apiClient.get<ApiResponse<Vendor>>('/vendor/me');
    return response.data;
  },
};
