import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Image as ImageIcon, FileText } from 'lucide-react';

import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useNotification } from '@/context/NotificationContext';
import type { Category, Skill, Task } from '@/types';

export const CreateTask: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [performerRequirements, setPerformerRequirements] = useState('');
  const [deadline, setDeadline] = useState('');
  const [pointsReward, setPointsReward] = useState('10');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [categoriesResponse, skillsResponse] = await Promise.all([
          apiClient.get<Category[]>('/categories/'),
          apiClient.get<Skill[]>('/skills/')
        ]);

        setCategories(categoriesResponse.data);
        if (categoriesResponse.data.length > 0) {
          setCategoryId(String(categoriesResponse.data[0].id));
        }
        setAllSkills(skillsResponse.data);
      } catch (e: any) {
        console.error('Failed to load dictionaries:', e.response?.data || e.message);
      }
    };

    fetchInitialData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const taskResponse = await apiClient.post<Task>('/tasks/', {
        title,
        description,
        acceptance_criteria: acceptanceCriteria.trim() || null,
        performer_requirements: performerRequirements.trim() || null,
        points_reward: parseInt(pointsReward, 10),
        category_id: parseInt(categoryId, 10),
        deadline: deadline ? new Date(deadline).toISOString() : null,
        skills
      });

      const taskId = taskResponse.data.id;

      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('files', file);
        });
        await apiClient.post(`/tasks/${taskId}/attachments`, formData);
      }

      showNotification('success', 'Задача создана и отправлена на модерацию');
      navigate('/');
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      const message = typeof detail === 'string'
        ? detail
        : Array.isArray(detail) && detail[0]?.msg
          ? detail[0].msg
          : 'Ошибка при создании задачи';
      showNotification('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSkill = () => {
    const value = newSkill.trim();
    if (value && !skills.includes(value)) {
      setSkills((prev) => [...prev, value]);
      setNewSkill('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }
    setFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <h1 className="text-3xl font-bold mb-6">Создание новой задачи</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Название задачи"
            placeholder="Например: Подготовить SQL-отчет"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-800 dark:text-surface-100 ml-1">Описание задачи</label>
            <textarea
              className="glass-input w-full"
              rows={4}
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
              placeholder="Как понять, что работа выполнена"
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
              placeholder="Нужные навыки, опыт и ограничения"
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

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-surface-800 dark:text-surface-100 ml-1 flex justify-between items-center">
              Требуемые навыки
              <span className="text-[10px] font-normal text-surface-400">Выберите из списка или добавьте вручную</span>
            </h3>

            <div className="flex flex-wrap gap-2 mb-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="bg-primary-50 text-primary-600 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-primary-100 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-300"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => setSkills((prev) => prev.filter((item) => item !== skill))}
                    className="hover:text-primary-800 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Начните вводить навык..."
                  list="all-skills"
                  value={newSkill}
                  autoComplete="off"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSkill(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                />
                <datalist id="all-skills">
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

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-surface-800 dark:text-surface-100 ml-1">Приложения</h3>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors bg-surface-50/50 dark:bg-white/5"
            >
              <Upload className="w-8 h-8 text-surface-400 mb-2" />
              <p className="text-sm text-surface-600 dark:text-surface-400">Нажмите для выбора файлов</p>
              <p className="text-[10px] text-surface-400 mt-1">Изображения, PDF и документы</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
            </div>

            {files.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {files.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between p-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="w-5 h-5 text-blue-500 shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-surface-400 shrink-0" />
                      )}
                      <span className="text-sm truncate text-surface-700 dark:text-surface-200">{file.name}</span>
                      <span className="text-[10px] text-surface-400 shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-surface-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full h-14 text-lg">
            Создать задачу
          </Button>
        </form>
      </Card>
    </div>
  );
};
