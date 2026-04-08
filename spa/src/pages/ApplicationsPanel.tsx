import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/api/client';
import { User, Task } from '@/types';
import { UserCheck, UserX, UserPlus, Clock, MessageSquare, CheckCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfileModal } from '@/components/UserProfileModal';

interface Application {
  id: number;
  task_id: number;
  student: User;
  task: Task;
  message: string;
  status: string;
  created_at: string;
}

export const ApplicationsPanel: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const fetchApplications = async () => {
    try {
      const response = await apiClient.get<Application[]>('/tasks/applications/pending');
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async (appId: number) => {
    setIsProcessing(appId);
    try {
      await apiClient.post(`/tasks/applications/${appId}/approve`);
      setApplications(prev => prev.filter(app => app.id !== appId));
    } catch (error) {
      console.error('Failed to approve application:', error);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (appId: number) => {
    setIsProcessing(appId);
    try {
      await apiClient.post(`/tasks/applications/${appId}/reject`);
      setApplications(prev => prev.filter(app => app.id !== appId));
    } catch (error) {
      console.error('Failed to reject application:', error);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleOpenProfile = (student: User) => {
    setSelectedStudent(student);
    setIsProfileOpen(true);
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
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Отклики на задачи</h1>
          <p className="text-surface-500 mt-1">Выберите лучших исполнителей для ваших заданий</p>
        </div>
        <UserPlus className="w-10 h-10 text-primary-500/20" />
      </div>

      {applications.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-4">
            <UserX className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="text-xl font-semibold text-surface-900 dark:text-white">Новых откликов пока нет</h3>
          <p className="text-surface-500 mt-2 max-w-sm">
            Скоро студенты увидят ваши задачи в каталоге и начнут присылать отклики.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {applications.map((app) => (
              <motion.div
                key={app.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="overflow-hidden border-l-4 border-l-primary-500">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center overflow-hidden">
                            <span className="text-xl font-bold text-primary-600">
                              {app.student.full_name?.charAt(0) || 'С'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                                {app.student.full_name}
                              </h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenProfile(app.student)}
                                className="text-primary-600 hover:text-primary-700 font-bold gap-1"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Профиль
                              </Button>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-surface-500 mt-1">
                              <span className="flex items-center gap-1 font-medium text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded">
                                <CheckCircle className="w-3 h-3" />
                                Репутация: {app.student.reputation}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(app.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-surface-50 dark:bg-surface-800/50 p-4 rounded-xl border border-surface-100 dark:border-surface-800">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-surface-400 mb-2 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Сопроводительное письмо
                          </h4>
                          <p className="text-surface-700 dark:text-surface-300 italic">
                            "{app.message || 'Без сообщения'}"
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-surface-500">Отклик на задачу:</span>
                          <span className="text-sm font-bold text-primary-600 hover:underline cursor-pointer">
                            {app.task.title}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col gap-3 justify-end shrink-0">
                        <Button
                          onClick={() => handleApprove(app.id)}
                          isLoading={isProcessing === app.id}
                          leftIcon={<UserCheck className="w-4 h-4" />}
                          className="flex-1 md:w-full"
                        >
                          Принять
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(app.id)}
                          isLoading={isProcessing === app.id}
                          leftIcon={<UserX className="w-4 h-4" />}
                          className="flex-1 md:w-full text-red-500 border-red-200 hover:bg-red-50"
                        >
                          Отклонить
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

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        student={selectedStudent}
      />
    </div>
  );
};
