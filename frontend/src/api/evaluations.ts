import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, Evaluation, EvaluationPhoto } from '../types';

export const evaluationsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Evaluation>>('/evaluations', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Evaluation>>(`/evaluation/${id}`);
    return response.data;
  },

  create: async (data: Partial<Evaluation> | FormData) => {
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' },
    } : {};
    const response = await apiClient.post<ApiResponse<Evaluation>>('/evaluation', data, config);
    return response.data;
  },

  update: async (id: string, data: Partial<Evaluation> | FormData) => {
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' },
    } : {};
    const response = await apiClient.put<ApiResponse<Evaluation>>(`/evaluation/${id}`, data, config);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse>(`/evaluation/${id}`);
    return response.data;
  },

  // Evaluation Photos Management
  uploadPhoto: async (evaluationId: string, file: File, review?: string, rating?: number) => {
    const formData = new FormData();
    formData.append('photo', file);
    if (review) formData.append('review', review);
    if (rating) formData.append('rating', rating.toString());

    const response = await apiClient.post<ApiResponse<EvaluationPhoto>>(
      `/evaluation/${evaluationId}/photos`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  updatePhoto: async (evaluationId: string, photoId: string, review?: string, rating?: number) => {
    const response = await apiClient.put<ApiResponse<EvaluationPhoto>>(
      `/evaluation/${evaluationId}/photos/${photoId}`,
      { review, rating }
    );
    return response.data;
  },

  deletePhoto: async (evaluationId: string, photoId: string) => {
    const response = await apiClient.delete<ApiResponse>(`/evaluation/${evaluationId}/photos/${photoId}`);
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
