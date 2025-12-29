import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'employee' | 'admin';
}

interface AuthStore {
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoggedIn: false,
  login: (user: User) => set({ user, isLoggedIn: true }),
  logout: () => set({ user: null, isLoggedIn: false }),
  setUser: (user: User | null) => set({ user, isLoggedIn: user !== null }),
}));
