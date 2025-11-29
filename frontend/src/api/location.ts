import { apiClient } from './client';
import { ApiResponse } from '../types';

export interface LocationItem {
  code: string;
  name: string;
}

export const locationApi = {
  getProvinces: async () => {
    const response = await apiClient.get<ApiResponse<LocationItem[]>>('/province');
    return response.data;
  },

  getCities: async (provinceCode: string) => {
    const response = await apiClient.get<ApiResponse<LocationItem[]>>('/city', {
      params: { pro: provinceCode }
    });
    return response.data;
  },

  getDistricts: async (provinceCode: string, cityCode: string) => {
    const response = await apiClient.get<ApiResponse<LocationItem[]>>('/district', {
      params: { pro: provinceCode, kab: cityCode }
    });
    return response.data;
  },
};
