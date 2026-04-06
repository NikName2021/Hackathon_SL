import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { apiClient, setAccessToken } from '@/api/client';
import { AuthResponse } from '@/types';
import { Lock, Mail, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', {
        email,
        password,
        username: fullName,
      });
      setAccessToken(response.data.token.access_token);
      login(response.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка регистрации.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-purple-600 mb-2"
          >
            Добро пожаловать!
          </motion.h1>
          <p className="text-surface-600 dark:text-surface-400">
            Создайте аккаунт и начните путь к успеху
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Фамилия Имя"
                  label="ФИО"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                  required
                />
                <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-[38px]" />
              </div>

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
              
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Придумайте пароль"
                  label="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              Зарегистрироваться
            </Button>
          </form>

          <p className="text-center mt-6 text-sm text-surface-600 dark:text-surface-400">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
              Войти
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};
