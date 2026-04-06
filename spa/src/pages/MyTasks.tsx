import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/api/client';
import { Task } from '@/types';
import { Clock, CheckCircle2, ChevronRight, FileText, LayoutList } from 'lucide-react';
import { motion } from 'framer-motion';
import { SubmissionModal } from '@/components/SubmissionModal';

export const MyTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMyTasks = async () => {
    try {
      const response = await apiClient.get<Task[]>('/tasks/my');
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch my tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const openSubmission = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
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
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Мои задачи</h1>
          <p className="text-surface-500 mt-1">Задачи, на которые вы были утверждены и сейчас выполняете</p>
        </div>
        <LayoutList className="w-10 h-10 text-primary-500/20" />
      </div>

      {tasks.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="text-xl font-semibold text-surface-900 dark:text-white">У вас пока нет активных задач</h3>
          <p className="text-surface-500 mt-2 max-w-sm">
            Откликнитесь на интересные предложения в каталоге задач, и как только сотрудник одобрит вашу кандидатуру, они появятся здесь.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => window.location.href = '/tasks'}>
            Перейти в каталог
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:border-primary-500/50 transition-all p-5 group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded">
                          {task.category?.name || 'Общее'}
                        </span>
                        <span className="text-xs text-surface-400">
                          ID: #{task.id}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-surface-900 dark:text-white group-hover:text-primary-600 transition-colors">
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-surface-500">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span>Награжда: {task.points_reward} очков</span>
                        </div>
                        {task.deadline && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Дедлайн: {new Date(task.deadline).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {task.status === 'review' ? (
                      <div className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-xl text-sm font-medium border border-yellow-200 dark:border-yellow-800">
                        На проверке
                      </div>
                    ) : (
                      <Button
                        onClick={() => openSubmission(task)}
                        variant="primary"
                        leftIcon={<FileText className="w-4 h-4" />}
                      >
                        Сдать работу
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="hidden md:flex">
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {selectedTask && (
        <SubmissionModal
          taskId={selectedTask.id}
          taskTitle={selectedTask.title}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchMyTasks}
        />
      )}
    </div>
  );
};
