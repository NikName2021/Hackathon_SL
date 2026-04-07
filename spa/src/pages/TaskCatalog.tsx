import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/api/client';
import { Task } from '@/types';
import { motion } from 'framer-motion';

export const TaskCatalog: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await apiClient.get<Task[]>('/tasks/');
        setTasks(response.data);
      } catch (error) {
        console.error('Failed to load tasks', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleApply = async (taskId: number) => {
    try {
      setApplyingId(taskId);
      await apiClient.post(`/tasks/${taskId}/apply`, { message: "Готов выполнить!" });
      // Remove applied task from the list or mark as applied
      setTasks(tasks.filter(t => t.id !== taskId));
      alert("Успешный отклик!");
    } catch (error: any) {
      alert(error.response?.data?.detail || "Ошибка при отклике");
    } finally {
      setApplyingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Доступные задачи</h1>
      
      {tasks.length === 0 ? (
        <Card className="text-center p-8 text-surface-500">
          Сейчас нет доступных задач. Возвращайтесь позже!
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map((task) => (
            <motion.div key={task.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-semibold px-2 py-1 bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 rounded-lg">
                      {task.category?.name || 'Без категории'}
                    </span>
                    <h3 className="text-xl font-bold mt-2">{task.title}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-green-600">+{task.points_reward} KP</span>
                  </div>
                </div>
                
                <p className="text-surface-600 dark:text-surface-400 mb-6 flex-1">
                  {task.description}
                </p>
                
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-surface-200 dark:border-white/10">
                  <div className="text-sm text-surface-500">
                    Автор: {task.owner?.full_name}
                  </div>
                  <Button 
                    onClick={() => handleApply(task.id)}
                    isLoading={applyingId === task.id}
                  >
                    Откликнуться
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
