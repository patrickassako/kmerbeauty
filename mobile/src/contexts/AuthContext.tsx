import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../lib/api';
import { SignUpData } from '../screens/SignUpScreen';
import { SignInData } from '../screens/SignInScreen';

interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'provider' | 'admin';
  language: 'fr' | 'en';
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (data: SignInData) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      if (accessToken) {
        // Try to get current user from backend
        const response = await api.get('/auth/me');
        setUser(response.data);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid tokens
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: SignUpData) => {
    try {
      const response = await api.post('/auth/signup', {
        email: data.email,
        phone: data.phone,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      });

      const { user: userData, accessToken, refreshToken } = response.data;

      // Store tokens
      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      await SecureStore.setItemAsync('user', JSON.stringify(userData));

      setUser(userData);
    } catch (error: any) {
      console.error('Sign up error:', error);

      // Extract error message
      const errorMessage = error.response?.data?.message || 'Sign up failed';

      if (errorMessage.includes('email')) {
        throw new Error('Email already in use');
      } else if (errorMessage.includes('phone')) {
        throw new Error('Phone number already in use');
      } else {
        throw new Error(errorMessage);
      }
    }
  };

  const signIn = async (data: SignInData) => {
    try {
      const response = await api.post('/auth/signin', {
        emailOrPhone: data.emailOrPhone,
        password: data.password,
      });

      const { user: userData, accessToken, refreshToken } = response.data;

      // Store tokens
      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      await SecureStore.setItemAsync('user', JSON.stringify(userData));

      setUser(userData);
    } catch (error: any) {
      console.error('Sign in error:', error);

      const errorMessage = error.response?.data?.message || 'Sign in failed';

      if (errorMessage.includes('credentials') || errorMessage.includes('password')) {
        throw new Error('Invalid email/phone or password');
      } else if (errorMessage.includes('not found')) {
        throw new Error('Account not found');
      } else {
        throw new Error(errorMessage);
      }
    }
  };

  const signOut = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (refreshToken) {
        await api.post('/auth/signout', { refreshToken });
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      // Clear local storage regardless of API call result
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
