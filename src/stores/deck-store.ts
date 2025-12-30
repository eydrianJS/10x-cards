import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Deck } from '../domain/entities';
import { Deck as DeckType } from '../shared/types';

interface DeckState {
  decks: Deck[];
  currentDeck: Deck | null;
  isLoading: boolean;
  error: string | null;
}

interface DeckActions {
  setDecks: (decks: Deck[]) => void;
  addDeck: (deck: Deck) => void;
  updateDeck: (id: string, updates: Partial<DeckType>) => void;
  removeDeck: (id: string) => void;
  setCurrentDeck: (deck: Deck | null) => void;
  incrementFlashcardCount: (deckId: string) => void;
  decrementFlashcardCount: (deckId: string) => void;
  setFlashcardCount: (deckId: string, count: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getUserDecks: (userId: string) => Deck[];
  getPublicDecks: () => Deck[];
  getDeckById: (id: string) => Deck | undefined;
  clearStore: () => void;
}

type DeckStore = DeckState & DeckActions;

export const useDeckStore = create<DeckStore>()(
  immer((set, get) => ({
    // Initial state
    decks: [],
    currentDeck: null,
    isLoading: false,
    error: null,

    // Actions
    setDecks: (decks) => {
      set((state) => {
        state.decks = decks.map(d => new Deck(d));
        state.error = null;
      });
    },

    addDeck: (deck) => {
      set((state) => {
        state.decks.push(deck);
      });
    },

    updateDeck: (id, updates) => {
      set((state) => {
        const index = state.decks.findIndex(d => d.id === id);
        if (index !== -1) {
          const existingDeck = state.decks[index];
          const updatedDeck = new Deck({ ...existingDeck, ...updates });
          state.decks[index] = updatedDeck;

          // Update current deck if it's the one being updated
          if (state.currentDeck?.id === id) {
            state.currentDeck = updatedDeck;
          }
        }
      });
    },

    removeDeck: (id) => {
      set((state) => {
        state.decks = state.decks.filter(d => d.id !== id);
        // Clear current deck if it's the one being removed
        if (state.currentDeck?.id === id) {
          state.currentDeck = null;
        }
      });
    },

    setCurrentDeck: (deck) => {
      set((state) => {
        state.currentDeck = deck;
      });
    },

    incrementFlashcardCount: (deckId) => {
      set((state) => {
        const index = state.decks.findIndex(d => d.id === deckId);
        if (index !== -1) {
          state.decks[index] = state.decks[index].incrementFlashcardCount();
        }
      });
    },

    decrementFlashcardCount: (deckId) => {
      set((state) => {
        const index = state.decks.findIndex(d => d.id === deckId);
        if (index !== -1) {
          state.decks[index] = state.decks[index].decrementFlashcardCount();
        }
      });
    },

    setFlashcardCount: (deckId, count) => {
      set((state) => {
        const index = state.decks.findIndex(d => d.id === deckId);
        if (index !== -1) {
          state.decks[index] = state.decks[index].setFlashcardCount(count);
        }
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

    getUserDecks: (userId) => {
      const state = get();
      return state.decks.filter(deck => deck.userId === userId);
    },

    getPublicDecks: () => {
      const state = get();
      return state.decks.filter(deck => deck.isPublic);
    },

    getDeckById: (id) => {
      const state = get();
      return state.decks.find(deck => deck.id === id);
    },

    clearStore: () => {
      set((state) => {
        state.decks = [];
        state.currentDeck = null;
        state.error = null;
        state.isLoading = false;
      });
    },
  }))
);

// Selectors for better performance
export const useDecks = () => useDeckStore((state) => state.decks);
export const useCurrentDeck = () => useDeckStore((state) => state.currentDeck);
export const useDeckLoading = () => useDeckStore((state) => state.isLoading);
export const useDeckError = () => useDeckStore((state) => state.error);
export const useUserDecks = (userId: string) => useDeckStore((state) => state.getUserDecks(userId));
export const usePublicDecks = () => useDeckStore((state) => state.getPublicDecks());
export const useDeckById = (id: string) => useDeckStore((state) => state.getDeckById(id));
