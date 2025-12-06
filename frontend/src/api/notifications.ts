import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, NotificationItem } from '../types';

export const notificationsApi = {
  getAll: async (params?: { page?: number; limit?: number; is_read?: boolean }) => {
    const response = await apiClient.get<PaginatedResponse<NotificationItem>>('/notifications', { params });
    return response.data;
  },

  markRead: async (ids?: string[]) => {
    const response = await apiClient.post<ApiResponse>('/notifications/mark-read', { ids: ids || [] });
    return response.data;
  },
};
