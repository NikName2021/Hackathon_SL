import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/api/client';
import type { Category, Task } from '@/types';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';

export const EditTask: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsReward, setPointsReward] = useState('10');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, taskRes] = await Promise.all([
          apiClient.get<Category[]>('/categories/'),
          apiClient.get<Task>(`/tasks/${id}`),
        ]);
        
        setCategories(catsRes.data);
        const taskData = taskRes.data;

        setTitle(taskData.title);
        setDescription(taskData.description || '');
        setPointsReward(String(taskData.points_reward));
        setCategoryId(String(taskData.category?.id || ''));
        
      } catch (e) {
        console.error('Failed to load task data', e);
        navigate('/tasks/my');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiClient.patch(`/tasks/${id}`, {
        title,
        description,
        points_reward: parseInt(pointsReward, 10),
        category_id: parseInt(categoryId, 10),
      });
      navigate('/tasks/my');
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Ошибка при сохранении задачи');
    } finally {
      setIsSaving(false);
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
    <div className="max-w-2xl mx-auto space-y-6">
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
            placeholder="Например: Спроектировать базу данных"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            required
          />
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-800 dark:text-surface-100 ml-1">Описание задачи</label>
            <textarea
              className="w-full bg-white/50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all dark:bg-black/40 dark:border-white/10 dark:text-white"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                className="w-full bg-white/50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all dark:bg-black/40 dark:border-white/10 dark:text-white"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <Button type="submit" isLoading={isSaving} className="w-full h-12" leftIcon={<Save className="w-5 h-5" />}>
            Сохранить изменения
          </Button>
        </form>
      </Card>
    </div>
  );
};
