import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Check, X, Shield, Users, User, Layout, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useNotification } from '@/context/NotificationContext';
import type { FAQArticle, Role } from '@/types';

export const FAQAdmin: React.FC = () => {
  const [articles, setArticles] = useState<FAQArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    target_role: '' as Role | '',
    is_published: true
  });

  const { showNotification } = useNotification();

  const fetchFaq = async () => {
    try {
      const response = await apiClient.get<FAQArticle[]>('/faq/admin');
      setArticles(response.data);
    } catch (error) {
      console.error('Failed to load FAQ', error);
      showNotification('error', 'Не удалось загрузить FAQ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaq();
  }, []);

  const handleCreate = async () => {
    try {
      if (!formData.title || !formData.slug || !formData.content) {
        showNotification('error', 'Заполните заголовок, слаг и содержание');
        return;
      }

      await apiClient.post('/faq/admin', {
        ...formData,
        target_role: formData.target_role === '' ? null : formData.target_role
      });
      showNotification('success', 'Статья добавлена');
      setIsAdding(false);
      setFormData({ title: '', slug: '', content: '', target_role: '', is_published: true });
      fetchFaq();
    } catch (error: any) {
      showNotification('error', error.response?.data?.detail || 'Ошибка при создании');
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      await apiClient.patch(`/faq/admin/${id}`, {
        ...formData,
        target_role: formData.target_role === '' ? null : formData.target_role
      });
      showNotification('success', 'Статья обновлена');
      setIsEditing(null);
      fetchFaq();
    } catch (error: any) {
      showNotification('error', error.response?.data?.detail || 'Ошибка при обновлении');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту статью?')) return;
    try {
      await apiClient.delete(`/faq/admin/${id}`);
      showNotification('success', 'Статья удалена');
      fetchFaq();
    } catch (error) {
      showNotification('error', 'Ошибка при удалении');
    }
  };

  const startEdit = (article: FAQArticle) => {
    setFormData({
      title: article.title,
      slug: article.slug,
      content: article.content,
      target_role: article.target_role || '',
      is_published: article.is_published
    });
    setIsEditing(article.id);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const getRoleBadge = (role: Role | null) => {
    if (!role) return <span className="flex items-center gap-1 text-[10px] bg-surface-100 text-surface-600 px-2 py-0.5 rounded-full uppercase font-bold tracking-tighter"><Layout className="w-2.5 h-2.5" /> Всем</span>;
    if (role === 'student') return <span className="flex items-center gap-1 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase font-bold tracking-tighter"><User className="w-2.5 h-2.5" /> Студент</span>;
    if (role === 'employee') return <span className="flex items-center gap-1 text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full uppercase font-bold tracking-tighter"><Shield className="w-2.5 h-2.5" /> Заказчик</span>;
    return <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase font-bold tracking-tighter"><Shield className="w-2.5 h-2.5" /> Админ</span>;
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Управление Базой знаний</h1>
        <Button onClick={() => { setIsAdding(true); setFormData({ title: '', slug: '', content: '', target_role: '', is_published: true }); }} className="gap-2">
          <Plus className="w-4 h-4" /> Добавить
        </Button>
      </div>

      <AnimatePresence>
        {(isAdding || isEditing !== null) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 border-primary-500 shadow-xl ring-1 ring-primary-500/10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-primary-600 flex items-center gap-2">
                  <Layout className="w-5 h-5" /> {isAdding ? 'Новая статья' : 'Редактирование'}
                </h2>
                <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="text-surface-400 hover:text-surface-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-surface-500">Заголовок</label>
                    <Input 
                      placeholder="Например: Как откликнуться на задачу?"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-surface-500">Slug (URL)</label>
                    <Input 
                      placeholder="how-to-apply"
                      value={formData.slug}
                      onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-surface-500">Целевая аудитория</label>
                    <select
                      className="glass-input w-full p-2 rounded-lg text-sm bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700"
                      value={formData.target_role}
                      onChange={e => setFormData({ ...formData, target_role: e.target.value as any })}
                    >
                      <option value="">Всем (Общие темы)</option>
                      <option value="student">Студенты (Исполнители)</option>
                      <option value="employee">Заказчики (Сотрудники)</option>
                    </select>
                  </div>
                  <div className="flex items-center h-full pt-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-primary-500 text-primary-600 focus:ring-primary-500"
                        checked={formData.is_published}
                        onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                      />
                      <span className="text-sm font-medium text-surface-700 dark:text-surface-200 group-hover:text-primary-600 transition-colors">Опубликовать статью</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-surface-500">Содержание</label>
                  <textarea
                    className="glass-input w-full p-3 rounded-xl min-h-[150px] text-sm bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-primary-500/20"
                    placeholder="Подробно опишите инструкции или ответ на вопрос..."
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="ghost" onClick={() => { setIsAdding(false); setIsEditing(null); }}>
                    Отменить
                  </Button>
                  <Button onClick={() => isAdding ? handleCreate() : handleUpdate(isEditing!)} className="gap-2">
                    <Save className="w-4 h-4" /> {isAdding ? 'Создать' : 'Сохранить изменения'}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-surface-500 uppercase tracking-widest px-1 flex items-center gap-2">
          <Users className="w-4 h-4" /> Список статей ({articles.length})
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          {articles.map((article) => (
            <Card key={article.id} className="group hover:border-primary-500/30 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-surface-900 dark:text-white">{article.title}</h4>
                    {!article.is_published && (
                      <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md uppercase font-black">Черновик</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-surface-400 font-mono tracking-tighter">/{article.slug}</span>
                    <span className="w-1 h-1 rounded-full bg-surface-300"></span>
                    {getRoleBadge(article.target_role)}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(article)} className="h-8 w-8 p-0">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(article.id)} className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-surface-600 dark:text-surface-400 line-clamp-2 italic">
                {article.content}
              </div>
            </Card>
          ))}
          
          {articles.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-surface-200 dark:border-surface-800 rounded-2xl text-surface-400">
              <BookOpenText className="w-12 h-12 mx-auto mb-4 opacity-10" />
              <p>Статей пока нет. Начните с создания первой!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BookOpenText = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    <path d="M8 7h6" />
    <path d="M8 11h8" />
    <path d="M8 15h6" />
  </svg>
);
