import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Loader2, X, Upload, Image as ImageIcon, FileText, Trash2 } from 'lucide-react';

import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useNotification } from '@/context/NotificationContext';
import type { Category, Skill, Task, TaskAttachment } from '@/types';

const toDatetimeLocal = (value?: string): string => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 16);
};

export const EditTask: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [performerRequirements, setPerformerRequirements] = useState('');
  const [deadline, setDeadline] = useState('');
  const [pointsReward, setPointsReward] = useState('10');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [allSkills, setAllSkills] = useState<Skill[]>([]);

  const [existingAttachments, setExistingAttachments] = useState<TaskAttachment[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        navigate('/tasks/my');
        return;
      }

      try {
        const [categoriesRes, taskRes, skillsRes] = await Promise.all([
          apiClient.get<Category[]>('/categories/'),
          apiClient.get<Task>(`/tasks/${id}`),
          apiClient.get<Skill[]>('/skills/')
        ]);

        setCategories(categoriesRes.data);
        setAllSkills(skillsRes.data);

        const task = taskRes.data;
        setTitle(task.title);
        setDescription(task.description || '');
        setAcceptanceCriteria(task.acceptance_criteria || '');
        setPerformerRequirements(task.performer_requirements || '');
        setDeadline(toDatetimeLocal(task.deadline));
        setPointsReward(String(task.points_reward));
        setCategoryId(String(task.category?.id || ''));
        setExistingAttachments(task.attachments || []);
        setSkills((task.skills || []).map((skill) => skill.name));
      } catch (e) {
        console.error('Failed to load task data:', e);
        showNotification('error', 'Не удалось загрузить данные задачи');
        navigate('/tasks/my');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, showNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) {
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.patch(`/tasks/${id}`, {
        title,
        description,
        acceptance_criteria: acceptanceCriteria.trim() || null,
        performer_requirements: performerRequirements.trim() || null,
        points_reward: parseInt(pointsReward, 10),
        category_id: categoryId ? parseInt(categoryId, 10) : null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        skills
      });

      if (newFiles.length > 0) {
        const formData = new FormData();
        newFiles.forEach((file) => formData.append('files', file));
        await apiClient.post(`/tasks/${id}/attachments`, formData);
      }

      showNotification('success', 'Задача обновлена');
      navigate('/tasks/my');
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      const message = typeof detail === 'string'
        ? detail
        : Array.isArray(detail) && detail[0]?.msg
          ? detail[0].msg
          : 'Ошибка при сохранении задачи';
      showNotification('error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = () => {
    const value = newSkill.trim();
    if (value && !skills.includes(value)) {
      setSkills((prev) => [...prev, value]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((item) => item !== skill));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }
    setNewFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)]);
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const deleteExistingAttachment = async (attachmentId: number) => {
    if (!confirm('Удалить это вложение?')) {
      return;
    }
    try {
      await apiClient.delete(`/tasks/attachments/${attachmentId}`);
      setExistingAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
    } catch {
      showNotification('error', 'Не удалось удалить вложение');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold">Редактирование задачи</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Название задачи"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-800 dark:text-surface-100 ml-1">Описание задачи</label>
            <textarea
              className="glass-input w-full"
              rows={5}
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-800 dark:text-surface-100 ml-1">Критерии приемки</label>
            <textarea
              className="glass-input w-full"
              rows={3}
              value={acceptanceCriteria}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAcceptanceCriteria(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-800 dark:text-surface-100 ml-1">Требования к исполнителю</label>
            <textarea
              className="glass-input w-full"
              rows={3}
              value={performerRequirements}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPerformerRequirements(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Очки (награда)"
              type="number"
              min="1"
              value={pointsReward}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPointsReward(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-800 dark:text-surface-100 ml-1">Категория</label>
              <select
                className="glass-input w-full"
                value={categoryId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryId(e.target.value)}
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Дедлайн"
            type="datetime-local"
            value={deadline}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeadline(e.target.value)}
            required
          />

          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
            <h3 className="text-sm font-medium text-surface-800 dark:text-surface-100 flex items-center justify-between">
              Требуемые навыки
              <span className="text-[10px] font-normal text-surface-400">Выберите из списка или добавьте вручную</span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-full text-sm font-medium border border-primary-100 dark:border-primary-800"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="p-0.5 hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Добавить навык..."
                  list="edit-skills"
                  value={newSkill}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSkill(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                />
                <datalist id="edit-skills">
                  {allSkills.map((skill) => (
                    <option key={skill.id} value={skill.name} />
                  ))}
                </datalist>
              </div>
              <Button type="button" variant="outline" onClick={handleAddSkill} className="h-[50px]">
                Добавить
              </Button>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
            <h3 className="text-sm font-medium text-surface-800 dark:text-surface-100 ml-1">Вложения</h3>

            {existingAttachments.length > 0 && (
              <div className="grid grid-cols-1 gap-2 mb-4">
                {existingAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 bg-surface-50 dark:bg-white/5 border border-surface-200/50 dark:border-white/5 rounded-xl"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {attachment.file_type === 'image' ? (
                        <ImageIcon className="w-5 h-5 text-blue-500 shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-surface-400 shrink-0" />
                      )}
                      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-sm truncate text-primary-600 hover:underline">
                        {attachment.filename}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteExistingAttachment(attachment.id)}
                      className="text-surface-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors bg-surface-50/30 dark:bg-white/5"
            >
              <Upload className="w-6 h-6 text-surface-400 mb-2" />
              <p className="text-xs text-surface-600 dark:text-surface-400 text-center">Нажмите, чтобы добавить новые файлы</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
            </div>

            {newFiles.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {newFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between p-3 bg-white dark:bg-white/5 border border-primary-100 dark:border-primary-900/30 rounded-xl"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                      <span className="text-sm truncate text-surface-700 dark:text-surface-200">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNewFile(idx)}
                      className="text-surface-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" isLoading={isSaving} className="w-full h-12" leftIcon={<Save className="w-5 h-5" />}>
            Сохранить изменения
          </Button>
        </form>
      </Card>
    </div>
  );
};
