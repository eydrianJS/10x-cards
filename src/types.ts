/**
 * DTO (Data Transfer Object) and Command Model Type Definitions
 *
 * This file contains all type definitions for API requests and responses.
 * All types are derived from database entity types to ensure consistency.
 */

import type { Enums, Tables, TablesInsert, TablesUpdate } from './db/database.types';

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Pagination metadata for list endpoints
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Standard API response wrapper for single resources
 */
export interface ApiResponse<T> {
  data: T;
}

/**
 * Standard API response wrapper for lists with pagination
 */
export interface ApiListResponse<T> {
  data: T[];
  pagination?: PaginationMeta;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

/**
 * Health check response (GET /api/health)
 */
export interface HealthCheckResponseDto {
  status: 'ok';
  timestamp: string;
}

// =============================================================================
// DECK DTOs
// =============================================================================

/**
 * Deck list item with statistics (GET /api/decks)
 * Derived from deck_statistics view
 */
export type DeckListItemDto = Pick<
  Tables<'deck_statistics'>,
  'id' | 'name' | 'description' | 'total_cards' | 'due_cards' | 'created_at' | 'updated_at'
>;

/**
 * Detailed deck information (GET /api/decks/:id)
 * Same structure as list item
 */
export type DeckDetailDto = DeckListItemDto;

/**
 * Deck export structure (GET /api/decks/:id/export)
 */
export interface DeckExportDto {
  deck: DeckDetailDto & {
    exported_at: string;
  };
  flashcards: Array<
    Pick<
      Tables<'flashcards'>,
      | 'question'
      | 'answer'
      | 'next_review_date'
      | 'easiness_factor'
      | 'repetition_count'
      | 'interval'
    >
  >;
}

// =============================================================================
// DECK COMMANDS
// =============================================================================

/**
 * Create deck command (POST /api/decks)
 */
export type CreateDeckCommand = Pick<TablesInsert<'decks'>, 'name' | 'description'>;

/**
 * Update deck command (PATCH /api/decks/:id)
 * All fields are optional for partial updates
 */
export type UpdateDeckCommand = Partial<Pick<TablesUpdate<'decks'>, 'name' | 'description'>>;

// =============================================================================
// FLASHCARD DTOs
// =============================================================================

/**
 * Complete flashcard data transfer object
 * Derived from flashcards table
 */
export type FlashcardDto = Pick<
  Tables<'flashcards'>,
  | 'id'
  | 'deck_id'
  | 'question'
  | 'answer'
  | 'creation_method'
  | 'original_question'
  | 'original_answer'
  | 'edit_percentage'
  | 'easiness_factor'
  | 'repetition_count'
  | 'interval'
  | 'next_review_date'
  | 'created_at'
  | 'updated_at'
>;

/**
 * Minimal flashcard data for study sessions
 * Used in review session responses
 */
export type DueCardDto = Pick<
  Tables<'flashcards'>,
  'id' | 'question' | 'answer' | 'next_review_date'
>;

/**
 * Flashcard list response with pagination (GET /api/decks/:deckId/flashcards)
 */
export interface FlashcardListResponseDto {
  data: FlashcardDto[];
  pagination: PaginationMeta;
}

// =============================================================================
// FLASHCARD COMMANDS
// =============================================================================

/**
 * Create single flashcard command (POST /api/decks/:deckId/flashcards)
 * Derived from TablesInsert but excludes auto-generated and computed fields
 */
export type CreateFlashcardCommand = Pick<
  TablesInsert<'flashcards'>,
  | 'question'
  | 'answer'
  | 'creation_method'
  | 'original_question'
  | 'original_answer'
  | 'edit_percentage'
>;

/**
 * Bulk create flashcards command (POST /api/decks/:deckId/flashcards)
 * Used when creating multiple flashcards at once (typically from AI generation)
 */
export interface BulkCreateFlashcardsCommand {
  flashcards: CreateFlashcardCommand[];
}

/**
 * Update flashcard command (PATCH /api/flashcards/:id)
 * Allows updating question, answer, or moving to different deck
 */
export type UpdateFlashcardCommand = Partial<
  Pick<TablesUpdate<'flashcards'>, 'question' | 'answer' | 'deck_id'>
>;

/**
 * Flashcard creation response (POST /api/decks/:deckId/flashcards)
 */
export interface CreateFlashcardResponseDto {
  data: FlashcardDto[];
  created_count: number;
}

// =============================================================================
// REVIEW SESSION DTOs
// =============================================================================

/**
 * Review session data transfer object
 * Derived from review_sessions table
 */
export type ReviewSessionDto = Pick<
  Tables<'review_sessions'>,
  'id' | 'deck_id' | 'started_at' | 'ended_at' | 'cards_reviewed'
>;

/**
 * Study session start/resume response (POST /api/decks/:deckId/study)
 */
export interface StudySessionStartDto {
  session: ReviewSessionDto;
  due_cards: DueCardDto[];
  total_due: number;
  is_resumed: boolean;
}

/**
 * Study session detail response (GET /api/review-sessions/:id)
 */
export interface StudySessionDetailDto {
  session: ReviewSessionDto;
  due_cards: DueCardDto[];
  total_due: number;
}

/**
 * Study session end response (PATCH /api/review-sessions/:id)
 * Includes calculated duration in seconds
 */
export type StudySessionEndDto = ReviewSessionDto & {
  duration_seconds: number;
};

// =============================================================================
// REVIEW COMMANDS
// =============================================================================

/**
 * End study session command (PATCH /api/review-sessions/:id)
 */
export interface EndStudyCommand {
  action: 'end';
}

/**
 * Submit flashcard review command (POST /api/review-sessions/:sessionId/review)
 */
export interface SubmitReviewCommand {
  flashcard_id: string;
  rating: Enums<'review_rating'>;
}

/**
 * Review submission response (POST /api/review-sessions/:sessionId/review)
 */
export interface SubmitReviewResponseDto {
  flashcard: Pick<
    Tables<'flashcards'>,
    'id' | 'easiness_factor' | 'repetition_count' | 'interval' | 'next_review_date'
  >;
  review: {
    id: string;
    rating: Enums<'review_rating'>;
    reviewed_at: string;
  };
  session: {
    cards_reviewed: number;
  };
}

// =============================================================================
// AI GENERATION DTOs
// =============================================================================

/**
 * Content types supported by AI generation
 */
export type AiContentType = 'academic' | 'technical' | 'general' | 'language';

/**
 * AI flashcard generation command (POST /api/ai-generate)
 */
export interface AiGenerateCommand {
  text: string;
  content_type?: AiContentType;
  count?: number;
}

/**
 * AI generated flashcard preview (before saving to database)
 */
export interface AiGeneratedFlashcardPreview {
  question: string;
  answer: string;
}

/**
 * AI generation response (POST /api/ai-generate)
 */
export interface AiGenerateResponseDto {
  flashcards: AiGeneratedFlashcardPreview[];
  generated_count: number;
  content_type: string;
}

// =============================================================================
// QUERY PARAMETERS
// =============================================================================

/**
 * Sort order for list endpoints
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Deck list query parameters (GET /api/decks)
 */
export interface DeckListQueryParams {
  sort?: 'name' | 'created_at' | 'updated_at' | 'due_cards';
  order?: SortOrder;
}

/**
 * Flashcard list query parameters (GET /api/decks/:deckId/flashcards)
 */
export interface FlashcardListQueryParams {
  search?: string;
  due_only?: boolean;
  sort?: 'created_at' | 'next_review_date' | 'question';
  order?: SortOrder;
  page?: number;
  limit?: number;
}

/**
 * Deck export query parameters (GET /api/decks/:id/export)
 */
export interface DeckExportQueryParams {
  format: 'csv' | 'json';
}
