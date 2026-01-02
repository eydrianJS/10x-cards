/**
 * Core domain types for the AI-powered flashcard application
 */

// Flashcard entity types
export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  deckId: string;
  creationMethod: 'ai' | 'manual';
  originalQuestion?: string;
  originalAnswer?: string;
  editPercentage?: number;
  createdAt: Date;
  updatedAt: Date;
  // SM-2 algorithm fields
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
  lastReviewedAt?: Date;
  quality?: number;
}

// Deck entity types
export interface Deck {
  id: string;
  name: string;
  description?: string;
  userId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  flashcardCount?: number;
}

// Review session types
export interface ReviewSession {
  id: string;
  userId: string;
  deckId: string;
  startedAt: Date;
  endedAt?: Date;
  cardsReviewed: number;
  totalCards: number;
}

// User types (from Supabase Auth)
export interface User {
  id: string;
  email: string;
  createdAt: Date;
  lastSignInAt?: Date;
}

// AI Generation types
export interface AIGenerationRequest {
  text: string;
  contentType?: 'academic' | 'technical' | 'general' | 'language';
  maxCards?: number;
}

export interface AIGenerationResponse {
  flashcards: Omit<
    Flashcard,
    | 'id'
    | 'deckId'
    | 'createdAt'
    | 'updatedAt'
    | 'easeFactor'
    | 'interval'
    | 'repetitions'
    | 'nextReviewDate'
  >[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// SM-2 Algorithm types
export interface SM2Quality {
  value: 0 | 1 | 2 | 3 | 4 | 5;
  description: string;
}

export const SM2_QUALITIES: SM2Quality[] = [
  { value: 0, description: 'Complete blackout' },
  { value: 1, description: 'Incorrect response; the correct one remembered' },
  { value: 2, description: 'Incorrect response; where the correct one seemed easy to recall' },
  { value: 3, description: 'Correct response recalled with serious difficulty' },
  { value: 4, description: 'Correct response after a hesitation' },
  { value: 5, description: 'Perfect response' },
];

// Form types
export interface CreateFlashcardForm {
  question: string;
  answer: string;
  deckId: string;
}

export interface CreateDeckForm {
  name: string;
  description?: string;
  isPublic?: boolean;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
}
