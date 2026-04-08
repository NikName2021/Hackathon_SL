import React, { useEffect, useState } from 'react';
import { BookOpenText } from 'lucide-react';

import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/Card';
import type { FAQArticle } from '@/types';

export const FAQ: React.FC = () => {
  const [articles, setArticles] = useState<FAQArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFaq = async () => {
      try {
        const response = await apiClient.get<FAQArticle[]>('/faq/');
        setArticles(response.data);
      } catch (error) {
        console.error('Failed to load FAQ', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaq();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpenText className="w-7 h-7 text-primary-600" />
        <h1 className="text-3xl font-bold">База знаний</h1>
      </div>

      {articles.length === 0 ? (
        <Card className="text-center p-10 text-surface-500">Пока нет опубликованных материалов.</Card>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <Card key={article.id} className="space-y-3">
              <h2 className="text-xl font-semibold">{article.title}</h2>
              <p className="text-surface-600 dark:text-surface-300 whitespace-pre-wrap">{article.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
