import { apiClient } from './client';
import { User, ApiResponse, PaginatedResponse } from '../types';

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
}

export interface CreateUserRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export const usersApi = {
  getAll: async (params?: UserFilters) => {
    const response = await apiClient.get<PaginatedResponse<User>>('/users', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<User>>(`/user/${id}`);
    return response.data;
  },

  create: async (data: CreateUserRequest) => {
    const response = await apiClient.post<ApiResponse<User>>('/user', data);
    return response.data;
  },

  update: async (id: string, data: UpdateUserRequest) => {
    const response = await apiClient.put<ApiResponse<User>>(`/user/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse>(`/user/${id}`);
    return response.data;
  },
};
