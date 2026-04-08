import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/api/client';
import { RecommendedTask } from '@/types';
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

  if (isLoading && offset === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Zap className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">Подходящие вам задачи</h3>
            <p className="text-sm text-gray-500">На основе ваших навыков и опыта</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {recommendations.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/tasks?taskId=${task.id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer group border-l-4 border-l-blue-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 group-hover:scale-110 transition-transform">
                    <Target className="w-16 h-16 text-blue-600" />
                  </div>
                  
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                          {task.category}
                        </span>
                        {task.match_score >= 20 && (
                          <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                            <Award className="w-3 h-3" /> Топ совпадение
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {task.owner_name}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-blue-600">
                          <Award className="w-3 h-3" /> {task.points_reward} баллов
                        </span>
                      </div>
                      
                      {task.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {task.skills.map(skill => (
                            <span key={skill} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                       <div className="text-sm font-bold text-blue-600 bg-blue-50 w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                          {task.match_score}
                       </div>
                       <div className="p-1.5 bg-gray-50 text-gray-400 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all">
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
          fullWidth 
          onClick={handleLoadMore}
          className="py-3 text-gray-600 hover:text-blue-600"
        >
          Показать еще варианты
        </Button>
      )}
    </div>
  );
};
