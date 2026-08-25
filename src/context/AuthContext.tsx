import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types/database';
import { INITIAL_PROFILES } from '../lib/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DataStore } from '../lib/dataStore';

interface AuthContextType {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchDemoUser: (userId: string) => void;
  allProfiles: Profile[];
  refreshProfiles: () => Promise<void>;
  canEdit: boolean;
  canCreateOccurrence: boolean;
  canManageCadastros: boolean;
  canAdmin: boolean;
  isTecnico: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'IVCA_CURRENT_USER_V1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    // Default to Arthur Almeida (ENCARREGADO) or Adriano (ADMIN)
    return INITIAL_PROFILES[0];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [allProfiles, setAllProfiles] = useState<Profile[]>(INITIAL_PROFILES);

  const refreshProfiles = async () => {
    const p = await DataStore.getProfiles();
    if (p.length > 0) setAllProfiles([...p]);
  };

  useEffect(() => {
    refreshProfiles();

    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email) {
          DataStore.getProfiles().then((profiles) => {
            const found = profiles.find((p) => p.email.toLowerCase() === session.user.email?.toLowerCase());
            if (found) {
              setUser(found);
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
            }
          });
        }
      });
    }
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }
        if (data.user?.email) {
          const profiles = await DataStore.getProfiles();
          const profile = profiles.find((p) => p.email.toLowerCase() === data.user.email?.toLowerCase());
          if (profile) {
            setUser(profile);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
            setIsLoading(false);
            return { success: true };
          }
        }
      }

      // Local / Offline authentication by matching profile email or name
      const profiles = await DataStore.getProfiles();
      const profile = profiles.find(
        (p) => p.email.toLowerCase() === email.toLowerCase() || p.nome.toLowerCase().includes(email.toLowerCase())
      );

      if (profile) {
        setUser(profile);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Credenciais não encontradas no sistema da Vision Controls.' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Erro ao realizar login' };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const switchDemoUser = (userId: string) => {
    const profile = allProfiles.find((p) => p.id === userId);
    if (profile) {
      setUser(profile);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
    }
  };

  // Role permissions
  const role: UserRole = user?.role || 'VISUALIZADOR';
  const canEdit = ['ADMIN', 'GESTOR', 'ENCARREGADO', 'TECNICO'].includes(role);
  const canCreateOccurrence = ['ADMIN', 'GESTOR', 'ENCARREGADO', 'TECNICO'].includes(role);
  const canManageCadastros = ['ADMIN', 'GESTOR', 'ENCARREGADO'].includes(role);
  const canAdmin = ['ADMIN', 'GESTOR'].includes(role);
  const isTecnico = role === 'TECNICO';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchDemoUser,
        allProfiles,
        refreshProfiles,
        canEdit,
        canCreateOccurrence,
        canManageCadastros,
        canAdmin,
        isTecnico,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
