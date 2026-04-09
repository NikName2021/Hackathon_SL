import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/api/client';
import type { Task, Skill, TaskAttachment } from '@/types';
import { 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Eye, 
  ChevronDown, 
  ChevronRight, 
  Tag, 
  Paperclip, 
  Download,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const REJECTION_REASONS = [
  "Недостаточное описание задачи",
  "Награда не соответствует сложности",
  "Некорректно выбрана категория",
  "Неприемлемый контент",
  "Другое"
];

const RejectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isProcessing: boolean;
}> = ({ isOpen, onClose, onConfirm, isProcessing }) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    const finalReason = selectedReason === "Другое" ? customReason : selectedReason;
    if (finalReason.trim()) {
      onConfirm(finalReason);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <Card className="p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-4 text-red-500 mb-2">
            <XCircle className="w-8 h-8" />
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Отклонение задачи</h2>
          </div>
          
          <p className="text-surface-500">Укажите причину отклонения. Заказчик увидит этот комментарий и сможет внести исправления.</p>
          
          <div className="space-y-3">
            <label className="text-sm font-bold text-surface-400 uppercase">Выберите критерий</label>
            <div className="grid grid-cols-1 gap-2">
              {REJECTION_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`text-left px-4 py-3 rounded-xl border transition-all ${
                    selectedReason === reason 
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-bold" 
                      : "border-surface-200 dark:border-white/10 hover:bg-surface-50 dark:hover:bg-white/5"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {selectedReason === "Другое" && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <Input 
                autoFocus
                placeholder="Опишите причину подробно..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            </motion.div>
          )}

          <div className="flex gap-3 pt-4 border-t border-surface-100 dark:border-white/5">
            <Button variant="ghost" onClick={onClose} className="flex-1">Отмена</Button>
            <Button 
              variant="primary" 
              onClick={handleConfirm} 
              className="flex-1 bg-red-600 hover:bg-red-700"
              isLoading={isProcessing}
              disabled={!selectedReason || (selectedReason === "Другое" && !customReason.trim())}
            >
              Отклонить задачу
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export const ModerationPanel: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [taskToReject, setTaskToReject] = useState<number | null>(null);

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

  const handleApprove = async (taskId: number) => {
    setIsProcessing(taskId);
    try {
      await apiClient.post(`/tasks/${taskId}/approve`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Approval failed:', error);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (taskId: number, reason: string) => {
    setIsProcessing(taskId);
    try {
      await apiClient.post(`/tasks/${taskId}/reject`, { reason });
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setRejectionModalOpen(false);
      setTaskToReject(null);
    } catch (error) {
      console.error('Rejection failed:', error);
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
                          onClick={() => handleApprove(task.id)}
                          isLoading={isProcessing === task.id}
                          variant="primary"
                          size="sm"
                          leftIcon={<CheckCircle className="w-4 h-4" />}
                          className="flex-1 px-4"
                        >
                          Одобрить
                        </Button>
                        <Button
                          onClick={() => {
                            setTaskToReject(task.id);
                            setRejectionModalOpen(true);
                          }}
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

      <RejectionModal 
        isOpen={rejectionModalOpen}
        onClose={() => {
          setRejectionModalOpen(false);
          setTaskToReject(null);
        }}
        onConfirm={(reason) => {
          if (taskToReject) handleReject(taskToReject, reason);
        }}
        isProcessing={isProcessing !== null}
      />
    </div>
  );
};
