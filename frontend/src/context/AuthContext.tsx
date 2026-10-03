import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Owner } from '../types';
import { authApi } from '../services/api';
import { initClarity, identifyClarityUser, setClarityTag } from '../services/clarity';

interface AuthContextType {
  user: User | null;
  owner: Owner | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User, owner?: Owner | null) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateOwnerState: (updatedOwner: Owner) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('care_sync_token'));
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize Microsoft Clarity tracking
  useEffect(() => {
    initClarity();
  }, []);

  const refreshUser = async () => {
    const existingToken = localStorage.getItem('care_sync_token');
    if (!existingToken) {
      setUser(null);
      setOwner(null);
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      const u = res.data.user;
      setUser(u);
      setOwner(res.data.owner);

      if (u) {
        identifyClarityUser(u.id);
        setClarityTag('user_role', u.role);
      }
    } catch (err) {
      console.error('Failed to load authenticated user session:', err);
      localStorage.removeItem('care_sync_token');
      setToken(null);
      setUser(null);
      setOwner(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (newToken: string, newUser: User, newOwner: Owner | null = null) => {
    localStorage.setItem('care_sync_token', newToken);
    setToken(newToken);
    setUser(newUser);
    setOwner(newOwner);

    if (newUser) {
      identifyClarityUser(newUser.id);
      setClarityTag('user_role', newUser.role);
    }
  };

  const logout = () => {
    localStorage.removeItem('care_sync_token');
    setToken(null);
    setUser(null);
    setOwner(null);
  };

  const updateOwnerState = (updatedOwner: Owner) => {
    setOwner(updatedOwner);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        owner,
        token,
        loading,
        login,
        logout,
        refreshUser,
        updateOwnerState,
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
