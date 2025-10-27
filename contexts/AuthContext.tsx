import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, Workspace } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string, remember?: boolean) => void;
  logout: () => void;
  register: (name: string, email: string, password?: string) => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useMockAuth = () => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
      try {
        const storedUser = localStorage.getItem('mockUser') || sessionStorage.getItem('mockUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to parse user from storage", error);
        localStorage.removeItem('mockUser');
        sessionStorage.removeItem('mockUser');
      }
    }, []);

    const isAuthenticated = !!user;

    const login = (email: string, password?: string, remember: boolean = false) => {
        const normalizedEmail = email.trim().toLowerCase();
        const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
        const userData = storedUsers[normalizedEmail];

        if (!userData) {
            throw new Error("Пользователь с таким email не найден.");
        }
        
        if (userData.password !== password) {
            throw new Error("Неверный пароль.");
        }

        const loggedInUser: User = { id: userData.id, name: userData.name, email: normalizedEmail };
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('mockUser', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
    };

    const register = (name: string, email: string, password?: string) => {
        if (!password || password.length < 8) {
            throw new Error("Пароль должен содержать не менее 8 символов.");
        }
        
        const normalizedEmail = email.trim().toLowerCase();

        const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
        if (storedUsers[normalizedEmail]) {
            throw new Error("Пользователь с таким email уже существует.");
        }
        
        const newUser: User = { id: `user_${Date.now()}`, name, email: normalizedEmail };
        
        storedUsers[normalizedEmail] = { ...newUser, password };
        localStorage.setItem('users', JSON.stringify(storedUsers));

        // Create a default workspace for the new user
        const allWorkspaces = JSON.parse(localStorage.getItem('all_workspaces') || '[]');
        const newWorkspace: Workspace = {
            id: uuidv4(),
            name: 'Мое пространство',
            owner: newUser.email,
            members: {},
            widgets: [],
            layouts: {},
        };
        localStorage.setItem('all_workspaces', JSON.stringify([...allWorkspaces, newWorkspace]));


        localStorage.setItem('mockUser', JSON.stringify(newUser));
        setUser(newUser);
    };
    
    const updateUser = (updatedUser: Partial<User>) => {
      if(user){
        const newUser = { ...user, ...updatedUser };
        const storage = localStorage.getItem('mockUser') ? localStorage : sessionStorage;
        storage.setItem('mockUser', JSON.stringify(newUser));
        setUser(newUser);

        const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
        if (storedUsers[user.email]) {
          storedUsers[user.email] = { ...storedUsers[user.email], ...updatedUser };
          localStorage.setItem('users', JSON.stringify(storedUsers));
        }
      }
    };

    const logout = () => {
        localStorage.removeItem('mockUser');
        sessionStorage.removeItem('mockUser');
        setUser(null);
    };
    
    return { user, isAuthenticated, login, logout, register, updateUser };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useMockAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};