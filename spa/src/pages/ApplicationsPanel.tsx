import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/api/client';
import type { User, Task, TaskTeam } from '@/types';
import { UserCheck, UserX, UserPlus, Clock, MessageSquare, CheckCircle, ExternalLink, Users, Award, Trophy, Zap, Sparkles, Star } from 'lucide-react';
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
  team?: TaskTeam;
  smart_badges?: { type: string; label: string; description: string }[];
  is_best_match?: boolean;
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
                className="relative group"
              >
                {app.is_best_match && (
                  <div className="absolute -top-3 -right-3 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg border-2 border-white dark:border-surface-900 flex items-center gap-1 animate-bounce">
                    <Star className="w-3 h-3 fill-current" />
                    ЛУЧШИЙ МЭТЧ
                  </div>
                )}
                <Card className={`overflow-hidden transition-all duration-500 ${
                  app.is_best_match 
                    ? 'ring-2 ring-yellow-400 border-yellow-100 shadow-xl shadow-yellow-500/10 scale-[1.02]' 
                    : 'border-l-4 ' + (app.team ? 'border-l-purple-500' : 'border-l-primary-500')
                }`}>
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
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                                  {app.student.full_name}
                                </h3>
                                {app.team && (
                                  <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Users className="w-3 h-3" /> Команда: {app.team.name || 'Без названия'}
                                  </span>
                                )}
                              </div>
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

                            {/* Smart Badges */}
                            {app.smart_badges && app.smart_badges.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {app.smart_badges.map((badge) => (
                                  <div 
                                    key={badge.type}
                                    title={badge.description}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm transition-all hover:scale-105 cursor-help ${
                                      badge.type === 'category_top' 
                                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                        : badge.type === 'department_veteran'
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    }`}
                                  >
                                    {badge.type === 'category_top' && <Trophy className="w-3 h-3" />}
                                    {badge.type === 'department_veteran' && <Sparkles className="w-3 h-3" />}
                                    {badge.type === 'speedster' && <Zap className="w-3 h-3" />}
                                    {badge.label}
                                  </div>
                                ))}
                              </div>
                            )}
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

                        {app.team && (
                          <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100/50 dark:border-purple-500/10 space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1">
                              <Users className="w-3 h-3" /> Состав команды
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {app.team.members.map((member) => (
                                <div key={member.id} className="flex items-center gap-2 bg-white dark:bg-surface-800 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-white/5 shadow-sm">
                                  <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-[10px] font-bold text-purple-600">
                                    {member.user.full_name.charAt(0)}
                                  </div>
                                  <span className="text-xs font-medium text-surface-700 dark:text-surface-200">
                                    {member.user.full_name}
                                  </span>
                                  <span className="text-[10px] text-surface-400">
                                    (Rep: {member.user.reputation})
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 mt-1">
                              <Award className="w-3 h-3" /> 
                              Каждый получит по {Math.ceil(app.task.points_reward / app.team.members.length)} KP
                            </div>
                          </div>
                        )}

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
