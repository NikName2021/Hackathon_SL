import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { apiClient } from '@/api/client';
import type { DashboardStats } from '@/types';
import { ShieldCheck, Users, Briefcase, Activity, AlertCircle, TrendingUp, BarChart3, Settings, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get<DashboardStats>('/tasks/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const systemStats = [
    { label: 'Ожидают модерации', value: stats?.pending_moderation || 0, icon: AlertCircle, color: 'text-red-500', path: '/moderation' },
    { label: 'Активные задачи', value: stats?.active_tasks || 0, icon: Briefcase, color: 'text-blue-500', path: '/tasks' },
    { label: 'Выполнено работ', value: stats?.completed_tasks || 0, icon: ShieldCheck, color: 'text-green-500', path: '/admin' },
  ];

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary-600" />
            Панель администратора
          </h1>
          <p className="text-surface-500 mt-1">Глобальный мониторинг и управление ресурсами платформы</p>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/tasks/new">
            <Button leftIcon={<Plus className="w-5 h-5" />} className="h-12 px-6">
              Создать задачу
            </Button>
          </Link>
          <Link to="/moderation">
            <Card className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 flex items-center gap-2 cursor-pointer hover:border-red-300">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-bold text-red-600">{stats?.pending_moderation} задачи на проверку</span>
            </Card>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {systemStats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link to={stat.path}>
              <Card className="hover:border-primary-500/50 transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-4 rounded-2xl bg-surface-50 dark:bg-surface-800 group-hover:bg-primary-50 transition-colors`}>
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                  <BarChart3 className="w-5 h-5 text-surface-300 group-hover:text-primary-500 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-500 dark:text-surface-400">{stat.label}</p>
                  <p className="text-4xl font-black text-surface-900 dark:text-white mt-1">{stat.value}</p>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            Активность системы
          </h2>
          <Card className="p-8 h-[300px] flex flex-col items-center justify-center border-dashed border-2 bg-surface-50/50">
            <TrendingUp className="w-12 h-12 text-surface-300 mb-4" />
            <p className="text-surface-500 font-medium">График активности будет доступен после накопления данных</p>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-500" />
            Быстрое управление
          </h2>
          <div className="grid gap-4">
            <Link to="/tasks/new" className="w-full">
              <Button className="w-full justify-between h-14 px-6">
                Создать задачу
                <Plus className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/moderation" className="w-full">
              <Button variant="outline" className="w-full justify-between h-14 px-6 border-red-100 text-red-600 hover:bg-red-50">
                Модерация задач
                <span className="bg-red-100 px-2 py-0.5 rounded text-xs">{stats?.pending_moderation}</span>
              </Button>
            </Link>
            <Link to="/admin" className="w-full">
              <Button variant="outline" className="w-full justify-between h-14 px-6">
                Все пользователи
                <Users className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
