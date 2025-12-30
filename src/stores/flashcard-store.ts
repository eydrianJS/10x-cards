import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Flashcard } from '../domain/entities';
import { Flashcard as FlashcardType } from '../shared/types';

interface FlashcardState {
  flashcards: Flashcard[];
  currentCard: Flashcard | null;
  isLoading: boolean;
  error: string | null;
}

interface FlashcardActions {
  setFlashcards: (flashcards: Flashcard[]) => void;
  addFlashcard: (flashcard: Flashcard) => void;
  updateFlashcard: (id: string, updates: Partial<FlashcardType>) => void;
  removeFlashcard: (id: string) => void;
  setCurrentCard: (card: Flashcard | null) => void;
  applySM2Rating: (cardId: string, quality: 0 | 1 | 2 | 3 | 4 | 5) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getDueCards: (deckId?: string) => Flashcard[];
  getCardsByDeck: (deckId: string) => Flashcard[];
  clearStore: () => void;
}

type FlashcardStore = FlashcardState & FlashcardActions;

export const useFlashcardStore = create<FlashcardStore>()(
  immer((set, get) => ({
    // Initial state
    flashcards: [],
    currentCard: null,
    isLoading: false,
    error: null,

    // Actions
    setFlashcards: (flashcards) => {
      set((state) => {
        state.flashcards = flashcards.map(f => new Flashcard(f));
        state.error = null;
      });
    },

    addFlashcard: (flashcard) => {
      set((state) => {
        state.flashcards.push(flashcard);
      });
    },

    updateFlashcard: (id, updates) => {
      set((state) => {
        const index = state.flashcards.findIndex(f => f.id === id);
        if (index !== -1) {
          const existingCard = state.flashcards[index];
          const updatedCard = new Flashcard({ ...existingCard, ...updates });
          state.flashcards[index] = updatedCard;

          // Update current card if it's the one being updated
          if (state.currentCard?.id === id) {
            state.currentCard = updatedCard;
          }
        }
      });
    },

    removeFlashcard: (id) => {
      set((state) => {
        state.flashcards = state.flashcards.filter(f => f.id !== id);
        // Clear current card if it's the one being removed
        if (state.currentCard?.id === id) {
          state.currentCard = null;
        }
      });
    },

    setCurrentCard: (card) => {
      set((state) => {
        state.currentCard = card;
      });
    },

    applySM2Rating: (cardId, quality) => {
      set((state) => {
        const index = state.flashcards.findIndex(f => f.id === cardId);
        if (index !== -1) {
          const existingCard = state.flashcards[index];
          const updatedCard = existingCard.applySM2Algorithm(quality);
          state.flashcards[index] = updatedCard;

          // Update current card if it's the one being rated
          if (state.currentCard?.id === cardId) {
            state.currentCard = updatedCard;
          }
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

    getDueCards: (deckId) => {
      const state = get();
      const now = new Date();
      return state.flashcards.filter(card => {
        if (deckId && card.deckId !== deckId) return false;
        return card.isDue();
      });
    },

    getCardsByDeck: (deckId) => {
      const state = get();
      return state.flashcards.filter(card => card.deckId === deckId);
    },

    clearStore: () => {
      set((state) => {
        state.flashcards = [];
        state.currentCard = null;
        state.error = null;
        state.isLoading = false;
      });
    },
  }))
);

// Selectors for better performance
export const useFlashcards = () => useFlashcardStore((state) => state.flashcards);
export const useCurrentCard = () => useFlashcardStore((state) => state.currentCard);
export const useFlashcardLoading = () => useFlashcardStore((state) => state.isLoading);
export const useFlashcardError = () => useFlashcardStore((state) => state.error);
export const useDueCards = (deckId?: string) => useFlashcardStore((state) => state.getDueCards(deckId));
export const useCardsByDeck = (deckId: string) => useFlashcardStore((state) => state.getCardsByDeck(deckId));
