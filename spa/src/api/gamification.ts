import { apiClient as client } from './client';
import { LeaderboardUser, GamificationStats, Achievement } from '@/types';

export const gamificationApi = {
  getLeaderboard: async (limit: number = 10): Promise<LeaderboardUser[]> => {
    const response = await client.get(`/v1/gamification/leaderboard?limit=${limit}`);
    return response.data;
  },

  getUserStats: async (): Promise<GamificationStats> => {
    const response = await client.get('/v1/gamification/stats');
    return response.data;
  },

  getAllAchievements: async (): Promise<Achievement[]> => {
    const response = await client.get('/v1/gamification/achievements');
    return response.data;
  },
};
