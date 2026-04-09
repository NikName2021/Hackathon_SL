import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import type { User } from '@/types';
import { apiClient, setAccessToken } from '@/api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
  });

  const refreshUser = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await apiClient.get<User>('/auth/getIdentity');
      setState({ user: response.data, isLoading: false });
    } catch (error) {
      setState({ user: null, isLoading: false });
    }
  };

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      refreshUser();
    }
  }, []);

  const login = (userData: User) => {
    setState({ user: userData, isLoading: false });
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.error(e);
    }
    setAccessToken(null);
    setState({ user: null, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ 
      user: state.user, 
      isLoading: state.isLoading, 
      login, 
      logout, 
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
