import { apiClient } from './client';
import { ApiResponse, LoginRequest, RegisterRequest, User } from '../types';

export const authApi = {
  login: async (data: LoginRequest) => {
    const response = await apiClient.post<ApiResponse<{ token: string }>>('/user/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest) => {
    const response = await apiClient.post<ApiResponse<User>>('/user/register', data);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post<ApiResponse>('/user/logout');
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get<ApiResponse<User>>('/user');
    return response.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await apiClient.put<ApiResponse<User>>('/user', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.put<ApiResponse>('/user/change/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};
