import React, {useEffect, useState} from 'react';
import {Card} from '@/components/ui/Card';
import {apiClient} from '@/api/client';
import type {AdminStats} from '@/types';
import {motion} from 'framer-motion';

export const AdminPanel: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get<AdminStats>('/admin/analytics');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to load stats', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-6">Панель управления платформой</h1>
      
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
              <h3 className="text-sm font-medium text-surface-600 dark:text-surface-400">Всего пользователей</h3>
              <div className="text-4xl font-bold text-blue-600 mt-2">{stats.total_users}</div>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <h3 className="text-sm font-medium text-surface-600 dark:text-surface-400">Всего создано задач</h3>
              <div className="text-4xl font-bold text-purple-600 mt-2">{stats.total_tasks}</div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
              <h3 className="text-sm font-medium text-surface-600 dark:text-surface-400">Задачи на модерации</h3>
              <div className="text-4xl font-bold text-orange-600 mt-2">{stats.pending_tasks}</div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <h3 className="text-sm font-medium text-surface-600 dark:text-surface-400">Выдано студентам KP</h3>
              <div className="text-4xl font-bold text-green-600 mt-2">{stats.total_points_awarded}</div>
            </Card>
          </motion.div>
        </div>
      ) : (
        <Card className="text-center p-8 text-red-500">
          Не удалось загрузить статистику. Разрешено только администраторам.
        </Card>
      )}
    </div>
  );
};
