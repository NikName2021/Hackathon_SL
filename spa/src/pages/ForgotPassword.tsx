import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, MailCheck } from 'lucide-react';

import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await apiClient.post('/auth/password-reset-request', { email });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при отправке запроса.');
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
            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <MailCheck className="w-10 h-10 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold">Проверьте почту</h2>
            <p className="text-surface-600 dark:text-surface-400">
              Если аккаунт с адресом <span className="font-bold text-primary-600">{email}</span> существует, мы отправили на него инструкции по сбросу пароля.
            </p>
            <Link to="/login" className="block pt-4">
              <Button variant="outline" className="w-full">
                Вернуться ко входу
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link to="/login" className="inline-flex items-center text-sm text-surface-500 hover:text-primary-600 transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Назад к входу
          </Link>
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold mb-2"
            >
              Восстановление пароля
            </motion.h1>
            <p className="text-surface-600 dark:text-surface-400">
              Введите email, и мы отправим вам ссылку для сброса пароля
            </p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Input
                type="email"
                placeholder="Ваш Email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-[38px]" />
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
              Отправить ссылку
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
