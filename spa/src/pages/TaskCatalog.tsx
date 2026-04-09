import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Paperclip, Tag, User as UserIcon, CalendarDays, CheckCircle2 } from 'lucide-react';

import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ApplicationModal } from '@/components/ApplicationModal';
import { UserProfileModal } from '@/components/UserProfileModal';
import type { Category, Task, User } from '@/types';

const formatDeadline = (value?: string) => {
  if (!value) {
    return 'Без дедлайна';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Без дедлайна';
  }
  return date.toLocaleString('ru-RU');
};

export const TaskCatalog: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const highlightedTaskId = searchParams.get('taskId');

  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPoints, setMinPoints] = useState('');
  const [maxPoints, setMaxPoints] = useState('');
  const [deadlineAfter, setDeadlineAfter] = useState('');
  const [deadlineBefore, setDeadlineBefore] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiClient.get<Category[]>('/categories/');
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to load categories', error);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, string | number> = {};
        if (selectedCategory) {
          params.category_id = Number(selectedCategory);
        }
        if (minPoints) {
          params.min_points = Number(minPoints);
        }
        if (maxPoints) {
          params.max_points = Number(maxPoints);
        }
        if (deadlineAfter) {
          params.deadline_after = new Date(deadlineAfter).toISOString();
        }
        if (deadlineBefore) {
          params.deadline_before = new Date(deadlineBefore).toISOString();
        }

        const response = await apiClient.get<Task[]>('/tasks/', { params });
        setTasks(response.data);
      } catch (error) {
        console.error('Failed to load tasks', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [selectedCategory, minPoints, maxPoints, deadlineAfter, deadlineBefore]);

  const handleOpenModal = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleOpenOwnerProfile = (owner?: User) => {
    if (!owner) {
      return;
    }
    setSelectedOwner(owner);
    setIsOwnerModalOpen(true);
  };

  const handleApplySuccess = (taskId: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const resetFilters = () => {
    setSelectedCategory('');
    setMinPoints('');
    setMaxPoints('');
    setDeadlineAfter('');
    setDeadlineBefore('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-10 space-y-6">
      <h1 className="text-3xl font-bold">Доступные задачи</h1>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold">Фильтры</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="glass-input w-full"
          >
            <option value="">Все категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Мин. баллы"
            value={minPoints}
            onChange={(e) => setMinPoints(e.target.value)}
            className="glass-input w-full"
          />

          <input
            type="number"
            placeholder="Макс. баллы"
            value={maxPoints}
            onChange={(e) => setMaxPoints(e.target.value)}
            className="glass-input w-full"
          />

          <input
            type="datetime-local"
            value={deadlineAfter}
            onChange={(e) => setDeadlineAfter(e.target.value)}
            className="glass-input w-full"
            title="Дедлайн от"
          />

          <input
            type="datetime-local"
            value={deadlineBefore}
            onChange={(e) => setDeadlineBefore(e.target.value)}
            className="glass-input w-full"
            title="Дедлайн до"
          />
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="ghost" onClick={resetFilters}>
            Сбросить фильтры
          </Button>
        </div>
      </Card>

      {tasks.length === 0 ? (
        <Card className="text-center p-12 text-surface-500 glass-card">
          Нет доступных задач по текущим фильтрам.
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
              <Card
                className={`flex flex-col h-full hover:shadow-2xl transition-all duration-300 border relative ${
                  highlightedTaskId === String(task.id)
                    ? 'ring-2 ring-primary-500 shadow-xl shadow-primary-500/10 border-primary-500/50 scale-[1.02] neon-glow-primary'
                    : 'border-surface-200/50 dark:border-white/5'
                }`}
              >
                {highlightedTaskId === String(task.id) && (
                  <div className="absolute -top-3 left-4 bg-primary-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-primary-600/20 animate-bounce z-10">
                    <span className="glitch-text" data-text="РЕКОМЕНДОВАНО">РЕКОМЕНДОВАНО</span>
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
                    <span className="text-xl font-black text-green-500 dark:text-green-400">
                      +{task.points_reward} <span className="text-xs font-normal opacity-70">KP</span>
                    </span>
                  </div>
                </div>

                <p className="text-surface-600 dark:text-surface-400 mb-3 text-sm line-clamp-3">{task.description}</p>

                {task.acceptance_criteria && (
                  <div className="mb-2 text-xs text-surface-600 dark:text-surface-300 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-primary-500 shrink-0" />
                    <span className="line-clamp-2">{task.acceptance_criteria}</span>
                  </div>
                )}

                <div className="mb-4 text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-surface-400" />
                  {formatDeadline(task.deadline)}
                </div>

                {task.skills && task.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {task.skills.map((skill) => (
                      <span
                        key={skill.id}
                        className="inline-flex items-center gap-1 text-[10px] bg-surface-100 dark:bg-white/5 text-surface-600 dark:text-surface-400 px-2 py-0.5 rounded-md border border-surface-200/50 dark:border-white/5"
                      >
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
                        {task.attachments.length} вложений
                      </div>
                    )}
                  </div>
                  <Button size="sm" onClick={() => handleOpenModal(task)} className="rounded-full px-6">
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
