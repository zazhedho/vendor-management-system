import { apiClient } from './client';
import { Menu, ApiResponse, PaginatedResponse } from '../types';

export const menusApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Menu>>('/menus', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Menu>>(`/menu/${id}`);
    return response.data;
  },

  create: async (data: Partial<Menu>) => {
    const response = await apiClient.post<ApiResponse<Menu>>('/menu', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Menu>) => {
    const response = await apiClient.put<ApiResponse<Menu>>(`/menu/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse>(`/menu/${id}`);
    return response.data;
  },

  getMyMenus: async () => {
    const response = await apiClient.get<ApiResponse<Menu[]>>('/user/menus');
    return response.data;
  },
};
