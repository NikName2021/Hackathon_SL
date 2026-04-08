import React, { useEffect, useState } from 'react';
import { Search, Shield, UserCog } from 'lucide-react';

import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Role, User } from '@/types';

type RoleFilter = '' | Role;
type ActiveFilter = '' | 'true' | 'false';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | boolean> = {};
      if (search.trim()) {
        params.search = search.trim();
      }
      if (roleFilter) {
        params.role = roleFilter;
      }
      if (activeFilter) {
        params.is_active = activeFilter === 'true';
      }
      const response = await apiClient.get<User[]>('/admin/users', { params });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, activeFilter]);

  const updateUser = async (userId: number, payload: { role?: Role; is_active?: boolean }) => {
    setUpdatingUserId(userId);
    try {
      await apiClient.patch(`/admin/users/${userId}`, payload);
      await loadUsers();
    } catch (error) {
      console.error('Failed to update user', error);
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-7 h-7 text-primary-600" />
        <h1 className="text-3xl font-bold">Управление пользователями</h1>
      </div>

      <Card className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              className="glass-input w-full pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по email/ФИО"
            />
          </div>
          <select
            className="glass-input w-full"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          >
            <option value="">Все роли</option>
            <option value="student">Student</option>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
          <select
            className="glass-input w-full"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
          >
            <option value="">Любой статус</option>
            <option value="true">Только активные</option>
            <option value="false">Только заблокированные</option>
          </select>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={loadUsers}>
            Применить
          </Button>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="py-8 text-center text-surface-500">Пользователи не найдены</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="text-left border-b border-surface-200/70 dark:border-white/10">
                  <th className="py-3 pr-4 text-xs uppercase tracking-wide text-surface-500">Пользователь</th>
                  <th className="py-3 pr-4 text-xs uppercase tracking-wide text-surface-500">Баллы</th>
                  <th className="py-3 pr-4 text-xs uppercase tracking-wide text-surface-500">Репутация</th>
                  <th className="py-3 pr-4 text-xs uppercase tracking-wide text-surface-500">Роль</th>
                  <th className="py-3 text-xs uppercase tracking-wide text-surface-500">Статус</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-surface-100/80 dark:border-white/5">
                    <td className="py-3 pr-4">
                      <div className="font-semibold">{user.full_name || 'Без имени'}</div>
                      <div className="text-xs text-surface-500">{user.email}</div>
                    </td>
                    <td className="py-3 pr-4 text-sm font-semibold">{user.points}</td>
                    <td className="py-3 pr-4 text-sm font-semibold">{user.reputation.toFixed(1)}</td>
                    <td className="py-3 pr-4">
                      <select
                        className="glass-input w-full max-w-[180px] text-sm"
                        value={user.role}
                        disabled={updatingUserId === user.id}
                        onChange={(e) => updateUser(user.id, { role: e.target.value as Role })}
                      >
                        <option value="student">student</option>
                        <option value="employee">employee</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="py-3">
                      <Button
                        type="button"
                        variant={user.is_active ? 'outline' : 'primary'}
                        size="sm"
                        leftIcon={<UserCog className="w-4 h-4" />}
                        isLoading={updatingUserId === user.id}
                        onClick={() => updateUser(user.id, { is_active: !user.is_active })}
                      >
                        {user.is_active ? 'Заблокировать' : 'Разблокировать'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
