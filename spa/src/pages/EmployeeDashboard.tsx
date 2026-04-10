import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/api/client';
import type { DashboardStats, Activity } from '@/types';
import { 
  PlusCircle, 
  Users, 
  FileCheck, 
  Layout, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const EmployeeDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          apiClient.get<DashboardStats>('/tasks/stats'),
          apiClient.get<Activity[]>('/tasks/activity?limit=5')
        ]);
        setStats(statsRes.data);
        setActivities(activityRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
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

  const statCards = [
    {
      title: 'Отклики',
      value: stats?.pending_applications || 0,
      description: 'Ожидают вашего решения',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      link: '/applications'
    },
    {
      title: 'На проверке',
      value: stats?.pending_reviews || 0,
      description: 'Нужно проверить работу',
      icon: FileCheck,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      link: '/reviews'
    },
    {
      title: 'Мои задачи',
      value: stats?.active_tasks || 0,
      description: 'Всего активных проектов',
      icon: Layout,
      color: 'text-primary-600',
      bg: 'bg-primary-50 dark:bg-primary-900/20',
      link: '/tasks/my'
    },
    {
      title: 'Завершено',
      value: stats?.completed_tasks || 0,
      description: 'Успешно закрытые задачи',
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      link: '/tasks/my'
    }
  ];

  const getActivityInfo = (activity: Activity) => {
    const actorName = activity.actor?.full_name || 'Студент';
    const taskTitle = activity.task?.title || 'задача';

    switch (activity.activity_type) {
      case 'task_created':
        return {
          icon: <PlusCircle className="w-4 h-4 text-primary-500" />,
          text: `Вы создали задачу "${taskTitle}"`,
          color: 'bg-primary-50 dark:bg-primary-900/10'
        };
      case 'task_approved':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
          text: `Задача "${taskTitle}" одобрена модератором и теперь видна всем`,
          color: 'bg-green-50 dark:bg-green-900/10'
        };
      case 'task_rejected':
        return {
          icon: <AlertCircle className="w-4 h-4 text-red-500" />,
          text: `Задача "${taskTitle}" отклонена: ${activity.content}`,
          color: 'bg-red-50 dark:bg-red-900/10'
        };
      case 'new_application':
        return {
          icon: <Users className="w-4 h-4 text-blue-500" />,
          text: `${actorName} откликнулся на вашу задачу "${taskTitle}"`,
          color: 'bg-blue-50 dark:bg-blue-900/10'
        };
      case 'work_submitted':
        return {
          icon: <FileCheck className="w-4 h-4 text-yellow-500" />,
          text: `${actorName} представил решение по задаче "${taskTitle}"`,
          color: 'bg-yellow-50 dark:bg-yellow-900/10'
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 text-surface-400" />,
          text: `Новое событие в системе`,
          color: 'bg-surface-50 dark:bg-surface-800'
        };
    }
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight">
            Панель сотрудника
          </h1>
          <p className="text-surface-500 mt-2 text-lg">
            Управляйте задачами и взаимодействуйте со студентами
          </p>
        </div>
        <Link to="/tasks/new">
          <Button 
            size="lg" 
            className="shadow-xl shadow-primary-500/20 h-14 px-8 text-lg font-bold"
            leftIcon={<PlusCircle className="w-6 h-6" />}
          >
            Создать задачу
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={card.link}>
              <Card className="p-6 hover:shadow-2xl hover:-translate-y-1 transition-all group cursor-pointer border-none bg-white dark:bg-surface-900/50 backdrop-blur-xl">
                <div className="flex justify-between items-start mb-4">
                  <div className={`${card.bg} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                    <card.icon className={`w-8 h-8 ${card.color}`} />
                  </div>
                  <TrendingUp className="w-5 h-5 text-surface-300 group-hover:text-primary-500 transition-colors" />
                </div>
                <div className="text-3xl font-black text-surface-900 dark:text-white mb-1">
                  {card.value}
                </div>
                <div className="text-sm font-bold text-surface-400 group-hover:text-surface-600 dark:group-hover:text-surface-200 transition-colors">
                  {card.title}
                </div>
                <p className="text-xs text-surface-500 mt-2">
                  {card.description}
                </p>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity / Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-500" />
            Недавняя активность
          </h3>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity, index) => {
                const info = getActivityInfo(activity);
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-4 p-4 rounded-2xl hover:bg-surface-50 dark:hover:bg-white/5 transition-colors group"
                  >
                    <div className={`${info.color} p-2.5 rounded-xl group-hover:scale-110 transition-transform`}>
                      {info.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-surface-900 dark:text-white leading-snug">
                        {info.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <>
                <div className="flex items-center gap-4 text-sm text-surface-500 italic pb-4 border-b border-surface-100 dark:border-surface-800">
                  <AlertCircle className="w-4 h-4" />
                  История активности будет доступна после выполнения первых действий.
                </div>
                <div className="bg-surface-50 dark:bg-surface-800/50 rounded-2xl p-6 text-center">
                  <p className="text-surface-500 text-sm">
                    Здесь будет отображаться список последних откликов и изменений статусов ваших задач.
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        <Card className="p-8 bg-primary-600 text-white border-none shadow-2xl shadow-primary-500/30 overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-4">Советы по работе</h3>
            <ul className="space-y-4 text-sm text-primary-50/80">
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-primary-200" />
                <span>Четкое описание задачи привлекает больше студентов</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-primary-200" />
                <span>Выбирайте студентов с высокой репутацией для критических задач</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-primary-200" />
                <span>Давайте подробную обратную связь для профессионального роста</span>
              </li>
            </ul>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </Card>
      </div>
    </div>
  );
};
