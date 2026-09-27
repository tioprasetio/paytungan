import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { User } from '../types';

const authStorage = createAsyncStorage('titipdong-auth-storage');

interface AuthState {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (user: User, token?: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  setHydrated: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      token: null,
      isAuthenticated: false,
      isHydrated: false,
      login: (user: User, token?: string) =>
        set({
          currentUser: user,
          token: token || get().token || null,
          isAuthenticated: true,
        }),
      updateUser: (updatedFields: Partial<User>) =>
        set((state) => ({
          currentUser: state.currentUser ? { ...state.currentUser, ...updatedFields } : null,
        })),
      logout: () =>
        set({
          currentUser: null,
          token: null,
          isAuthenticated: false,
        }),
      setHydrated: (val: boolean) => set({ isHydrated: val }),
    }),
    {
      name: 'titipdong-auth-storage',
      storage: createJSONStorage(() => authStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        currentUser: state.currentUser,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
