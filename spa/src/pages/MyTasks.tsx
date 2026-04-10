import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/api/client';
import type { Task } from '@/types';
import { 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown,
  FileText, 
  LayoutList, 
  Users, 
  ShieldAlert, 
  Edit, 
  MessageSquare,
  Paperclip,
  Tag,
  Download,
  AlertCircle,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SubmissionModal } from '@/components/SubmissionModal';
import { ChatComponent } from '@/components/ChatComponent';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export const MyTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTask, setChatTask] = useState<Task | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

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
    if (user && user.role === 'admin') {
      navigate('/');
      return;
    }
    fetchMyTasks();
  }, []);

  const openSubmission = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const openChat = (task: Task) => {
    setChatTask(task);
    setIsChatOpen(true);
  };

  const toggleExpand = (taskId: number) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const isStudent = user?.role === 'student';

  const getApplicationStatus = (task: Task) => {
    if (!isStudent || !user || !task.applications) return null;
    const myApp = task.applications.find((app: any) => 
      app.student_id === user.id || app.student?.id === user.id || 
      (app.team && app.team.members.some((m: any) => m.user_id === user.id))
    );
    return myApp?.status || null;
  };

  const getStatusBadge = (status: string, appStatus: string | null = null) => {
    // If student, priority to application status
    if (isStudent && appStatus) {
      switch (appStatus) {
        case 'pending':
          return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-600 dark:bg-blue-900/20 text-[10px] font-bold uppercase tracking-wider">Ожидание</span>;
        case 'rejected':
          return <span className="px-2 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/20 text-[10px] font-bold uppercase tracking-wider">Отклонено</span>;
        case 'accepted':
          // If accepted, show task status instead or in addition
          break;
      }
    }

    switch (status) {
      case 'pending_approval':
        return <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-600 dark:bg-orange-900/20 text-[10px] font-bold uppercase tracking-wider">Модерация</span>;
      case 'open':
        return <span className="px-2 py-0.5 rounded bg-green-100 text-green-600 dark:bg-green-900/20 text-[10px] font-bold uppercase tracking-wider">{isStudent ? 'Отклик отправлен' : 'Сбор заявок'}</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-600 dark:bg-blue-900/20 text-[10px] font-bold uppercase tracking-wider">В работе</span>;
      case 'review':
        return <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 text-[10px] font-bold uppercase tracking-wider">Проверка</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-600 dark:bg-purple-900/20 text-[10px] font-bold uppercase tracking-wider">Завершено</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/20 text-[10px] font-bold uppercase tracking-wider">Отклонено</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
            {isStudent ? 'Мои задачи' : 'Мои проекты'}
          </h1>
          <p className="text-surface-500 mt-1">
            {isStudent 
              ? 'Задачи, которые вы выполняете' 
              : 'Управление созданными вами задачами и их статусами'}
          </p>
        </div>
        <LayoutList className="w-10 h-10 text-primary-500/20" />
      </div>

      {tasks.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
            {isStudent ? 'У вас пока нет активных задач' : 'Вы пока не создали ни одной задачи'}
          </h3>
          <p className="text-surface-500 mt-2 max-w-sm">
            {isStudent 
              ? 'Откликнитесь на интересные предложения в каталоге задач.' 
              : 'Создайте свою первую задачу, чтобы привлечь талантливых студентов.'}
          </p>
          <Link to={isStudent ? "/tasks" : "/tasks/new"}>
            <Button variant="outline" className="mt-6">
              {isStudent ? 'Перейти в каталог' : 'Создать задачу'}
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:border-primary-500/50 transition-all p-5 group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex gap-4 items-start flex-1">
                    <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      {task.status === 'completed' 
                        ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                        : task.status === 'cancelled'
                        ? <ShieldAlert className="w-6 h-6 text-red-500" />
                        : <Clock className="w-6 h-6 text-primary-600" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500 bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded">
                            {task.category?.name || 'Общее'}
                          </span>
                          {task.team && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-0.5 rounded flex items-center gap-1">
                              <Users className="w-3 h-3" /> Команда
                            </span>
                          )}
                          {getStatusBadge(task.status, getApplicationStatus(task))}
                        </div>
                      <h3 className="text-lg font-bold text-surface-900 dark:text-white group-hover:text-primary-600 transition-colors">
                        {task.title}
                      </h3>
                      {task.status === 'cancelled' && task.rejection_reason && (
                        <div className="mt-1 flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg w-fit">
                          <AlertCircle className="w-3 h-3" />
                          Причина: {task.rejection_reason}
                        </div>
                      )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-surface-500">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1 font-bold text-primary-600">
                              <span>{task.points_reward} KP</span>
                              {task.team && (
                                <span className="text-[10px] font-normal text-surface-400">
                                  (Всего за проект)
                                </span>
                              )}
                            </div>
                            {task.team && (
                              <div className="text-[10px] font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                <Award className="w-3 h-3" /> 
                                {Math.ceil(task.points_reward / task.team.members.length)} KP для вас
                              </div>
                            )}
                          </div>
                          {task.deadline && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>До {new Date(task.deadline).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {isStudent ? (() => {
                      const appStatus = getApplicationStatus(task);
                      
                      if (appStatus === 'pending') {
                        return (
                          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl text-sm font-medium border border-blue-200/50 dark:border-blue-800/50">
                            Ожидание решения
                          </div>
                        );
                      }
                      
                      if (appStatus === 'rejected') {
                        return (
                          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm font-medium border border-red-200/50 dark:border-red-800/50">
                            Отклонено
                          </div>
                        );
                      }

                      if (appStatus === 'accepted') {
                        return (
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => openChat(task)}
                              variant="outline"
                              size="sm"
                              leftIcon={<MessageSquare className="w-4 h-4" />}
                            >
                              Чат
                            </Button>
                            {task.status === 'in_progress' ? (
                              <Button
                                onClick={() => openSubmission(task)}
                                variant="primary"
                                size="sm"
                                leftIcon={<FileText className="w-4 h-4" />}
                              >
                                Сдать
                              </Button>
                            ) : task.status === 'review' ? (
                              <div className="px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs font-semibold border border-yellow-200/50">
                                На проверке
                              </div>
                            ) : (
                                <div className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-xs font-semibold border border-green-200/50">
                                  Принято
                                </div>
                            )}
                          </div>
                        );
                      }
                      
                      if (task.status === 'in_progress') {
                        return (
                          <div className="px-4 py-2 bg-surface-50 dark:bg-surface-800 text-surface-500 rounded-xl text-sm font-medium border border-surface-200 dark:border-surface-700">
                            Место занято
                          </div>
                        );
                      }

                      return (
                        <div className="px-4 py-2 bg-surface-50 dark:bg-surface-800 text-surface-500 rounded-xl text-sm font-medium border border-surface-200 dark:border-surface-700">
                          {task.status === 'open' ? 'Отклик отправлен' : 'Завершено'}
                        </div>
                      );
                    })() : (
                      <div className="flex items-center gap-2">
                        {task.status === 'open' && (
                          <div className="flex items-center gap-2">
                            <Link to="/applications">
                              <Button size="sm" variant="outline" leftIcon={<Users className="w-4 h-4" />}>
                                Отклики
                              </Button>
                            </Link>
                            <Link to={`/tasks/edit/${task.id}`}>
                              <Button size="sm" variant="ghost" className="text-surface-500 hover:text-primary-600" leftIcon={<Edit className="w-4 h-4" />}>
                                Изменить
                              </Button>
                            </Link>
                          </div>
                        )}
                        {(task.status === 'review' || task.status === 'in_progress' || task.status === 'completed') && (
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => openChat(task)}
                              variant="outline"
                              size="sm"
                              leftIcon={<MessageSquare className="w-4 h-4" />}
                            >
                              Чат
                            </Button>
                            {task.status === 'review' && (
                              <Link to="/reviews">
                                <Button size="sm" variant="primary" leftIcon={<FileText className="w-4 h-4" />}>
                                  Проверить
                                </Button>
                              </Link>
                            )}
                          </div>
                        )}
                        {(task.status === 'pending_approval' || task.status === 'cancelled') && (
                          <div className="flex items-center gap-3">
                            <Link to={`/tasks/edit/${task.id}`}>
                              <Button size="sm" variant="ghost" className="text-surface-600 dark:text-surface-400 hover:text-primary-600" leftIcon={<Edit className="w-4 h-4" />}>
                                {task.status === 'cancelled' ? 'Исправить' : 'Изменить'}
                              </Button>
                            </Link>
                          </div>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hidden md:flex text-surface-400 dark:text-surface-500 hover:bg-surface-100 dark:hover:bg-white/5"
                          onClick={() => toggleExpand(task.id)}
                        >
                          {expandedTaskId === task.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </Button>
                      </div>
                    )}
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
                        {/* Rejection Reason Section */}
                        {task.status === 'cancelled' && task.rejection_reason && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex gap-3"
                          >
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-bold text-red-700 dark:text-red-400">Задача отклонена модератором</h4>
                              <p className="text-sm text-red-600 dark:text-red-300 mt-1 italic">
                                "{task.rejection_reason}"
                              </p>
                              <p className="text-xs text-red-500/70 mt-2">
                                Пожалуйста, отредактируйте задачу в соответствии с замечаниями и отправьте её снова.
                              </p>
                            </div>
                          </motion.div>
                        )}

                        {/* Team Section */}
                        {task.team && (
                          <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100/50 dark:border-purple-500/10 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1">
                                <Users className="w-3 h-3" /> Участники команды: {task.team.name || 'Без названия'}
                              </h4>
                              <div className="text-[10px] font-bold text-purple-600 bg-white dark:bg-surface-800 px-2 py-1 rounded-lg border border-purple-100 dark:border-white/5 shadow-sm flex items-center gap-1">
                                <Award className="w-3 h-3" /> 
                                Разделение: {Math.ceil(task.points_reward / task.team.members.length)} KP каждому
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {task.team.members.map((member) => (
                                <div key={member.id} className="flex items-center gap-2 bg-white dark:bg-surface-800 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-white/5 shadow-sm">
                                  <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-[10px] font-bold text-purple-600">
                                    {member.user.full_name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-surface-900 dark:text-white leading-none mb-0.5">
                                      {member.user.full_name}
                                      {member.user_id === task.team?.creator_id && (
                                        <span className="ml-1 text-[8px] uppercase text-purple-500 font-black tracking-tighter">(Лидер)</span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-surface-400 leading-none">Репутация: {member.user.reputation}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Description Section */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-surface-400 mb-2">Описание задачи</h4>
                          <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
                            {task.description}
                          </p>
                        </div>

                        {/* Skills Section */}
                        {task.skills && task.skills.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-surface-400 mb-2">Требуемые навыки</h4>
                            <div className="flex flex-wrap gap-2">
                              {task.skills.map((skill) => (
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
                              {task.attachments.map((file) => (
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

      {chatTask && (
        <ChatComponent
          taskId={chatTask.id}
          taskTitle={chatTask.title}
          isConfidential={chatTask.is_confidential}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
};
