import React, {useEffect, useState} from 'react';
import {Card} from '@/components/ui/Card';
import {Button} from '@/components/ui/Button';
import {motion} from 'framer-motion';
import {apiClient} from '@/api/client';
import type {DashboardStats} from '@/types';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Briefcase,
  Plus,
  Settings,
  ShieldCheck,
  Users,
  LineChart
} from 'lucide-react';
import {Link} from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { AdminStats } from '@/types';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        const [dashRes, adminRes] = await Promise.all([
          apiClient.get<DashboardStats>('/tasks/stats'),
          apiClient.get<AdminStats>('/admin/analytics')
        ]);
        setStats(dashRes.data);
        setAdminStats(adminRes.data);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllStats();
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
          <Card className="p-6 h-[400px]">
            {adminStats?.activity_log && adminStats.activity_log.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={adminStats.activity_log}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888888', fontSize: 10 }}
                    tickFormatter={(str) => {
                      const date = new Date(str);
                      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                    }}
                    minTickGap={30}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888888', fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff'
                    }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ marginBottom: '8px', fontWeight: 'bold' }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    name="Регистрации"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    animationDuration={2000}
                  />
                  <Area
                    type="monotone"
                    dataKey="tasks"
                    name="Новые задачи"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTasks)"
                    animationDuration={2500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full border-dashed border-2 bg-surface-50/50 rounded-xl">
                <LineChart className="w-12 h-12 text-surface-300 mb-4" />
                <p className="text-surface-500 font-medium">График активности будет доступен после накопления данных</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-500" />
            Быстрое управление
          </h2>
          <div className="grid gap-4">
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
