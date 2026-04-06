import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/api/client';
import { Task } from '@/types';
import { ShieldCheck, ShieldAlert, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ModerationPanel: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  const fetchPendingTasks = async () => {
    try {
      const response = await apiClient.get<Task[]>('/tasks/moderation/pending');
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch pending tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTasks();
  }, []);

  const handleModeration = async (taskId: number, approve: boolean) => {
    setIsProcessing(taskId);
    try {
      // In TaskService: approve_task moves it to OPEN, reject_task to CANCELLED
      const endpoint = approve ? `/tasks/${taskId}/approve` : `/tasks/${taskId}/reject`;
      // Note: We need to make sure these endpoints are exposed in the router!
      // Let's check routes first. Wait, I saw approve_task in TaskService but I need to check if it's in task.py router.
      await apiClient.post(endpoint);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Moderation failed:', error);
    } finally {
      setIsProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary-600" />
            Модерация задач
          </h1>
          <p className="text-surface-500 mt-1">Проверьте корректность новых задач перед публикацией</p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-surface-900 dark:text-white">Очередь модерации пуста</h3>
          <p className="text-surface-500 mt-2 max-w-sm">
            Все новые задачи проверены и опубликованы.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                          <Eye className="w-6 h-6 text-surface-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-surface-500 bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded">
                              {task.category?.name || 'Без категории'}
                            </span>
                            <span className="text-xs text-surface-400">
                              Автор: {task.owner.full_name}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                            {task.title}
                          </h3>
                          <div className="mt-2 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg text-sm text-surface-600 dark:text-surface-300">
                            {task.description}
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-sm font-bold text-primary-600">
                            Награда: {task.points_reward} очков
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-3 justify-end shrink-0 self-center">
                      <Button
                        onClick={() => handleModeration(task.id, true)}
                        isLoading={isProcessing === task.id}
                        variant="primary"
                        leftIcon={<CheckCircle className="w-4 h-4" />}
                        className="flex-1 md:w-full"
                      >
                        Одобрить
                      </Button>
                      <Button
                        onClick={() => handleModeration(task.id, false)}
                        isLoading={isProcessing === task.id}
                        variant="outline"
                        leftIcon={<XCircle className="w-4 h-4" />}
                        className="flex-1 md:w-full text-red-500 border-red-200 hover:bg-red-50"
                      >
                        Отклонить
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
