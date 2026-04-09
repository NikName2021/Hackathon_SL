import React, {useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {AlertCircle, Award, FileText, Send, X, Users, UserPlus} from 'lucide-react';
import {Button} from '@/components/ui/Button';
import {apiClient} from '@/api/client';
import {useNotification} from '@/context/NotificationContext';

interface ApplicationModalProps {
  taskId: number;
  taskTitle: string;
  points: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (taskId: number) => void;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  taskId,
  taskTitle,
  points,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'apply' | 'team'>('apply');
  const [teamName, setTeamName] = useState('');
  const { showNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      showNotification('error', 'Пожалуйста, напишите сопроводительное письмо');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'apply') {
        await apiClient.post(`/tasks/${taskId}/apply`, { message });
        showNotification('success', 'Отклик успешно отправлен!');
      } else {
        await apiClient.post(`/teams/create/${taskId}`, { name: teamName });
        showNotification('success', 'Поиск соратников объявлен!');
      }
      onSuccess(taskId);
      onClose();
      setMessage('');
      setTeamName('');
    } catch (error: any) {
      const errorDetail = error.response?.data?.detail;
      const errorMessage = typeof errorDetail === 'string' 
        ? errorDetail 
        : (Array.isArray(errorDetail) ? errorDetail[0]?.msg : 'Ошибка при отправке отклика');
      
      showNotification('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
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
            className="relative w-full max-w-lg bg-white dark:bg-surface-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/10"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-6 text-white relative">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold italic">Отклик на задачу</h3>
              </div>
              <p className="text-primary-100 text-sm font-medium line-clamp-1 opacity-90">
                {taskTitle}
              </p>
            </div>

            <div className="flex border-b border-surface-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setMode('apply')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  mode === 'apply' 
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/30' 
                    : 'text-surface-400 hover:text-surface-600'
                }`}
              >
                <div className="p-1.5 bg-current opacity-10 rounded-lg absolute inset-0 -z-10" />
                <Send className="w-4 h-4" />
                Личный отклик
              </button>
              <button
                type="button"
                onClick={() => setMode('team')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  mode === 'team' 
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/30' 
                    : 'text-surface-400 hover:text-surface-600'
                }`}
              >
                <Users className="w-4 h-4" />
                Сбор команды
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100/50 dark:border-primary-500/10">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-bold text-primary-900 dark:text-primary-100">Награда за выполнение:</span>
                </div>
                <span className="text-lg font-black text-primary-600">{points} KP</span>
              </div>

              {mode === 'apply' ? (
                <div>
                  <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 ml-1">
                    Сопроводительное письмо
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Расскажите, почему вы подходите для этой задачи и какой у вас опыт..."
                    className="w-full h-40 px-4 py-3 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white placeholder:text-surface-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                    required
                  />
                  <div className="mt-2 flex items-start gap-2 text-[10px] text-surface-400 px-1">
                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>Ваше письмо увидит заказчик. Опишите свои навыки и готовность приступить к работе.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 ml-1">
                      Название команды (необязательно)
                    </label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Например: Dream Team, Код-мастера..."
                      className="w-full px-4 py-3 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white placeholder:text-surface-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                    />
                  </div>
                  
                  <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100/50 dark:border-primary-500/10 space-y-3">
                    <div className="flex items-center gap-2 text-primary-900 dark:text-primary-100">
                      <Users className="w-5 h-5 text-primary-600" />
                      <span className="text-sm font-bold">Правила командной работы:</span>
                    </div>
                    <ul className="text-xs space-y-2 text-surface-600 dark:text-surface-400 list-disc list-inside">
                      <li>Максимальный размер команды: <span className="font-bold text-primary-600">4 человека</span></li>
                      <li>Награда делится <span className="font-bold text-primary-600">поровну</span> между всеми участниками</li>
                      <li>При 4 участниках каждый получит по <span className="font-bold text-primary-600">{Math.ceil(points / 4)} KP</span></li>
                      <li>Только вы (лидер) сможете отправить финальную заявку</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={onClose}
                  className="rounded-2xl h-12 w-full"
                >
                  Отмена
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  isLoading={isLoading}
                  leftIcon={mode === 'apply' ? <Send className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  className="rounded-2xl h-12 w-full shadow-lg shadow-primary-600/20"
                >
                  {mode === 'apply' ? 'Отправить отклик' : 'Объявить поиск'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
