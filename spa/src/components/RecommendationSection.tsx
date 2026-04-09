import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/api/client';
import type { RecommendedTask } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronRight, Award, User, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RecommendationSection: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 5;

  const fetchRecommendations = async (currentOffset: number) => {
    try {
      const response = await apiClient.get<RecommendedTask[]>(`/tasks/recommendations?limit=${LIMIT}&offset=${currentOffset}`);
      const newItems = response.data;
      
      if (currentOffset === 0) {
        setRecommendations(newItems);
      } else {
        setRecommendations(prev => [...prev, ...newItems]);
      }
      
      if (newItems.length < LIMIT) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load recommendations', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(0);
  }, []);

  const handleLoadMore = () => {
    const nextOffset = offset + LIMIT;
    setOffset(nextOffset);
    fetchRecommendations(nextOffset);
  };

  if (isLoading && offset === 0) return null;

  if (recommendations.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white leading-tight">Подходящие вам задачи</h3>
            <p className="text-sm text-surface-500">На основе ваших навыков и опыта</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {recommendations.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/tasks?taskId=${task.id}`}>
                <Card className="p-4 hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer group border-l-4 border-l-primary-500 relative overflow-hidden dark:bg-surface-800/50 backdrop-blur-sm">
                  <div className="absolute top-0 right-0 p-2 opacity-[0.03] dark:opacity-[0.05] scale-150 rotate-12 group-hover:scale-110 transition-transform">
                    <Target className="w-16 h-16 text-primary-600" />
                  </div>
                  
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 rounded-md">
                          {task.category}
                        </span>
                        {task.match_score >= 20 && (
                          <span className="text-[10px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1 neon-glow-green bg-green-50 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
                            <Award className="w-3 h-3 pulse-indicator" /> 
                            <span className="glitch-text" data-text="ТОП СОВПАДЕНИЕ">ТОП СОВПАДЕНИЕ</span>
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-surface-900 dark:text-white mb-1 group-hover:text-primary-600 transition-colors">
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-4 text-[11px] text-surface-500 dark:text-surface-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {task.owner_name}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-primary-600 dark:text-primary-400">
                          <Award className="w-3 h-3" /> {task.points_reward} KP
                        </span>
                      </div>
                      
                      {task.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {task.skills.map(skill => (
                            <span key={skill} className="text-[9px] font-medium px-1.5 py-0.5 bg-surface-100 dark:bg-white/5 text-surface-600 dark:text-surface-400 rounded-md border border-surface-200/50 dark:border-white/5">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 shrink-0">
                       <div className="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 w-9 h-9 rounded-full flex items-center justify-center border-2 border-white dark:border-surface-700 shadow-sm">
                          {task.match_score}
                       </div>
                       <div className="p-1.5 bg-surface-50 dark:bg-white/5 text-surface-400 rounded-full group-hover:bg-primary-600 group-hover:text-white transition-all">
                          <ChevronRight className="w-4 h-4" />
                       </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <Button 
          variant="outline" 
          onClick={handleLoadMore}
          className="w-full py-2.5 text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-xl"
        >
          Показать еще варианты
        </Button>
      )}
    </motion.div>
  );
};
