import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star, Search, TrendingUp } from 'lucide-react';
import { gamificationApi } from '@/api/gamification';
import { LeaderboardUser } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const Leaderboard: React.FC = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const data = await gamificationApi.getLeaderboard(50);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topThree = filteredUsers.slice(0, 3);
  const remainingUsers = filteredUsers.slice(3);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
            <Trophy className="text-yellow-500 w-8 h-8" />
            Рейтинг Студентов
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Лучшие из лучших на платформе TaskBoard</p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Поиск студента..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-white/5 border border-surface-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Podium */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-12 pb-8">
          {/* 2nd Place */}
          {topThree[1] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="order-2 md:order-1"
            >
              <Card className="text-center p-6 border-2 border-surface-200 bg-white/40 backdrop-blur-sm relative">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                  <Medal className="w-12 h-12 text-blue-400 drop-shadow-lg" />
                </div>
                <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                   {topThree[1].avatar_url ? (
                    <img src={topThree[1].avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-blue-600">{topThree[1].full_name[0]}</span>
                  )}
                </div>
                <h3 className="font-bold text-lg truncate">{topThree[1].full_name}</h3>
                <div className="flex items-center justify-center gap-2 mt-2 text-blue-600 font-bold">
                  <TrendingUp className="w-4 h-4" />
                  {topThree[1].reputation.toFixed(1)}
                </div>
                <div className="text-xs text-surface-500 mt-1">{topThree[1].points} KP</div>
              </Card>
            </motion.div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="order-1 md:order-2"
            >
              <Card className="text-center p-8 border-2 border-yellow-400 bg-gradient-to-b from-yellow-50 to-white dark:from-yellow-900/20 dark:to-surface-900 shadow-2xl scale-110 z-10 relative">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                  <Trophy className="w-16 h-16 text-yellow-500 drop-shadow-xl animate-bounce" />
                </div>
                <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-gradient-to-br from-yellow-100 to-yellow-300 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                  {topThree[0].avatar_url ? (
                    <img src={topThree[0].avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-yellow-700">{topThree[0].full_name[0]}</span>
                  )}
                </div>
                <h3 className="font-bold text-xl truncate">{topThree[0].full_name}</h3>
                <div className="flex items-center justify-center gap-2 mt-2 text-yellow-600 font-black text-2xl">
                  <Star className="w-6 h-6 fill-yellow-500 border-none" />
                  {topThree[0].reputation.toFixed(1)}
                </div>
                <div className="text-sm text-surface-500 mt-1 font-medium">{topThree[0].points} KP</div>
                
                <div className="mt-4 flex flex-wrap justify-center gap-1">
                  {topThree[0].skills.slice(0, 2).map((skill: string) => (
                    <span key={skill} className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-bold">
                      {skill}
                    </span>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="order-3"
            >
              <Card className="text-center p-6 border-2 border-surface-200 bg-white/40 backdrop-blur-sm relative">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                  <Medal className="w-12 h-12 text-orange-400 drop-shadow-lg" />
                </div>
                <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                  {topThree[2].avatar_url ? (
                    <img src={topThree[2].avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-orange-600">{topThree[2].full_name[0]}</span>
                  )}
                </div>
                <h3 className="font-bold text-lg truncate">{topThree[2].full_name}</h3>
                <div className="flex items-center justify-center gap-2 mt-2 text-orange-600 font-bold">
                  <TrendingUp className="w-4 h-4" />
                  {topThree[2].reputation.toFixed(1)}
                </div>
                <div className="text-xs text-surface-500 mt-1">{topThree[2].points} KP</div>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* List */}
      <Card className="overflow-hidden border-none bg-white/40 dark:bg-black/20 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-50 dark:bg-white/5 border-b border-surface-200 dark:border-white/10">
                <th className="px-6 py-4 text-left text-xs font-bold text-surface-500 uppercase tracking-widest">Место</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-surface-500 uppercase tracking-widest">Студент</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-surface-500 uppercase tracking-widest">Навыки</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-surface-500 uppercase tracking-widest">Репутация</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-surface-500 uppercase tracking-widest">Баллы (KP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-white/5">
              {remainingUsers.map((user) => (
                <motion.tr 
                  key={user.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="hover:bg-white/60 dark:hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-100 dark:bg-white/10 text-sm font-bold">
                      {user.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold overflow-hidden border-2 border-white shadow-sm">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          user.full_name[0]
                        )}
                      </div>
                      <span className="font-semibold">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.skills.slice(0, 3).map((skill: string) => (
                        <span key={skill} className="px-2 py-0.5 bg-surface-100 dark:bg-white/5 text-surface-600 dark:text-surface-400 rounded-md text-[10px]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 font-bold text-primary-600">
                      <Star className="w-3 h-3 fill-primary-500 border-none" />
                      {user.reputation.toFixed(1)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-surface-500">
                    {user.points} KP
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Leaderboard;
