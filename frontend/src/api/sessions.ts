import { apiClient } from './client';
import { ApiResponse } from '../types';

export interface SessionInfo {
  session_id: string;
  device_info: string;
  ip: string;
  login_at: string;
  last_activity: string;
  is_current_session: boolean;
}

export interface SessionsResponse {
  sessions: SessionInfo[];
  total: number;
}

export const sessionsApi = {
  getActiveSessions: async () => {
    const response = await apiClient.get<ApiResponse<SessionsResponse>>('/user/sessions');
    return response.data;
  },

  revokeSession: async (sessionId: string) => {
    const response = await apiClient.delete<ApiResponse>(`/user/session/${sessionId}`);
    return response.data;
  },

  revokeAllOtherSessions: async () => {
    const response = await apiClient.post<ApiResponse>('/user/sessions/revoke-others');
    return response.data;
  },
};
