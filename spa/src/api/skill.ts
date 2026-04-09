import { apiClient } from './client';
import type { Skill } from '@/types';

export const skillApi = {
  getAll: async () => {
    const response = await apiClient.get<Skill[]>('/skills/');
    return response.data;
  }
};
