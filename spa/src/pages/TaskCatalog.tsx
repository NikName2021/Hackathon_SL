import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/api/client';
import { Task } from '@/types';
import { motion } from 'framer-motion';
import { Paperclip, Tag, User as UserIcon } from 'lucide-react';

import { ApplicationModal } from '@/components/ApplicationModal';
import { UserProfileModal } from '@/components/UserProfileModal';
import { User } from '@/types';

export const TaskCatalog: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const highlightedTaskId = searchParams.get('taskId');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await apiClient.get<Task[]>('/tasks/');
        setTasks(response.data);
      } catch (error) {
        console.error('Failed to load tasks', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleOpenModal = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleOpenOwnerProfile = (owner: any) => {
    setSelectedOwner(owner);
    setIsOwnerModalOpen(true);
  };

  const handleApplySuccess = (taskId: number) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <h1 className="text-3xl font-bold mb-6">Доступные задачи</h1>
      
      {tasks.length === 0 ? (
        <Card className="text-center p-12 text-surface-500 glass-card">
          Сейчас нет доступных задач. Возвращайтесь позже!
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map((task, index) => (
            <motion.div 
              key={task.id} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              id={`task-${task.id}`}
            >
              <Card className={`flex flex-col h-full hover:shadow-2xl transition-all duration-300 border ${
                highlightedTaskId === String(task.id) 
                  ? 'ring-2 ring-primary-500 shadow-xl shadow-primary-500/10 border-primary-500/50 scale-[1.02]' 
                  : 'border-surface-200/50 dark:border-white/5'
              }`}>
                {highlightedTaskId === String(task.id) && (
                  <div className="absolute -top-3 left-4 bg-primary-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-primary-600/20 animate-bounce">
                    РЕКОМЕНДОВАНО
                  </div>
                )}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-primary-100/50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-md">
                      {task.category?.name || 'Общее'}
                    </span>
                    <h3 className="text-xl font-bold mt-2 text-surface-900 dark:text-white leading-tight">{task.title}</h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xl font-black text-green-500 dark:text-green-400">+{task.points_reward} <span className="text-xs font-normal opacity-70">KP</span></span>
                  </div>
                </div>
                
                <p className="text-surface-600 dark:text-surface-400 mb-6 flex-1 text-sm line-clamp-3">
                  {task.description}
                </p>

                {/* Skills Section */}
                {task.skills && task.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {task.skills.map((skill) => (
                      <span key={skill.id} className="inline-flex items-center gap-1 text-[10px] bg-surface-100 dark:bg-white/5 text-surface-600 dark:text-surface-400 px-2 py-0.5 rounded-md border border-surface-200/50 dark:border-white/5">
                        <Tag className="w-2.5 h-2.5" />
                        {skill.name}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-surface-100 dark:border-white/5">
                  <div className="flex flex-col gap-1">
                    <div 
                      onClick={() => handleOpenOwnerProfile(task.owner)}
                      className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400 hover:text-primary-500 cursor-pointer transition-colors group"
                    >
                      <UserIcon className="w-3 h-3 group-hover:scale-110 transition-transform" />
                      <span className="group-hover:underline">{task.owner?.full_name}</span>
                    </div>
                    {task.attachments && task.attachments.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-primary-500 font-medium">
                        <Paperclip className="w-3 h-3" />
                        {task.attachments.length} {task.attachments.length === 1 ? 'вложение' : 'вложения'}
                      </div>
                    )}
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => handleOpenModal(task)}
                    className="rounded-full px-6"
                  >
                    Откликнуться
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {selectedTask && (
        <ApplicationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleApplySuccess}
          taskId={selectedTask.id}
          taskTitle={selectedTask.title}
          points={selectedTask.points_reward}
        />
      )}

      <UserProfileModal
        isOpen={isOwnerModalOpen}
        onClose={() => setIsOwnerModalOpen(false)}
        student={selectedOwner}
      />
    </div>
  );
};
