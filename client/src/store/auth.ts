import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  username: string | null;
  id: number | null;
  isAdmin: boolean;
  userId: number | null;
  login: (token: string, username: string, id: number, isAdmin: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      id: null,
      isAdmin: false,
      userId: null,
      login: (token, username, id, isAdmin) => set({ token, username, id, isAdmin, userId: id }),
      logout: () => set({ token: null, username: null, id: null, isAdmin: false, userId: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
