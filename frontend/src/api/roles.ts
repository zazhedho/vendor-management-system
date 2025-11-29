import { apiClient } from './client';
import { Role, ApiResponse, PaginatedResponse } from '../types';

export const rolesApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Role>>('/roles', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Role>>(`/role/${id}`);
    return response.data;
  },

  create: async (data: Partial<Role>) => {
    const response = await apiClient.post<ApiResponse<Role>>('/role', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Role>) => {
    const response = await apiClient.put<ApiResponse<Role>>(`/role/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse>(`/role/${id}`);
    return response.data;
  },

  assignPermissions: async (roleId: string, permissionIds: string[]) => {
    const response = await apiClient.post<ApiResponse>(`/role/${roleId}/permissions`, {
      permission_ids: permissionIds,
    });
    return response.data;
  },

  assignMenus: async (roleId: string, menuIds: string[]) => {
    const response = await apiClient.post<ApiResponse>(`/role/${roleId}/menus`, {
      menu_ids: menuIds,
    });
    return response.data;
  },
};
