import React from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {
  X, 
  CalendarDays, 
  Award, 
  Tag, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle, 
  Paperclip, 
  Download,
  FileText,
  Shield
} from 'lucide-react';
import {Button} from '@/components/ui/Button';
import type {Task} from '@/types';

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (task: Task) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onClose,
  onApply
}) => {
  if (!task) return null;

  const formatDeadline = (value?: string) => {
    if (!value) return 'Без дедлайна';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Без дедлайна' : date.toLocaleString('ru-RU');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-surface-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-6 text-white shrink-0 relative">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] uppercase tracking-widest font-black px-2 py-1 bg-white/20 rounded-lg">
                  {task.category?.name || 'Общее'}
                </span>
              </div>
              <h2 className="text-2xl font-black italic leading-tight">
                {task.title}
              </h2>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100/50 dark:border-primary-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary-600" />
                    <span className="text-sm font-bold text-primary-900 dark:text-primary-100">Награда:</span>
                  </div>
                  <span className="text-lg font-black text-primary-600">+{task.points_reward} KP</span>
                </div>
                
                <div className="p-4 bg-surface-50 dark:bg-white/5 rounded-2xl border border-surface-200/50 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <CalendarDays className="w-5 h-5" />
                    <span className="text-sm font-bold">Дедлайн:</span>
                  </div>
                  <span className="text-sm font-bold text-surface-900 dark:text-white">
                    {formatDeadline(task.deadline)}
                  </span>
                </div>
              </div>

              {/* Description */}
              <section className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-surface-400 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Описание задачи
                </h3>
                <div className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed bg-surface-50/50 dark:bg-white/5 p-4 rounded-2xl">
                  {task.description || 'Описание отсутствует.'}
                </div>
              </section>

              {/* Acceptance Criteria */}
              {task.acceptance_criteria && (
                <section className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary-500 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Критерии приемки
                  </h3>
                  <div className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed bg-primary-50/20 dark:bg-primary-900/5 p-4 rounded-2xl border border-primary-500/10">
                    {task.acceptance_criteria}
                  </div>
                </section>
              )}

              {/* Performer Requirements */}
              {task.performer_requirements && (
                <section className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Требования к исполнителю
                  </h3>
                  <div className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed bg-orange-50/20 dark:bg-orange-900/5 p-4 rounded-2xl border border-orange-500/10 whitespace-pre-wrap">
                    {task.performer_requirements}
                  </div>
                </section>
              )}

              {/* Skills */}
              {task.skills && task.skills.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-surface-400 flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Требуемые навыки
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {task.skills.map((skill) => (
                      <span
                        key={skill.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/10 border border-surface-200 dark:border-white/10 rounded-xl text-xs font-bold text-surface-700 dark:text-surface-300 shadow-sm"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Attachments */}
              {task.attachments && task.attachments.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-surface-400 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" /> Вложения ({task.attachments.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {task.attachments.map((file) => (
                      <a 
                        key={file.id} 
                        href={file.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-white/5 border border-surface-200 dark:border-white/10 rounded-xl hover:border-primary-500 transition-all group"
                      >
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Paperclip className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-surface-900 dark:text-white truncate">{file.filename}</div>
                          <div className="text-[10px] text-surface-500 uppercase font-black">{file.file_type || 'file'}</div>
                        </div>
                        <Download className="w-4 h-4 text-surface-400 hover:text-primary-500" />
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Owner Info */}
              <section className="pt-6 border-t border-surface-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-800 flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-surface-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-surface-900 dark:text-white">{task.owner?.full_name}</h4>
                    <p className="text-xs text-surface-500">Заказчик • {task.owner?.email}</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-surface-100 dark:border-white/5 bg-surface-50/50 dark:bg-white/5 shrink-0 flex gap-3">
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="flex-1 h-12 rounded-2xl font-bold"
              >
                Закрыть
              </Button>
              <Button 
                variant="primary" 
                onClick={() => onApply(task)}
                className="flex-[2] h-12 rounded-2xl font-bold shadow-lg shadow-primary-600/20"
              >
                Откликнуться на задачу
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
