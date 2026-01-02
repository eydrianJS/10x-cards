import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { User } from '../shared/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionExpiry?: Date;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setSessionExpiry: (expiry: Date) => void;
  logout: () => void;
  isSessionValid: () => boolean;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      user: null,
      isLoading: true,
      isAuthenticated: false,
      sessionExpiry: undefined,

      // Actions
      setUser: (user) => {
        set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
          state.isLoading = false;
          // Set session expiry to 30 days from now if user is set
          if (user) {
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 30);
            state.sessionExpiry = expiry;
          }
        });
      },

      setLoading: (loading) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      setSessionExpiry: (expiry) => {
        set((state) => {
          state.sessionExpiry = expiry;
        });
      },

      logout: () => {
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.sessionExpiry = undefined;
          state.isLoading = false;
        });
      },

      isSessionValid: () => {
        const state = get();
        if (!state.sessionExpiry || !state.isAuthenticated) {
          return false;
        }
        return new Date() < state.sessionExpiry;
      },
    })),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionExpiry: state.sessionExpiry,
      }),
    }
  )
);

// Selectors for better performance
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useSessionValid = () => useAuthStore((state) => state.isSessionValid());
