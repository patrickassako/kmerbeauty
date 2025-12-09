import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../lib/api';
import { supabase } from '../lib/supabase';
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
  city?: string;
  region?: string;
  therapist?: any; // To store therapist details if they exist
}

interface AuthContextType {
  user: User | null;
  userMode: 'client' | 'provider';
  loading: boolean;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (data: SignInData) => Promise<void>;
  signOut: () => Promise<void>;
  switchRole: () => Promise<void>; // Kept for compatibility, but behavior changes
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userMode, setUserMode] = useState<'client' | 'provider'>('client');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    checkAuthStatus();
  }, []);

  // Update userMode when user changes
  useEffect(() => {
    if (user) {
      // If user is a provider, they can be in either mode. Default to provider if they just logged in?
      // Or keep existing mode if possible.
      // For now, if role is provider, default to provider mode on first load.
      if (user.role === 'provider' && userMode === 'client') {
        setUserMode('provider');
      } else if (user.role === 'client') {
        setUserMode('client');
      }
    }
  }, [user?.role]);

  const checkAuthStatus = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');

      if (accessToken && refreshToken) {
        // Restaurer la session Supabase
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          console.error('Failed to restore Supabase session:', sessionError);
        }

        // Try to get current user from backend
        const response = await api.get('/auth/me');
        let userData = response.data;

        // Fetch therapist details if they exist (regardless of role, to check for pending applications)
        const { data: therapist } = await supabase
          .from('therapists')
          .select('*')
          .eq('user_id', userData.id)
          .single();

        if (therapist) {
          userData = { ...userData, therapist };

          // If therapist is active but user role is client, upgrade to provider
          // This fixes issues where role might be out of sync
          if (therapist.is_active && userData.role !== 'provider') {
            console.log('🔄 Syncing user role to PROVIDER based on active therapist record');
            userData.role = 'provider';

            // Asynchronously update DB to fix inconsistency
            supabase
              .from('users')
              .update({ role: 'PROVIDER' })
              .eq('id', userData.id)
              .then(({ error }) => {
                if (error) console.error('Failed to sync role to DB:', error);
              });
          }
        }

        setUser(userData);

        // Set initial mode
        if (userData.role === 'provider') {
          // If they were last in client mode, maybe respect that? 
          // But for now, default to provider to ensure they see their dashboard
          setUserMode('provider');
        } else {
          setUserMode('client');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
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
        // Provider-specific fields
        ...(data.role === 'provider' && {
          businessName: data.businessName,
          bio: data.bio,
          experience: data.experience,
          isMobile: data.isMobile,
          latitude: 0,
          longitude: 0,
        }),
      });

      const { user: userData, accessToken, refreshToken } = response.data;

      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      await SecureStore.setItemAsync('user', JSON.stringify(userData));

      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      // Fetch therapist if needed (though on signup it might be included or we know it exists)
      const { data: therapist } = await supabase
        .from('therapists')
        .select('*')
        .eq('user_id', userData.id)
        .single();

      if (therapist) {
        userData.therapist = therapist;
        if (therapist.is_active && userData.role !== 'provider') {
          userData.role = 'provider';
          // No need to update DB here as signup just happened, but good for consistency
        }
      }

      if (userData.role === 'provider') {
        setUserMode('provider');
      } else {
        setUserMode('client');
      }

      setUser(userData);
    } catch (error: any) {
      console.error('Sign up error:', error);
      // ... existing error handling ...
      if (error.message === 'Network Error' || !error.response) {
        throw new Error(
          'Impossible de se connecter au serveur.\n\n' +
          'Vérifiez que:\n' +
          '1. Le backend est démarré (npm run start:dev dans /backend)\n' +
          '2. L\'URL de l\'API dans mobile/.env est correcte'
        );
      }
      const errorMessage = error.response?.data?.message || 'Sign up failed';
      if (errorMessage.includes('email')) throw new Error('Email déjà utilisé');
      if (errorMessage.includes('phone')) throw new Error('Numéro de téléphone déjà utilisé');
      throw new Error(errorMessage);
    }
  };

  const signIn = async (data: SignInData) => {
    try {
      const response = await api.post('/auth/signin', {
        emailOrPhone: data.emailOrPhone,
        password: data.password,
      });

      const { user: userData, accessToken, refreshToken } = response.data;

      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      await SecureStore.setItemAsync('user', JSON.stringify(userData));

      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      // Fetch therapist details
      const { data: therapist } = await supabase
        .from('therapists')
        .select('*')
        .eq('user_id', userData.id)
        .single();

      if (therapist) {
        userData.therapist = therapist;
        // Sync role if active
        if (therapist.is_active && userData.role !== 'provider') {
          userData.role = 'provider';
          supabase.from('users').update({ role: 'PROVIDER' }).eq('id', userData.id);
        }
      }

      setUser(userData);

      if (userData.role === 'provider') {
        setUserMode('provider');
      } else {
        setUserMode('client');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      // ... existing error handling ...
      if (error.message === 'Network Error' || !error.response) {
        throw new Error('Impossible de se connecter au serveur.');
      }
      const errorMessage = error.response?.data?.message || 'Sign in failed';
      if (errorMessage.includes('credentials') || errorMessage.includes('password')) {
        throw new Error('Email/téléphone ou mot de passe incorrect');
      } else if (errorMessage.includes('not found')) {
        throw new Error('Compte introuvable');
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

      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');
      await supabase.auth.signOut();
      setUser(null);
      setUserMode('client');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const deleteAccount = async () => {
    try {
      await api.delete('/auth/account');
      await signOut();
    } catch (error: any) {
      console.error('Delete account error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete account');
    }
  };

  const value = {
    user,
    userMode,
    loading,
    signUp,
    signIn,
    signOut,
    deleteAccount,
    switchRole: async () => {
      if (user) {
        if (user.role === 'provider') {
          // Provider can toggle mode freely
          setUserMode(prev => prev === 'client' ? 'provider' : 'client');
        } else {
          // Client cannot switch role directly here
          // This function might be called by legacy code, so we log a warning
          console.warn('Client cannot switch role directly. Use BecomeProvider flow.');
        }
      }
    },
    refreshUser: checkAuthStatus,
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
