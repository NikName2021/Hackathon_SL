import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { apiClient } from '@/api/client';
import { DashboardStats } from '@/types';
import { Plus, Users, FileCheck, Award, ArrowRight, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EmployeeDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get<DashboardStats>('/tasks/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch employee stats:', error);
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

  const cards = [
    { 
      label: 'Новые отклики', 
      value: stats?.pending_applications || 0, 
      icon: Users, 
      color: 'text-blue-600', 
      path: '/applications',
      desc: 'Студенты ждут вашего решения'
    },
    { 
      label: 'На проверке', 
      value: stats?.pending_reviews || 0, 
      icon: FileCheck, 
      color: 'text-yellow-600', 
      path: '/reviews',
      desc: 'Выполненные работы'
    },
    { 
      label: 'Активные задачи', 
      value: stats?.active_tasks || 0, 
      icon: BarChart3, 
      color: 'text-primary-600', 
      path: '/tasks/my',
      desc: 'Задачи в процессе выполнения'
    },
  ];

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Панель сотрудника</h1>
          <p className="text-surface-500 mt-1">Управляйте задачами и проверяйте результаты студентов</p>
        </div>
        <Link to="/tasks/new">
          <Button leftIcon={<Plus className="w-5 h-5" />} className="h-12 px-8 shadow-xl shadow-primary-600/20">
            Создать задачу
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {cards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link to={card.path}>
              <Card className="h-full hover:border-primary-500/50 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-surface-50 dark:bg-surface-800 group-hover:scale-110 transition-transform`}>
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <ArrowRight className="w-5 h-5 text-surface-300 group-hover:text-primary-500 transition-colors" />
                </div>
                <h3 className="text-sm font-medium text-surface-500 dark:text-surface-400">{card.label}</h3>
                <p className="text-3xl font-bold text-surface-900 dark:text-white mt-1">{card.value}</p>
                <p className="text-xs text-surface-400 mt-2">{card.desc}</p>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Card className="p-8 bg-gradient-to-br from-primary-600 to-primary-800 text-white border-none shadow-2xl">
          <Award className="w-12 h-12 text-primary-200 mb-6" />
          <h2 className="text-2xl font-bold mb-3">Готовы расширить команду?</h2>
          <p className="text-primary-100 mb-8 leading-relaxed">
            Чем подробнее вы опишете задачу и критерии оценки, тем качественнее будет результат. Используйте форматирование и прикрепляйте примеры.
          </p>
          <Link to="/tasks/new">
            <Button variant="secondary" className="w-full bg-white text-primary-700 hover:bg-primary-50">
              Добавить новое задание
            </Button>
          </Link>
        </Card>

        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-primary-500" />
            Последние активности
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm">Получен новый отклик на "Разработка API"</span>
              </div>
              <span className="text-xs text-surface-400">10 мин назад</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-sm">Работа по "Тестирование UI" сдана на проверку</span>
              </div>
              <span className="text-xs text-surface-400">2 часа назад</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
