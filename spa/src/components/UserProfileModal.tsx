import React from 'react';
import { 
  X, 
  Award, 
  Star, 
  FileText, 
  Download, 
  CheckCircle2, 
  Trophy,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User, Skill } from '@/types';
import { Button } from '@/components/ui/Button';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: User | null;
}

export const UserProfileModal: React.FC<StudentProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  student: user 
}) => {
  if (!user) return null;

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-surface-900 rounded-3xl shadow-2xl overflow-hidden border border-surface-200 dark:border-surface-800"
          >
            {/* Header / Hero */}
            <div className="relative h-32 bg-gradient-to-r from-primary-600 to-purple-700">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-8 pb-8 -mt-12 relative">
              <div className="flex flex-col sm:flex-row items-end gap-6 mb-8">
                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-surface-800 p-1 shadow-xl border border-surface-100 dark:border-surface-700">
                  <div className="w-full h-full rounded-xl bg-surface-50 dark:bg-surface-700 flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url.startsWith('http') ? user.avatar_url : `${baseUrl}${user.avatar_url}`} 
                        alt={user.full_name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-10 h-10 text-surface-300" />
                    )}
                  </div>
                </div>
                
                <div className="flex-1 space-y-1">
                  <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
                    {user.full_name}
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    <span className="flex items-center gap-1 text-sm font-bold text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2.5 py-1 rounded-lg">
                      <Trophy className="w-3.5 h-3.5" />
                      {user.reputation?.toFixed(1) || '0.0'} Репутация
                    </span>
                    <span className="flex items-center gap-1 text-sm font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1 rounded-lg">
                      <Award className="w-3.5 h-3.5" />
                      {user.points || 0} Очков
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-surface-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> О себе
                    </h3>
                    <p className="text-surface-600 dark:text-surface-300 leading-relaxed italic">
                      {user.bio || 'Пользователь еще не заполнил информацию о себе...'}
                    </p>
                  </div>

                  {user.resume_path && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-surface-400 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Резюме
                      </h3>
                      <a 
                        href={user.resume_path.startsWith('http') ? user.resume_path : `${baseUrl}${user.resume_path}`}
                        download
                        className="inline-flex items-center gap-2 px-4 py-2 bg-surface-50 dark:bg-surface-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-surface-700 dark:text-surface-200 border border-surface-200 dark:border-surface-700 rounded-xl transition-all group"
                      >
                        <Download className="w-4 h-4 text-primary-500" />
                        <span className="text-sm font-medium">Скачать PDF</span>
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-surface-400 flex items-center gap-2">
                      <Star className="w-4 h-4" /> Навыки
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {user.skills && user.skills.length > 0 ? (
                        user.skills.map((skill: Skill) => (
                          <span 
                            key={skill.id}
                            className="px-2.5 py-1 bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300 text-xs font-bold rounded-lg border border-surface-200 dark:border-surface-700 shadow-sm"
                          >
                            {skill.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-surface-400 italic">Навыки не указаны</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-surface-50 dark:bg-surface-800/30 border-t border-surface-100 dark:border-surface-800 flex justify-end">
              <Button onClick={onClose} variant="primary" className="px-8">
                Закрыть
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
