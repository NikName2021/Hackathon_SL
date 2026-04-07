import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/api/client';
import type { Task } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, FileText, User, MessageCircle, MessageSquare } from 'lucide-react';
import { ChatComponent } from '@/components/ChatComponent';

export const EmployeeReviews: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTask, setChatTask] = useState<Task | null>(null);

  const fetchReviews = async () => {
    try {
      // Get all employee tasks and filter for those in 'review' status
      const response = await apiClient.get<Task[]>('/tasks/my');
      setTasks(response.data.filter(t => t.status === 'review'));
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleReview = async (taskId: number, approve: boolean) => {
    setIsProcessing(taskId);
    try {
      await apiClient.post(`/tasks/${taskId}/review`, {
        is_approved: approve,
        feedback: approve 
          ? "Работа выполнена отлично! Очки начислены." 
          : "К сожалению, работа не принята. Пожалуйста, проверьте комментарии и исправьте ошибки."
      });
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Review submission failed:', error);
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
            <FileText className="w-8 h-8 text-primary-600" />
            Проверка работ
          </h1>
          <p className="text-surface-500 mt-1">Оцените результаты выполнения задач студентами</p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="text-xl font-semibold text-surface-900 dark:text-white">Нет работ для проверки</h3>
          <p className="text-surface-500 mt-2 max-w-sm">
            Как только студенты завершат выполнение ваших задач, они появятся здесь.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="overflow-hidden border-t-4 border-t-primary-500">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-6">
                        {/* Header Info */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-surface-900 dark:text-white">{task.title}</h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-surface-500">
                              <span className="bg-primary-50 dark:bg-primary-900/20 text-primary-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]">
                                {task.category?.name || 'Общее'}
                              </span>
                              <span>•</span>
                              <span className="font-bold text-primary-600">Награда: {task.points_reward} очков</span>
                            </div>
                          </div>
                        </div>

                        {/* Submission Content */}
                        <div className="bg-surface-50 dark:bg-surface-800/50 p-5 rounded-2xl border border-surface-100 dark:border-surface-800 relative">
                          <div className="absolute -top-3 left-4 px-3 py-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-full text-[10px] font-bold uppercase text-surface-400 flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" /> Результат студента
                          </div>
                          
                          <div className="prose prose-sm dark:prose-invert max-w-none text-surface-700 dark:text-surface-200 italic leading-relaxed">
                            {task.latest_submission?.content || "Текст работы не найден"}
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-xs text-surface-400">
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3" />
                              <span>Исполнитель ID: #{task.latest_submission?.student_id}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Сдано: {task.latest_submission?.submitted_at ? new Date(task.latest_submission.submitted_at).toLocaleString() : 'неизвестно'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-row md:flex-col gap-3 justify-end shrink-0 self-center">
                        <Button
                          onClick={() => {
                            setChatTask(task);
                            setIsChatOpen(true);
                          }}
                          variant="outline"
                          leftIcon={<MessageSquare className="w-4 h-4" />}
                          className="flex-1 md:w-full h-12"
                        >
                          Чат
                        </Button>
                        <Button
                          onClick={() => handleReview(task.id, true)}
                          isLoading={isProcessing === task.id}
                          variant="primary"
                          leftIcon={<CheckCircle2 className="w-4 h-4" />}
                          className="flex-1 md:w-full h-12"
                        >
                          Принять
                        </Button>
                        <Button
                          onClick={() => handleReview(task.id, false)}
                          isLoading={isProcessing === task.id}
                          variant="outline"
                          leftIcon={<XCircle className="w-4 h-4" />}
                          className="flex-1 md:w-full h-12 text-red-500 border-red-200 hover:bg-red-50"
                        >
                          На доработку
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {chatTask && (
        <ChatComponent
          taskId={chatTask.id}
          taskTitle={chatTask.title}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
};
