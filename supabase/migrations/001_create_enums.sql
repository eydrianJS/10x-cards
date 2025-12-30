-- Migration: 001_create_enums
-- Description: Create custom ENUM types for the flashcard application
-- Date: 2024-12-30

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- Creation method for flashcards (AI-generated or manual)
CREATE TYPE creation_method AS ENUM ('ai', 'manual');

-- Rating options for spaced repetition review
CREATE TYPE review_rating AS ENUM ('again', 'hard', 'good', 'easy');

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TYPE creation_method IS 'Tracks how a flashcard was created - either by AI generation or manual entry';
COMMENT ON TYPE review_rating IS 'SM-2 algorithm rating options: again (forgot), hard, good, easy';

