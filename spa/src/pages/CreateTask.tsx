import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/api/client';
import { Category, Skill, Task } from '@/types';
import { Upload, X, Paperclip, Image as ImageIcon, FileText } from 'lucide-react';

import { useNotification } from '@/context/NotificationContext';

export const CreateTask: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get<Category[]>('/categories/');
        setCategories(response.data);
        if (response.data.length > 0 && !categoryId) {
          setCategoryId(String(response.data[0].id));
        }
      } catch (e: any) {
        console.error('Failed to load categories:', e.response?.data || e.message);
      }
    };

    const fetchSkills = async () => {
      try {
        const response = await apiClient.get<Skill[]>('/skills/');
        setAllSkills(response.data);
      } catch (e: any) {
        console.error('Failed to load skills:', e.response?.data || e.message);
      }
    };

    fetchCategories();
    fetchSkills();
  }, [categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 1. Create task
      const taskRes = await apiClient.post<Task>('/tasks/', {
        title,
        description,
        points_reward: parseInt(pointsReward, 10),
        category_id: parseInt(categoryId, 10),
        skills: skills,
      });

      const taskId = taskRes.data.id;

      // 2. Upload attachments if any
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => {
          formData.append('files', file);
        });
        await apiClient.post(`/tasks/${taskId}/attachments`, formData);
      }

      showNotification('success', 'Задача успешно создана и отправлена на модерацию!');
      navigate('/');
    } catch (e: any) {
      const errorDetail = e.response?.data?.detail;
      const errorMessage = typeof errorDetail === 'string' 
        ? errorDetail 
        : (Array.isArray(errorDetail) ? errorDetail[0]?.msg : 'Ошибка при создании задачи');
      
      showNotification('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <h1 className="text-3xl font-bold mb-6">Создание новой задачи</h1>
      
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Название задачи"
            placeholder="Например: Спроектировать базу данных"
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

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Очки (Награда)"
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
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Skill Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-surface-800 dark:text-surface-100 ml-1 flex justify-between items-center">
              Требуемые навыки
              <span className="text-[10px] font-normal text-surface-400">Выберите из списка или введите новый</span>
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {skills.map(s => (
                <span key={s} className="bg-primary-50 text-primary-600 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-primary-100 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-300">
                  {s}
                  <button type="button" onClick={() => setSkills(skills.filter(x => x !== s))} className="hover:text-primary-800 transition-colors">
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSkill(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                />
                <datalist id="all-skills">
                  {allSkills.map(skill => (
                    <option key={skill.id} value={skill.name} />
                  ))}
                </datalist>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddSkill}
                className="h-[50px]"
              >
                Добавить
              </Button>
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-surface-800 dark:text-surface-100 ml-1">Приложение (файлы или изображения)</h3>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors bg-surface-50/50 dark:bg-white/5"
            >
              <Upload className="w-8 h-8 text-surface-400 mb-2" />
              <p className="text-sm text-surface-600 dark:text-surface-400">Нажмите для выбора файлов</p>
              <p className="text-[10px] text-surface-400 mt-1">Поддерживаются изображения, PDF и документы</p>
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
                  <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl">
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
      <p className="text-center text-xs text-surface-400 mt-6">
        После создания задача будет отправлена на модерацию. Студенты увидят её в каталоге после подтверждения администратором.
      </p>
    </div>
  );
};
