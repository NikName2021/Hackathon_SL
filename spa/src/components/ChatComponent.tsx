import React, {useEffect, useRef, useState} from 'react';
import {apiClient} from '@/api/client';
import type {User} from '@/types';
import {Download, FileText, Loader2, Paperclip, Send, User as UserIcon, X, ShieldCheck, Lock, Info} from 'lucide-react';
import {Button} from './ui/Button';
import {Card} from './ui/Card';
import {motion, AnimatePresence} from 'framer-motion';
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
  is_secure_file?: boolean;
  created_at: string;
}

interface ChatComponentProps {
  taskId: number;
  taskTitle: string;
  isConfidential?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatComponent: React.FC<ChatComponentProps> = ({ taskId, taskTitle, isConfidential, isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const secureFileInputRef = useRef<HTMLInputElement>(null);

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
    } else {
      setMessages([]);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isSecure: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (isSecure) {
      formData.append('is_secure', 'true');
    }

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
      if (secureFileInputRef.current) secureFileInputRef.current.value = '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
          />

          {/* Sidebar Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full z-[70] w-full md:w-[500px] lg:w-[600px] bg-white dark:bg-surface-900 shadow-2xl flex flex-col border-l border-surface-200 dark:border-surface-800"
          >
            {/* Extended Header */}
            <div className="relative p-6 border-b border-surface-100 dark:border-surface-800 bg-gradient-to-br from-primary-600 to-primary-700 text-white overflow-hidden">
               {/* Decorative Circles */}
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 bg-primary-400/20 rounded-full blur-2xl" />

              <div className="relative flex justify-between items-start mb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose}
                  className="p-1 hover:bg-white/10 text-white -ml-2"
                >
                  <X className="w-6 h-6" />
                </Button>
                
                {isConfidential && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Защищенный канал
                  </div>
                )}
              </div>

              <div className="relative">
                <h3 className="text-xl font-black tracking-tight mb-1">Чат обсуждения</h3>
                <p className="text-sm text-white/80 font-medium line-clamp-2 leading-relaxed">
                  {taskTitle}
                </p>
              </div>
            </div>

            {/* Info bar if confidential */}
            {isConfidential && (
              <div className="bg-primary-50 dark:bg-primary-900/10 px-6 py-2 border-b border-primary-100 dark:border-primary-900/30 flex items-center gap-2 text-[10px] text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wide">
                <Info className="w-3 h-3" />
                Сверхсекретные документы помечаются водяными знаками
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-surface-200 dark:scrollbar-thumb-surface-800">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-surface-400 opacity-50 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                    <MessageSquareIcon className="w-10 h-10" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-surface-900 dark:text-white">История пуста</p>
                    <p className="text-xs">Напишите первое сообщение, чтобы начать диалог</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${isMe ? 'text-primary-500' : 'text-surface-500'}`}>
                            {isMe ? 'Вы' : msg.sender.full_name}
                          </span>
                          <span className="text-[10px] text-surface-400 font-mono">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div
                          className={`p-4 rounded-3xl text-sm shadow-sm transition-all duration-300 ${
                            isMe
                              ? 'bg-primary-600 text-white rounded-tr-none shadow-primary-600/20 hover:shadow-primary-600/40'
                              : 'bg-surface-50 dark:bg-surface-800/80 text-surface-900 dark:text-white rounded-tl-none border border-surface-100 dark:border-surface-700 hover:border-surface-200 dark:hover:border-surface-600'
                          }`}
                        >
                          {msg.file_url && (
                            <div className="mb-3">
                              {msg.is_secure_file && (
                                <div className="flex items-center gap-1.5 mb-3 px-2 py-1 rounded-lg bg-black/20 text-[9px] font-black uppercase tracking-widest text-white/90 w-fit backdrop-blur-sm">
                                  <Lock className="w-3 h-3 text-green-400" />
                                  Защищен вузом
                                </div>
                              )}
                              
                              {msg.file_type === 'image' ? (
                                <a 
                                  href={msg.file_url.startsWith('http') ? msg.file_url : `${baseUrl}${msg.file_url}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="block rounded-2xl overflow-hidden border border-black/5 dark:border-white/5 shadow-inner"
                                >
                                  <img 
                                    src={msg.file_url.startsWith('http') ? msg.file_url : `${baseUrl}${msg.file_url}`} 
                                    alt={msg.file_name}
                                    className="max-w-full h-auto max-h-72 object-cover hover:scale-105 transition-transform duration-500" 
                                  />
                                </a>
                              ) : (
                                <a 
                                  href={msg.file_url.startsWith('http') ? msg.file_url : `${baseUrl}${msg.file_url}`} 
                                  download 
                                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${
                                    isMe 
                                      ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                                      : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 hover:border-primary-500/50'
                                  }`}
                                >
                                  <div className={`p-3 rounded-xl ${isMe ? 'bg-white/10' : 'bg-surface-100 dark:bg-surface-800'}`}>
                                    <FileText className="w-6 h-6 opacity-70" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">{msg.file_name}</p>
                                    <p className="text-[9px] opacity-60 uppercase font-black tracking-widest">Скачать файл</p>
                                  </div>
                                  <Download className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                                </a>
                              )}
                            </div>
                          )}
                          <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Premium Input Area */}
            <div className="p-6 border-t border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
               <input 
                type="file" 
                ref={fileInputRef}
                onChange={(e) => handleFileChange(e, false)}
                className="hidden"
              />
              <input 
                type="file" 
                ref={secureFileInputRef}
                onChange={(e) => handleFileChange(e, true)}
                className="hidden"
              />

              <div className="relative bg-surface-50 dark:bg-surface-800/50 rounded-[2rem] border border-surface-200 dark:border-surface-800 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500/50 transition-all p-2">
                <form onSubmit={handleSendMessage} className="flex items-center gap-1">
                  <div className="flex gap-1 pl-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      title="Обычное вложение"
                      className="rounded-full w-10 h-10 p-0 text-surface-400 hover:text-primary-500 hover:bg-primary-500/10"
                    >
                      {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                    </Button>

                    {isConfidential && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => secureFileInputRef.current?.click()}
                        disabled={isUploading}
                        title="Безопасное вложение (Цифровой след)"
                        className="rounded-full w-10 h-10 p-0 text-green-500 hover:bg-green-500/10"
                      >
                         <ShieldCheck className="w-5 h-5" />
                      </Button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ваше сообщение..."
                    disabled={isUploading}
                    className="flex-1 bg-transparent border-none py-3 px-4 text-sm focus:ring-0 outline-none dark:text-white"
                  />

                  <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={!newMessage.trim() || isUploading}
                    variant="primary"
                    size="sm"
                    className="rounded-full w-12 h-12 p-0 flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/20"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </div>
              <p className="text-[9px] text-center text-surface-400 mt-3 uppercase tracking-tighter font-bold opacity-50">
                Защищенный протокол университетской связи
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const MessageSquareIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
