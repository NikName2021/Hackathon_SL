import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('Токен подтверждения отсутствует.');
        return;
      }

      try {
        await apiClient.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.response?.data?.detail || 'Ошибка при подтверждении почты.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="text-center p-12 space-y-6">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-primary-600 animate-spin mx-auto" />
              <h2 className="text-2xl font-bold">Проверка токена...</h2>
              <p className="text-surface-600 dark:text-surface-400">
                Пожалуйста, подождите, мы подтверждаем ваш адрес электронной почты.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold">Почта подтверждена!</h2>
              <p className="text-surface-600 dark:text-surface-400">
                Ваш аккаунт успешно активирован. Теперь вы можете войти в систему и пользоваться всеми функциями платформы.
              </p>
              <Link to="/login" className="block pt-4">
                <Button className="w-full">
                  Войти в систему
                </Button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold">Ошибка подтверждения</h2>
              <p className="text-red-600 dark:text-red-400 font-medium">
                {errorMessage}
              </p>
              <p className="text-sm text-surface-500">
                Возможно, ссылка устарела или уже была использована. Попробуйте войти, чтобы запросить новую ссылку (если функция реализована) или обратитесь в поддержку.
              </p>
              <Link to="/register" className="block pt-4">
                <Button variant="outline" className="w-full">
                  Вернуться к регистрации
                </Button>
              </Link>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
};
