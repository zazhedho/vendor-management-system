import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, Event, EventSubmission, EventFile, EventSubmissionFile } from '../types';

export const eventsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Event>>('/events', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Event>>(`/event/${id}`);
    return response.data;
  },

  create: async (data: Partial<Event> | FormData) => {
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' },
    } : {};
    const response = await apiClient.post<ApiResponse<Event>>('/event', data, config);
    return response.data;
  },

  update: async (id: string, data: Partial<Event> | FormData) => {
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' },
    } : {};
    const response = await apiClient.put<ApiResponse<Event>>(`/event/${id}`, data, config);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse>(`/event/${id}`);
    return response.data;
  },

  // Event Files Management
  uploadFile: async (eventId: string, file: File, fileType: string, caption?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);
    if (caption) formData.append('caption', caption);

    const response = await apiClient.post<ApiResponse<EventFile>>(
      `/event/${eventId}/files`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  deleteFile: async (eventId: string, fileId: string) => {
    const response = await apiClient.delete<ApiResponse>(`/event/${eventId}/files/${fileId}`);
    return response.data;
  },

  submitPitch: async (eventId: string, data: FormData) => {
    const response = await apiClient.post<ApiResponse<EventSubmission>>(
      `/vendor/event/${eventId}/submit`,
      data,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  // Event Submission Files Management
  uploadSubmissionFile: async (submissionId: string, file: File, fileType: string, caption?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);
    if (caption) formData.append('caption', caption);

    const response = await apiClient.post<ApiResponse<EventSubmissionFile>>(
      `/event/submission/${submissionId}/files`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  deleteSubmissionFile: async (submissionId: string, fileId: string) => {
    const response = await apiClient.delete<ApiResponse>(`/event/submission/${submissionId}/files/${fileId}`);
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

  getAllSubmissions: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<PaginatedResponse<EventSubmission>>('/event/submissions', { params });
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
