import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, Evaluation, EvaluationPhoto } from '../types';

export const evaluationsApi = {
  // Get all evaluations (Admin)
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Evaluation>>('/evaluations', { params });
    return response.data;
  },

  // Get my evaluations (Vendor) with pagination
  getMyEvaluations: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Evaluation>>('/vendor/evaluations', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Evaluation>>(`/evaluation/${id}`);
    return response.data;
  },

  // Vendor creates evaluation for won & completed event
  create: async (data: { event_id: string; comments?: string }) => {
    const response = await apiClient.post<ApiResponse<Evaluation>>('/evaluation', data);
    return response.data;
  },

  update: async (id: string, data: { comments?: string }) => {
    const response = await apiClient.put<ApiResponse<Evaluation>>(`/evaluation/${id}`, data);
    return response.data;
  },

  // Vendor updates Google Drive link
  updateGoogleDriveUrl: async (id: string, google_drive_url: string) => {
    const response = await apiClient.put<ApiResponse<Evaluation>>(
      `/vendor/evaluation/${id}/drive-link`,
      { google_drive_url }
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse>(`/evaluation/${id}`);
    return response.data;
  },

  // Vendor uploads photo with caption only (no review/rating)
  uploadPhoto: async (evaluationId: string, file: File, caption?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) formData.append('caption', caption);

    const response = await apiClient.post<ApiResponse<EvaluationPhoto>>(
      `/evaluation/${evaluationId}/photo`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  // Client reviews and rates a photo (1-5 stars)
  reviewPhoto: async (photoId: string, review: string, rating: number) => {
    const response = await apiClient.put<ApiResponse<EvaluationPhoto>>(
      `/evaluation/photo/${photoId}/review`,
      { review, rating }
    );
    return response.data;
  },

  deletePhoto: async (photoId: string) => {
    const response = await apiClient.delete<ApiResponse>(`/evaluation/photo/${photoId}`);
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
