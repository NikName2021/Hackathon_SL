import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LogOut, LayoutDashboard, Briefcase, Plus, CheckSquare, Settings, ListChecks, Users, ShieldAlert } from 'lucide-react';
import { cn } from '@/components/ui/Button';

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Дашборд', path: '/', icon: LayoutDashboard, roles: ['student', 'employee', 'admin'] },
    { name: 'Каталог задач', path: '/tasks', icon: Briefcase, roles: ['student'] },
    { name: 'Мои задачи', path: '/tasks/my', icon: ListChecks, roles: ['student'] },
    { name: 'Создать задачу', path: '/tasks/new', icon: Plus, roles: ['employee', 'admin'] },
    { name: 'Отклики', path: '/applications', icon: Users, roles: ['employee'] },
    { name: 'На проверку', path: '/reviews', icon: CheckSquare, roles: ['employee'] },
    { name: 'Аналитика', path: '/admin', icon: Settings, roles: ['admin'] },
    { name: 'Модерация', path: '/moderation', icon: ShieldAlert, roles: ['admin'] },
  ];

  return (
    <div className="min-h-screen flex text-surface-900 dark:text-white bg-gradient-to-br from-surface-50 to-primary-50 dark:from-surface-900 dark:to-primary-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white/60 dark:bg-black/40 backdrop-blur-xl border-r border-white/20 dark:border-white/10 flex flex-col transition-all">
        <div className="p-6 border-b border-white/20 dark:border-white/10">
          <div className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-purple-500">
            TaskBoard.
          </div>
        </div>

        <div className="flex-1 px-4 py-6 space-y-2">
          {navItems
            .filter((item) => user?.role && item.roles.includes(user.role))
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                    isActive 
                      ? "bg-primary-600 text-white shadow-md shadow-primary-600/20" 
                      : "text-surface-600 dark:text-surface-300 hover:bg-white/50 dark:hover:bg-white/5"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
        </div>

        <div className="p-4 border-t border-white/20 dark:border-white/10">
          <div className="px-4 py-3 bg-white/40 dark:bg-white/5 rounded-xl mb-4">
            <p className="font-semibold text-sm truncate">{user?.full_name}</p>
            <p className="text-xs text-primary-600 dark:text-primary-400 font-medium capitalize">{user?.role}</p>
            
            <div className="mt-3 flex justify-between text-xs font-medium bg-white/50 dark:bg-black/30 rounded-lg p-2">
              <div className="text-center">
                <div className="text-surface-500 dark:text-surface-400">Очки</div>
                <div className="text-primary-600 text-base font-bold">{user?.points ?? 0}</div>
              </div>
              <div className="text-center border-l border-surface-200 dark:border-surface-700 pl-3">
                <div className="text-surface-500 dark:text-surface-400">Репутация</div>
                <div className="text-purple-600 text-base font-bold">
                  {typeof user?.reputation === 'number' ? user.reputation.toFixed(1) : '0.0'}
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors font-medium text-sm"
          >
            <LogOut className="w-5 h-5" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full h-screen">
        <div className="max-w-6xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
