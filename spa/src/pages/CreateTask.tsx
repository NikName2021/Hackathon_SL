import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/api/client';
import { Category } from '@/types';

export const CreateTask: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsReward, setPointsReward] = useState('10');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get<Category[]>('/categories/');
        setCategories(response.data);
        if (response.data.length > 0) {
          setCategoryId(String(response.data[0].id));
        }
      } catch (e) {
        console.error('Failed to load categories');
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post('/tasks/', {
        title,
        description,
        points_reward: parseInt(pointsReward, 10),
        category_id: parseInt(categoryId, 10),
      });
      alert('Задача успешно создана и отправлена на модерацию!');
      navigate('/');
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Ошибка при создании задачи');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Создание новой задачи</h1>
      
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Название задачи"
            placeholder="Например: Спроектировать базу данных"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-800 dark:text-surface-100 ml-1">Описание задачи</label>
            <textarea
              className="w-full bg-white/50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all dark:bg-black/40 dark:border-white/10 dark:text-white"
              rows={4}
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
              onChange={(e) => setPointsReward(e.target.value)}
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

          <Button type="submit" isLoading={isLoading} className="w-full">
            Создать задачу
          </Button>
        </form>
      </Card>
    </div>
  );
};
