import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpenText, ChevronDown, Link as LinkIcon } from 'lucide-react';

import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import type { FAQArticle } from '@/types';

export const FAQ: React.FC = () => {
  const [articles, setArticles] = useState<FAQArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const { user } = useAuth();

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

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpenText className="w-7 h-7 text-primary-600" />
          <h1 className="text-3xl font-bold">База знаний</h1>
        </div>
        {user?.role === 'admin' && (
          <Link to="/admin/faq">
            <Button size="sm" variant="outline" className="gap-2 rounded-full px-5">
              Управление
            </Button>
          </Link>
        )}
      </div>

      {articles.length === 0 ? (
        <Card className="text-center p-10 text-surface-500 glass-card">Пока нет опубликованных материалов.</Card>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => {
            const isExpanded = expandedIds.includes(article.id);
            return (
              <Card 
                key={article.id} 
                className={`overflow-hidden transition-all duration-300 border ${isExpanded ? 'ring-1 ring-primary-500/30 border-primary-500/30 shadow-lg' : 'hover:border-primary-500/20 shadow-sm cursor-pointer'}`}
                onClick={() => toggleExpand(article.id)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-surface-900 dark:text-white transition-colors">
                      {article.title}
                    </h2>
                    <div className="flex items-center gap-2 text-[10px] text-surface-400 font-mono tracking-tight uppercase opacity-70">
                      <LinkIcon className="w-2.5 h-2.5" /> /{article.slug}
                    </div>
                  </div>
                  <div className={`p-2 rounded-full bg-surface-50 dark:bg-white/5 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-primary-50 text-primary-600' : ''}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 mt-4 border-t border-surface-100 dark:border-white/5 text-surface-600 dark:text-surface-300 whitespace-pre-wrap leading-relaxed">
                        {article.content}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
