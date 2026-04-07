import React, { useEffect, useState, useRef } from 'react';
import { apiClient } from '@/api/client';
import type { User } from '@/types';
import { Send, User as UserIcon, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: number;
  task_id: number;
  sender_id: number;
  sender: User;
  content: string;
  created_at: string;
}

interface ChatComponentProps {
  taskId: number;
  taskTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatComponent: React.FC<ChatComponentProps> = ({ taskId, taskTitle, isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await apiClient.get<Message[]>(`/chat/${taskId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, taskId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage;
    setNewMessage('');
    setIsLoading(true);

    try {
      await apiClient.post(`/chat/${taskId}`, { content });
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg h-[600px] flex flex-col"
      >
        <Card className="flex-1 flex flex-col overflow-hidden border-primary-500/20 shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-primary-600 text-white">
            <div>
              <h3 className="font-bold flex items-center gap-2">
                Чат по задаче
              </h3>
              <p className="text-xs text-white/70 line-clamp-1">{taskTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-50 dark:bg-surface-900/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-surface-400 space-y-2">
                <div className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                  <UserIcon className="w-6 h-6" />
                </div>
                <p className="text-sm">Пока нет сообщений. Начните общение!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">
                          {isMe ? 'Вы' : msg.sender.full_name}
                        </span>
                        <span className="text-[10px] text-surface-400">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`p-3 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-primary-600 text-white rounded-tr-none shadow-lg shadow-primary-600/10'
                            : 'bg-white dark:bg-surface-800 text-surface-900 dark:text-white rounded-tl-none border border-surface-100 dark:border-surface-700 shadow-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Введите сообщение..."
                className="flex-1 bg-surface-50 dark:bg-surface-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 transition-all outline-none"
              />
              <Button
                type="submit"
                isLoading={isLoading}
                disabled={!newMessage.trim()}
                variant="primary"
                size="sm"
                className="rounded-xl px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};
