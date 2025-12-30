-- Migration: 004_create_indexes
-- Description: Create indexes for query performance optimization
-- Date: 2024-12-30
-- Dependencies: 002_create_tables.sql

-- =============================================================================
-- FLASHCARDS INDEXES
-- =============================================================================

-- Index for fetching all flashcards in a deck
CREATE INDEX idx_flashcards_deck_id 
    ON flashcards(deck_id);

-- Composite index for fetching due cards in a deck (most common query)
-- Used by: "SELECT * FROM flashcards WHERE deck_id = ? AND next_review_date <= CURRENT_DATE"
CREATE INDEX idx_flashcards_next_review_date 
    ON flashcards(deck_id, next_review_date);

-- Index for RLS policy performance (user_id checks)
CREATE INDEX idx_flashcards_user_id 
    ON flashcards(user_id);

-- =============================================================================
-- REVIEW SESSIONS INDEXES
-- =============================================================================

-- Composite index for user statistics and session lookup
CREATE INDEX idx_review_sessions_user_deck 
    ON review_sessions(user_id, deck_id);

-- Partial unique index to enforce one active session per deck per user
-- This prevents starting a new session before finishing the current one
CREATE UNIQUE INDEX idx_one_active_session_per_deck 
    ON review_sessions(user_id, deck_id) 
    WHERE ended_at IS NULL;

-- =============================================================================
-- REVIEW HISTORY INDEXES
-- =============================================================================

-- Index for fetching review history of a specific flashcard
CREATE INDEX idx_review_history_flashcard 
    ON review_history(flashcard_id);

-- Index for analytics queries (DAU, daily reviews, etc.)
CREATE INDEX idx_review_history_reviewed_at 
    ON review_history(reviewed_at);

-- Index for session-based queries
CREATE INDEX idx_review_history_session 
    ON review_history(session_id);

-- =============================================================================
-- DECKS INDEXES
-- =============================================================================

-- Index for fetching user's decks (used with RLS)
CREATE INDEX idx_decks_user_id 
    ON decks(user_id);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON INDEX idx_flashcards_deck_id IS 'Speeds up fetching all flashcards in a deck';
COMMENT ON INDEX idx_flashcards_next_review_date IS 'Optimizes due cards query - most frequently used';
COMMENT ON INDEX idx_flashcards_user_id IS 'Supports RLS policy checks on user_id';
COMMENT ON INDEX idx_review_sessions_user_deck IS 'Supports user statistics and session management';
COMMENT ON INDEX idx_one_active_session_per_deck IS 'Enforces single active session per deck per user';
COMMENT ON INDEX idx_review_history_flashcard IS 'Speeds up flashcard history lookups';
COMMENT ON INDEX idx_review_history_reviewed_at IS 'Supports analytics queries (DAU, etc.)';
COMMENT ON INDEX idx_review_history_session IS 'Speeds up session-based history queries';
COMMENT ON INDEX idx_decks_user_id IS 'Supports RLS policy checks and user deck listing';

