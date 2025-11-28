import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, Event, EventSubmission } from '../types';

export const eventsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Event>>('/events', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Event>>(`/event/${id}`);
    return response.data;
  },

  create: async (data: Partial<Event>) => {
    const response = await apiClient.post<ApiResponse<Event>>('/event', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Event>) => {
    const response = await apiClient.put<ApiResponse<Event>>(`/event/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse>(`/event/${id}`);
    return response.data;
  },

  submitPitch: async (eventId: string, data: { pitch_file_path: string; proposal_details?: string; additional_materials?: string }) => {
    const response = await apiClient.post<ApiResponse<EventSubmission>>(`/vendor/event/${eventId}/submit`, data);
    return response.data;
  },

  getMySubmissions: async () => {
    const response = await apiClient.get<ApiResponse<EventSubmission[]>>('/vendor/event/submissions');
    return response.data;
  },

  getSubmissions: async (eventId: string) => {
    const response = await apiClient.get<ApiResponse<EventSubmission[]>>(`/event/${eventId}/submissions`);
    return response.data;
  },

  scoreSubmission: async (submissionId: string, score: number, comments?: string) => {
    const response = await apiClient.put<ApiResponse<EventSubmission>>(`/event/submission/${submissionId}/score`, {
      score,
      comments,
    });
    return response.data;
  },

  shortlistSubmission: async (submissionId: string, isShortlisted: boolean) => {
    const response = await apiClient.put<ApiResponse<EventSubmission>>(`/event/submission/${submissionId}/shortlist`, {
      is_shortlisted: isShortlisted,
    });
    return response.data;
  },

  selectWinner: async (eventId: string, submissionId: string) => {
    const response = await apiClient.post<ApiResponse<Event>>(`/event/${eventId}/winner`, {
      submission_id: submissionId,
    });
    return response.data;
  },

  getResult: async (eventId: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/vendor/event/${eventId}/result`);
    return response.data;
  },

  getResultForAdmin: async (eventId: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/event/${eventId}/result`);
    return response.data;
  },
};
