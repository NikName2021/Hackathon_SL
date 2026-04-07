import { apiClient } from './client';
import { User } from '../types';

export const userApi = {
  updateProfile: (data: { full_name?: string; bio?: string }) => 
    apiClient.patch<User>('/auth/profile', data),
    
  updateSkills: (skills: string[]) => 
    apiClient.post<User>('/auth/profile/skills', skills),
    
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<User>('/auth/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  uploadResume: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<User>('/auth/profile/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};
