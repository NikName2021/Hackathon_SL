import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { apiClient } from '@/api/client';

interface SubmissionModalProps {
  taskId: number;
  taskTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
  taskId,
  taskTitle,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post(`/tasks/${taskId}/submit`, { content });
      onSuccess();
      onClose();
      setContent('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при отправке работы');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg z-10"
          >
            <Card className="p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Сдача работы</h2>
                  <p className="text-sm text-surface-500">{taskTitle}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    Результат выполнения
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Опишите результат, приложите ссылки на Google Drive/GitHub и т.д."
                    className="w-full h-40 px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white/50 dark:bg-surface-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                    required
                  />
                  <p className="text-xs text-surface-500">
                    Максимально подробно опишите что было сделано, чтобы сотрудник быстрее проверил работу.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-100 text-red-600 text-sm rounded-xl border border-red-200">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    className="flex-[2]"
                    isLoading={isSubmitting}
                    leftIcon={<Send className="w-4 h-4" />}
                  >
                    Отправить на проверку
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
