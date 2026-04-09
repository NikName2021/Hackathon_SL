import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';

import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      setIsLoading(false);
      return;
    }

    try {
      await apiClient.post('/auth/password-reset-confirm', {
        token: token,
        new_password: password
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при изменении пароля. Возможно, ссылка устарела.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="text-center p-12 space-y-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold">Пароль изменен</h2>
            <p className="text-surface-600 dark:text-surface-400">
              Ваш новый пароль успешно сохранен. Теперь вы можете войти в систему.
            </p>
            <Link to="/login" className="block pt-4">
              <Button className="w-full">
                Войти
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-4">
          <h2 className="text-xl font-bold text-red-600">Некорректная ссылка</h2>
          <p>Токен сброса пароля отсутствует или поврежден.</p>
          <Link to="/forgot-password">
            <Button variant="outline">Запросить новую ссылку</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold mb-2"
          >
            Новый пароль
          </motion.h1>
          <p className="text-surface-600 dark:text-surface-400">
            Введите и подтвердите ваш новый пароль
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Новый пароль"
                  label="Новый пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-[38px]" />
              </div>

              <div className="relative">
                <Input
                  type="password"
                  placeholder="Подтвердите пароль"
                  label="Подтверждение"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                />
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-[38px]" />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-3 bg-red-100 text-red-600 text-sm rounded-xl border border-red-200"
              >
                {error}
              </motion.div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Сбросить пароль
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
