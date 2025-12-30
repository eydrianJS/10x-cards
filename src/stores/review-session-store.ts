import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ReviewSession } from '../domain/entities';
import { ReviewSession as ReviewSessionType } from '../shared/types';

interface ReviewSessionState {
  currentSession: ReviewSession | null;
  sessions: ReviewSession[];
  isLoading: boolean;
  error: string | null;
}

interface ReviewSessionActions {
  startSession: (session: ReviewSession) => void;
  endCurrentSession: () => void;
  incrementCardsReviewed: () => void;
  addSession: (session: ReviewSession) => void;
  setSessions: (sessions: ReviewSession[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getUserSessions: (userId: string) => ReviewSession[];
  getSessionsByDeck: (deckId: string) => ReviewSession[];
  getSessionStats: (userId: string) => {
    totalSessions: number;
    totalCardsReviewed: number;
    averageSessionDuration: number;
    averageCompletionRate: number;
  };
  clearStore: () => void;
}

type ReviewSessionStore = ReviewSessionState & ReviewSessionActions;

export const useReviewSessionStore = create<ReviewSessionStore>()(
  immer((set, get) => ({
    // Initial state
    currentSession: null,
    sessions: [],
    isLoading: false,
    error: null,

    // Actions
    startSession: (session) => {
      set((state) => {
        state.currentSession = session;
        state.error = null;
      });
    },

    endCurrentSession: () => {
      set((state) => {
        if (state.currentSession) {
          const endedSession = state.currentSession.endSession();
          state.sessions.push(endedSession);
          state.currentSession = null;
        }
      });
    },

    incrementCardsReviewed: () => {
      set((state) => {
        if (state.currentSession) {
          state.currentSession = state.currentSession.incrementCardsReviewed();
        }
      });
    },

    addSession: (session) => {
      set((state) => {
        state.sessions.push(session);
      });
    },

    setSessions: (sessions) => {
      set((state) => {
        state.sessions = sessions.map(s => new ReviewSession(s));
        state.error = null;
      });
    },

    setLoading: (loading) => {
      set((state) => {
        state.isLoading = loading;
      });
    },

    setError: (error) => {
      set((state) => {
        state.error = error;
        state.isLoading = false;
      });
    },

    getUserSessions: (userId) => {
      const state = get();
      return state.sessions.filter(session => session.userId === userId);
    },

    getSessionsByDeck: (deckId) => {
      const state = get();
      return state.sessions.filter(session => session.deckId === deckId);
    },

    getSessionStats: (userId) => {
      const state = get();
      const userSessions = state.getUserSessions(userId);

      if (userSessions.length === 0) {
        return {
          totalSessions: 0,
          totalCardsReviewed: 0,
          averageSessionDuration: 0,
          averageCompletionRate: 0,
        };
      }

      const totalCardsReviewed = userSessions.reduce((sum, session) => sum + session.cardsReviewed, 0);
      const totalDuration = userSessions.reduce((sum, session) => sum + session.getDurationMinutes(), 0);
      const totalCompletionRate = userSessions.reduce((sum, session) => sum + session.getCompletionPercentage(), 0);

      return {
        totalSessions: userSessions.length,
        totalCardsReviewed,
        averageSessionDuration: Math.round(totalDuration / userSessions.length),
        averageCompletionRate: Math.round(totalCompletionRate / userSessions.length),
      };
    },

    clearStore: () => {
      set((state) => {
        state.currentSession = null;
        state.sessions = [];
        state.error = null;
        state.isLoading = false;
      });
    },
  }))
);

// Selectors for better performance
export const useCurrentSession = () => useReviewSessionStore((state) => state.currentSession);
export const useSessions = () => useReviewSessionStore((state) => state.sessions);
export const useReviewSessionLoading = () => useReviewSessionStore((state) => state.isLoading);
export const useReviewSessionError = () => useReviewSessionStore((state) => state.error);
export const useUserSessions = (userId: string) => useReviewSessionStore((state) => state.getUserSessions(userId));
export const useSessionsByDeck = (deckId: string) => useReviewSessionStore((state) => state.getSessionsByDeck(deckId));
export const useSessionStats = (userId: string) => useReviewSessionStore((state) => state.getSessionStats(userId));
