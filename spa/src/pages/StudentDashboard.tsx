import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { apiClient } from '@/api/client';
import type { DashboardStats, Task } from '@/types';
import { Trophy, Clock, CheckCircle2, ArrowRight, Zap, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RecommendationSection } from '@/components/RecommendationSection';

export const StudentDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          apiClient.get<DashboardStats>('/tasks/stats'),
          apiClient.get<Task[]>('/tasks/my')
        ]);
        setStats(statsRes.data);
        setRecentTasks(tasksRes.data.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Активные задачи', value: stats?.active_tasks || 0, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'На проверке', value: stats?.pending_reviews || 0, icon: Target, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { label: 'Всего заработано', value: `${stats?.total_points || 0} KP`, icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-purple-600 p-8 text-white shadow-xl shadow-primary-600/20">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Привет, Студент! 👋</h1>
          <p className="text-primary-100 max-w-xl">
            Твои навыки ценятся. Выполняй задачи, зарабатывай очки репутации и обменивай их на реальные бонусы университета.
          </p>
        </div>
        <Zap className="absolute right-[-20px] top-[-20px] w-64 h-64 text-white/10 rotate-12" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="hover:scale-[1.02] transition-transform cursor-pointer overflow-hidden border-none shadow-lg dark:bg-surface-800/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className={`${stat.bg} p-3 rounded-2xl`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-500 dark:text-surface-400">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Recent Tasks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-500" />
              Текущие задачи
            </h2>
            <Link to="/tasks/my" className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center gap-1">
              Все задачи <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentTasks.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-2 flex flex-col items-center">
                <p className="text-surface-500 mb-4">У вас пока нет активных задач.</p>
                <Link to="/tasks">
                  <Button variant="outline" size="sm">Найти задачу</Button>
                </Link>
              </Card>
            ) : (
              recentTasks.map((task) => (
                <Card key={task.id} className="p-4 hover:border-primary-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-surface-900 dark:text-white truncate max-w-[200px]">{task.title}</h4>
                        <p className="text-xs text-surface-500">{task.category?.name}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-primary-600">+{task.points_reward} KP</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="space-y-4">
          <RecommendationSection />
          
          <div className="mt-10 pt-10 border-t border-gray-100 italic text-gray-400 text-sm">
             <p>Подсказка: Чем больше навыков указано в вашем профиле, тем точнее система подбирает задачи.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
