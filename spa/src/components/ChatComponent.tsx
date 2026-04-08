import React, {useEffect, useRef, useState} from 'react';
import {apiClient} from '@/api/client';
import {User} from '@/types';
import {Download, FileText, Loader2, Paperclip, Send, User as UserIcon, X} from 'lucide-react';
import {Button} from './ui/Button';
import {Card} from './ui/Card';
import {motion} from 'framer-motion';
import {useAuth} from '@/context/AuthContext';

interface Message {
  id: number;
  task_id: number;
  sender_id: number;
  sender: User;
  content: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
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
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (newMessage.trim()) {
      formData.append('content', newMessage);
      setNewMessage('');
    }

    try {
      await apiClient.post(`/chat/${taskId}/file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      fetchMessages();
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
                        className={`p-3 rounded-2xl text-sm space-y-2 ${
                          isMe
                            ? 'bg-primary-600 text-white rounded-tr-none shadow-lg shadow-primary-600/10'
                            : 'bg-white dark:bg-surface-800 text-surface-900 dark:text-white rounded-tl-none border border-surface-100 dark:border-surface-700 shadow-sm'
                        }`}
                      >
                        {msg.file_url && (
                          <div className="mb-2">
                            {msg.file_type === 'image' ? (
                              <a 
                                href={msg.file_url.startsWith('http') ? msg.file_url : `${baseUrl}${msg.file_url}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block rounded-lg overflow-hidden border border-black/10 dark:border-white/10"
                              >
                                <img 
                                  src={msg.file_url.startsWith('http') ? msg.file_url : `${baseUrl}${msg.file_url}`} 
                                  alt={msg.file_name}
                                  className="max-w-full h-auto max-h-48 object-cover hover:scale-105 transition-transform duration-300" 
                                />
                              </a>
                            ) : (
                              <a 
                                href={msg.file_url.startsWith('http') ? msg.file_url : `${baseUrl}${msg.file_url}`} 
                                download 
                                className={`flex items-center gap-2 p-2 rounded-xl border ${
                                  isMe 
                                    ? 'bg-white/10 border-white/20 text-white' 
                                    : 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700'
                                }`}
                              >
                                <FileText className="w-5 h-5 opacity-70" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-bold truncate">{msg.file_name}</p>
                                  <p className="text-[8px] opacity-60 uppercase font-black tracking-tighter">Скачать</p>
                                </div>
                                <Download className="w-4 h-4 opacity-50" />
                              </a>
                            )}
                          </div>
                        )}
                        <div>{msg.content}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="rounded-xl px-3 border-surface-200 dark:border-surface-700"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                ) : (
                  <Paperclip className="w-4 h-4 text-surface-500" />
                )}
              </Button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Введите сообщение..."
                disabled={isUploading}
                className="flex-1 bg-surface-50 dark:bg-surface-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 transition-all outline-none"
              />
              <Button
                type="submit"
                isLoading={isLoading}
                disabled={!newMessage.trim() || isUploading}
                variant="primary"
                size="sm"
                className="rounded-xl px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
