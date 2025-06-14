// context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi, LoginResponse } from '@/services/api';
import { useRouter } from 'expo-router';

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    userId?: string;
    email?: string;
    username?: string;
  } | null;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  updateUser: (updates: { email?: string; username?: string }) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const router = useRouter();

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
          const userId = await SecureStore.getItemAsync('userId') || undefined;
          const email = await SecureStore.getItemAsync('email') || undefined;
          const username = await SecureStore.getItemAsync('username') || undefined;
         
          setUser({ userId, email, username });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    // Call API with just email and password
    const response = await authApi.login({ email, password });
   
    // Handle successful response - store the data from response
    if (response.code === 200 && response.data) {
      await authApi.storeAuthData(response.data);
     
      // Set user state with the data we received from API
      setUser({
        userId: response.data.userId,
        email: response.data.email,
        username: response.data.username,
      });
      setIsAuthenticated(true);
    }
   
    return response;
  };

  const logout = async () => {
    await authApi.clearAuthData();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updates: { email?: string; username?: string }) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      user, 
      login, 
      logout,
      updateUser,
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