import React, {useEffect, useState} from 'react';
import {Card} from '@/components/ui/Card';
import {apiClient} from '@/api/client';
import type {AdminStats} from '@/types';
import {motion} from 'framer-motion';
import {Link} from 'react-router-dom';
import {BookOpenText} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
        <>
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Link to="/admin/faq">
                <Card className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-indigo-500/20 hover:border-indigo-500/40 transition-all cursor-pointer group h-full">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-medium text-surface-600 dark:text-surface-400">База знаний (FAQ)</h3>
                    <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500/30 transition-colors">
                      <BookOpenText className="w-4 h-4 text-indigo-600" />
                    </div>
                  </div>
                  <div className="text-xl font-bold text-indigo-600 mt-2">Управление</div>
                  <p className="text-[10px] text-surface-500 mt-1">Редактирование ролевых тем</p>
                </Card>
              </Link>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <Card className="p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-surface-900 dark:text-white">График активности</h2>
                  <p className="text-sm text-surface-500">Динамика за последние 15 дней</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Новые пользователи</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span>Новые задачи</span>
                  </div>
                </div>
              </div>

              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats.activity_log}
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
                      name="Пользователи"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                      animationDuration={2000}
                    />
                    <Area
                      type="monotone"
                      dataKey="tasks"
                      name="Задачи"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorTasks)"
                      animationDuration={2500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        </>
      ) : (
        <Card className="text-center p-8 text-red-500">
          Не удалось загрузить статистику. Разрешено только администраторам.
        </Card>
      )}
    </div>
  );
};
