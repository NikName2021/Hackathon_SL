import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User as UserIcon, 
  Award, 
  Star, 
  Camera, 
  FileText, 
  Plus, 
  X, 
  Save, 
  Download, 
  Upload,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Zap,
  Target,
  Users,
  BookOpen,
  Medal,
  Eye
} from 'lucide-react';
import { userApi } from '@/api/user';
import { skillApi } from '@/api/skill';
import { gamificationApi } from '@/api/gamification';
import type { GamificationStats, Achievement, Skill } from '@/types';
import { SkillRadar } from '@/components/SkillRadar';

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [newSkill, setNewSkill] = useState('');
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [isUploading, setIsUploading] = useState<'avatar' | 'resume' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchGamificationData();
      fetchAvailableSkills();
    }
  }, [user?.id]);

  const fetchAvailableSkills = async () => {
    try {
      const skills = await skillApi.getAll();
      setAvailableSkills(skills);
    } catch (error) {
      console.error('Error fetching available skills:', error);
    }
  };

  const fetchGamificationData = async () => {
    try {
      const [statsData, achievementsData] = await Promise.all([
        gamificationApi.getUserStats(),
        gamificationApi.getAllAchievements()
      ]);
      setStats(statsData);
      setAllAchievements(achievementsData);
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    }
  };

  if (!user) return null;

  const handleSaveProfile = async () => {
    try {
      await userApi.updateProfile({ full_name: fullName, bio });
      await refreshUser();
      setIsEditing(false);
      showNotification('success', 'Профиль обновлен');
    } catch (error) {
      showNotification('error', 'Ошибка при обновлении профиля');
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    
    const currentSkills = user.skills?.map(s => s.name) || [];
    if (currentSkills.includes(newSkill.trim())) {
      setNewSkill('');
      return;
    }

    try {
      await userApi.updateSkills([...currentSkills, newSkill.trim()]);
      await refreshUser();
      setNewSkill('');
      fetchGamificationData(); // Refresh stats in case achievement unlocked
    } catch (error) {
      showNotification('error', 'Ошибка при добавлении навыка');
    }
  };

  const handleRemoveSkill = async (skillName: string) => {
    const currentSkills = user.skills?.map((s: any) => s.name) || [];
    try {
      await userApi.updateSkills(currentSkills.filter((s: string) => s !== skillName));
      await refreshUser();
      fetchGamificationData();
    } catch (error) {
      showNotification('error', 'Ошибка при удалении навыка');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'resume') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'Файл слишком большой (макс. 5МБ)');
      return;
    }

    setIsUploading(type);
    try {
      if (type === 'avatar') {
        await userApi.uploadAvatar(file);
      } else {
        await userApi.uploadResume(file);
      }
      await refreshUser();
      showNotification('success', type === 'avatar' ? 'Аватар обновлен' : 'Резюме загружено');
    } catch (error) {
      showNotification('error', 'Ошибка при загрузке файла');
    } finally {
      setIsUploading(null);
    }
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const getAchievementIcon = (iconType: string) => {
    switch (iconType) {
      case 'award': return <Award className="w-6 h-6" />;
      case 'star': return <Star className="w-6 h-6" />;
      case 'zap': return <Zap className="w-6 h-6" />;
      case 'target': return <Target className="w-6 h-6" />;
      case 'users': return <Users className="w-6 h-6" />;
      case 'book-open': return <BookOpen className="w-6 h-6" />;
      default: return <Award className="w-6 h-6" />;
    }
  };

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const isStudent = user.role === 'student';

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Notification */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-8 right-8 z-50 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 border ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-100 text-green-700' 
                : 'bg-red-50 border-red-100 text-red-700'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section with Level Progress */}
      <Card className={`p-8 relative overflow-hidden border-none text-white ${
        isStudent 
          ? 'bg-gradient-to-br from-primary-600 via-primary-700 to-purple-800' 
          : 'bg-surface-900 dark:bg-white/5 shadow-2xl'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full -ml-32 -mb-32 blur-3xl opacity-20" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <div className="relative group/avatar">
            <div className="w-32 h-32 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden border-4 border-white/30 shadow-2xl relative transition-transform duration-300 group-hover/avatar:scale-105">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url.startsWith('http') ? user.avatar_url : `${baseUrl}${user.avatar_url}`} 
                  alt={user.full_name ?? 'User avatar'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-16 h-16 text-white/60" />
              )}
              
              {isUploading === 'avatar' && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            
            <button 
              onClick={() => avatarInputRef.current?.click()}
              disabled={!!isUploading}
              className="absolute -bottom-2 -right-2 p-3 bg-white text-primary-600 rounded-2xl shadow-lg border-none hover:bg-primary-50 transition-colors cursor-pointer group-hover/avatar:scale-110"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={avatarInputRef} 
              onChange={(e) => handleFileChange(e, 'avatar')} 
              className="hidden" 
              accept="image/*"
            />
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold">{user.full_name}</h1>
              <p className="text-white/80 font-medium capitalize flex items-center justify-center md:justify-start gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                {user.role} • Ранг #{stats?.rank || '...'}
              </p>
            </div>

            {stats && (
              <div className="space-y-2 max-w-md">
                <div className="flex justify-between text-sm font-bold">
                  <span>Уровень {stats.level}</span>
                  <span className="opacity-80">{stats.total_points % 100} / 100 XP</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.progress_percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                  />
                </div>
                <p className="text-xs opacity-70 italic text-right">
                  До следующего уровня: {stats.points_to_next_level} KP
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 min-w-[100px]">
              <div className="text-2xl font-black">{user.points}</div>
              <div className="text-[10px] uppercase font-bold opacity-70 tracking-widest leading-none mt-1">Очки (KP)</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 min-w-[100px]">
              <div className="text-2xl font-black">{user.reputation.toFixed(1)}</div>
              <div className="text-[10px] uppercase font-bold opacity-70 tracking-widest leading-none mt-1">Репутация</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Aspect: Info & Achievements */}
        <div className="flex-1 space-y-8">
           {/* Achievements Section */}
           <Card className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2 text-surface-900 dark:text-white">
                <Medal className="w-6 h-6 text-yellow-500" />
                Достижения
              </h3>
              <span className="text-xs font-bold bg-surface-100 dark:bg-white/10 px-3 py-1 rounded-full text-surface-500 uppercase tracking-wider">
                {stats?.achievements.length || 0} / {allAchievements.length || 5}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {allAchievements.map((achievement: Achievement) => {
                const isEarned = stats?.achievements.some((a: Achievement) => a.id === achievement.id);
                return (
                  <div 
                    key={achievement.id}
                    className={`flex flex-col items-center text-center group cursor-help transition-all duration-300 ${
                      isEarned ? 'opacity-100' : 'opacity-40 grayscale hover:opacity-60'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl mb-2 flex items-center justify-center transition-transform group-hover:scale-110 ${
                      isEarned 
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg shadow-orange-500/20' 
                        : 'bg-surface-100 dark:bg-white/10 text-surface-400'
                    }`}>
                      {getAchievementIcon(achievement.icon_type)}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tight text-surface-700 dark:text-surface-300 line-clamp-1 w-full">
                      {achievement.name}
                    </span>
                    
                    {/* Tooltip emulation */}
                    <div className="hidden group-hover:block absolute z-20 mt-16 p-2 bg-black/80 backdrop-blur text-white text-[10px] rounded-lg max-w-[120px] shadow-2xl pointer-events-none">
                      {achievement.description}
                      {!isEarned && <div className="mt-1 text-orange-400 font-bold">Еще не получено</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-surface-900 dark:text-white">
                Личная информация
              </h3>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Редактировать
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    Отмена
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveProfile} leftIcon={<Save className="w-4 h-4" />}>
                    Сохранить
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-surface-500 ml-1">Полное имя</label>
                {isEditing ? (
                  <Input 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    placeholder="Ваше имя"
                  />
                ) : (
                  <p className="p-4 bg-surface-50 dark:bg-surface-800/10 rounded-2xl border border-transparent font-medium">
                    {user.full_name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-surface-500 ml-1">О себе</label>
                {isEditing ? (
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Расскажите о своих навыках и опыте..."
                    className="w-full h-32 p-4 bg-surface-50 dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-sans"
                  />
                ) : (
                  <p className="p-4 bg-surface-50 dark:bg-surface-800/10 rounded-2xl border border-transparent min-h-[100px] text-surface-600 dark:text-surface-300 leading-relaxed italic">
                    {user.bio || 'Информация не заполнена...'}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Aspect: Skills & Document */}
        <div className="w-full lg:w-1/3 space-y-8">
          {stats?.skill_distribution && stats.skill_distribution.length > 0 && (
            <Card className="p-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Target className="w-24 h-24" />
              </div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Радар компетенций
              </h3>
              <SkillRadar data={stats.skill_distribution} size={250} />
              <p className="text-[10px] text-center text-surface-400 mt-4 italic">
                График обновляется на основе ваших подтвержденных навыков и выполненных задач
              </p>
            </Card>
          )}

          <Card className="p-8 space-y-6 bg-gradient-to-br from-white to-surface-50 dark:from-surface-900 dark:to-surface-800/50">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Star className="w-6 h-6 text-purple-500" />
              Навыки
            </h3>
            
            <form onSubmit={handleAddSkill} className="flex gap-2">
              <div className="flex-1">
                <Input 
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Python, UI..."
                  list="skills-list"
                  autoComplete="off"
                />
                <datalist id="skills-list">
                  {availableSkills.map(skill => (
                    <option key={skill.id} value={skill.name} />
                  ))}
                </datalist>
              </div>
              <Button type="submit" variant="primary" className="px-4 rounded-2xl">
                <Plus className="w-5 h-5" />
              </Button>
            </form>

            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {user.skills && user.skills.length > 0 ? (
                  user.skills.map((skill: any) => (
                    <motion.div
                      key={skill.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="px-3 py-1.5 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 rounded-xl border border-surface-100 dark:border-surface-700 shadow-sm flex items-center gap-2 group hover:border-primary-500/50 transition-colors"
                    >
                      <span className="text-xs font-bold">{skill.name}</span>
                      <button 
                        onClick={() => handleRemoveSkill(skill.name)}
                        className="text-surface-400 hover:text-red-500 transition-colors p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-surface-400 text-xs italic py-4">Список навыков пуст.</p>
                )}
              </AnimatePresence>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-surface-400" />
                Резюме
              </h3>
              <div className="flex gap-1">
                {user.resume_path && (
                  <>
                    <a 
                      href={user.resume_path.startsWith('http') ? user.resume_path : `${baseUrl}${user.resume_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Просмотреть"
                    >
                      <Eye className="w-5 h-5" />
                    </a>
                    <a 
                      href={user.resume_path.startsWith('http') ? user.resume_path : `${baseUrl}${user.resume_path}`}
                      download
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Скачать"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  </>
                )}
              </div>
            </div>

            {user.resume_path ? (
              <div className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-100 dark:border-surface-800 flex items-center justify-between">
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {user.resume_path.split('/').pop()}
                </span>
                <button 
                  onClick={() => resumeInputRef.current?.click()}
                  className="text-xs text-primary-600 font-bold hover:underline"
                >
                  Изменить
                </button>
              </div>
            ) : (
              <div 
                onClick={() => resumeInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-surface-200 dark:border-surface-800 rounded-2xl flex flex-col items-center gap-3 cursor-pointer hover:border-primary-500 hover:bg-primary-50/10 transition-all text-surface-400 group"
              >
                <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-xl group-hover:bg-primary-100 dark:group-hover:bg-primary-900 group-hover:text-primary-600 transition-colors">
                  {isUploading === 'resume' ? (
                    <div className="w-6 h-6 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                <p className="text-sm font-medium">Загрузить PDF</p>
              </div>
            )}
            <input 
              type="file" 
              ref={resumeInputRef} 
              onChange={(e) => handleFileChange(e, 'resume')} 
              className="hidden" 
              accept=".pdf,.doc,.docx"
            />
          </Card>
        </div>
      </div>
    </div>
  );
};
