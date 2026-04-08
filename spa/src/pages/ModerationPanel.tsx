import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/api/client';
import { Task, Skill, TaskAttachment } from '@/types';
import { 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Eye, 
  ChevronDown, 
  ChevronRight, 
  Tag, 
  Paperclip, 
  Download 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ModerationPanel: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

  const toggleExpand = (taskId: number) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

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
                        <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center shrink-0">
                          <Eye className="w-6 h-6 text-primary-600" />
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
                          <div className="flex items-center gap-4 mt-2 text-sm font-bold text-primary-600">
                            Награда: {task.points_reward} KP
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-3 justify-end shrink-0 self-center">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleModeration(task.id, true)}
                          isLoading={isProcessing === task.id}
                          variant="primary"
                          size="sm"
                          leftIcon={<CheckCircle className="w-4 h-4" />}
                          className="flex-1 px-4"
                        >
                          Одобрить
                        </Button>
                        <Button
                          onClick={() => handleModeration(task.id, false)}
                          isLoading={isProcessing === task.id}
                          variant="outline"
                          size="sm"
                          leftIcon={<XCircle className="w-4 h-4" />}
                          className="flex-1 px-4 text-red-500 border-red-200 hover:bg-red-50"
                        >
                          Отклонить
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-white/5"
                          onClick={() => toggleExpand(task.id)}
                        >
                          {expandedTaskId === task.id ? <ChevronDown className="w-5 h-5 transition-transform rotate-180" /> : <ChevronRight className="w-5 h-5" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedTaskId === task.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pt-6 mt-6 border-t border-surface-100 dark:border-white/5 space-y-6">
                          {/* Description Section */}
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-surface-400 mb-2">Описание задачи</h4>
                            <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">
                              {task.description}
                            </p>
                          </div>

                          {/* Skills Section */}
                          {task.skills && task.skills.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-surface-400 mb-2">Требуемые навыки</h4>
                              <div className="flex flex-wrap gap-2">
                                {task.skills.map((skill: Skill) => (
                                  <span key={skill.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-50 dark:bg-white/5 rounded-lg border border-surface-100 dark:border-white/10 text-xs font-medium text-surface-600 dark:text-surface-400">
                                    <Tag className="w-3 h-3" />
                                    {skill.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Attachments Section */}
                          {task.attachments && task.attachments.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-surface-400 mb-2">Вложения</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {task.attachments.map((file: TaskAttachment) => (
                                  <a 
                                    key={file.id} 
                                    href={file.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-white dark:bg-white/5 border border-surface-200 dark:border-white/10 rounded-xl hover:border-primary-500/50 transition-colors group"
                                  >
                                    <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                      <Paperclip className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-bold text-surface-900 dark:text-white truncate">{file.filename}</div>
                                      <div className="text-[10px] text-surface-400 uppercase tracking-tighter">{file.file_type}</div>
                                    </div>
                                    <Download className="w-4 h-4 text-surface-300 group-hover:text-primary-500 transition-colors" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
