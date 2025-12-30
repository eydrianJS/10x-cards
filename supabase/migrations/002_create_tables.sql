-- Migration: 002_create_tables
-- Description: Create all application tables with constraints
-- Date: 2024-12-30
-- Dependencies: 001_create_enums.sql

-- =============================================================================
-- PROFILES TABLE
-- Extension of Supabase Auth users
-- =============================================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE profiles IS 'User profiles extending Supabase Auth - stores additional user data';
COMMENT ON COLUMN profiles.id IS 'References auth.users.id - same UUID as the authenticated user';

-- =============================================================================
-- DECKS TABLE
-- Flashcard collections organized by topic/subject
-- =============================================================================

CREATE TABLE decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT deck_name_not_empty CHECK (LENGTH(TRIM(name)) >= 1),
    CONSTRAINT deck_name_max_length CHECK (LENGTH(TRIM(name)) <= 100),
    CONSTRAINT unique_deck_name_per_user UNIQUE (user_id, name)
);

COMMENT ON TABLE decks IS 'Flashcard decks/collections organized by subject or topic';
COMMENT ON COLUMN decks.user_id IS 'Owner of the deck - foreign key to auth.users';
COMMENT ON COLUMN decks.name IS 'Unique deck name within user account (1-100 characters)';
COMMENT ON COLUMN decks.description IS 'Optional description of the deck contents';

-- =============================================================================
-- FLASHCARDS TABLE
-- Individual flashcards with SM-2 spaced repetition data
-- =============================================================================

CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Content
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    
    -- AI tracking
    creation_method creation_method NOT NULL,
    original_question TEXT,
    original_answer TEXT,
    edit_percentage DECIMAL(5,2),
    
    -- SM-2 Algorithm fields
    easiness_factor DECIMAL(4,2) DEFAULT 2.5 NOT NULL,
    repetition_count INTEGER DEFAULT 0 NOT NULL,
    interval INTEGER DEFAULT 0 NOT NULL,
    next_review_date DATE DEFAULT CURRENT_DATE NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT flashcard_question_not_empty CHECK (LENGTH(TRIM(question)) > 0),
    CONSTRAINT flashcard_answer_not_empty CHECK (LENGTH(TRIM(answer)) > 0),
    CONSTRAINT flashcard_ef_minimum CHECK (easiness_factor >= 1.3),
    CONSTRAINT flashcard_ef_reasonable_max CHECK (easiness_factor <= 5.0),
    CONSTRAINT flashcard_repetition_non_negative CHECK (repetition_count >= 0),
    CONSTRAINT flashcard_interval_non_negative CHECK (interval >= 0),
    CONSTRAINT flashcard_edit_percentage_range CHECK (edit_percentage IS NULL OR (edit_percentage >= 0 AND edit_percentage <= 100))
);

COMMENT ON TABLE flashcards IS 'Individual flashcards with SM-2 spaced repetition scheduling data';
COMMENT ON COLUMN flashcards.deck_id IS 'Parent deck containing this flashcard';
COMMENT ON COLUMN flashcards.user_id IS 'Denormalized user_id for RLS performance - synced from deck';
COMMENT ON COLUMN flashcards.question IS 'Front side of the flashcard - the question or prompt';
COMMENT ON COLUMN flashcards.answer IS 'Back side of the flashcard - the answer or response';
COMMENT ON COLUMN flashcards.creation_method IS 'How the flashcard was created: ai or manual';
COMMENT ON COLUMN flashcards.original_question IS 'Original AI-generated question before user edits (NULL for manual cards)';
COMMENT ON COLUMN flashcards.original_answer IS 'Original AI-generated answer before user edits (NULL for manual cards)';
COMMENT ON COLUMN flashcards.edit_percentage IS 'Percentage of content changed from AI original (0-100, NULL for manual)';
COMMENT ON COLUMN flashcards.easiness_factor IS 'SM-2 EF value - difficulty factor, minimum 1.3, default 2.5';
COMMENT ON COLUMN flashcards.repetition_count IS 'SM-2 n value - number of successful repetitions';
COMMENT ON COLUMN flashcards.interval IS 'SM-2 I value - current interval in days until next review';
COMMENT ON COLUMN flashcards.next_review_date IS 'Date when this card is due for review';

-- =============================================================================
-- REVIEW SESSIONS TABLE
-- Tracks study sessions for analytics
-- =============================================================================

CREATE TABLE review_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    cards_reviewed INTEGER DEFAULT 0 NOT NULL,
    
    -- Constraints
    CONSTRAINT session_end_after_start CHECK (ended_at IS NULL OR ended_at >= started_at),
    CONSTRAINT session_cards_non_negative CHECK (cards_reviewed >= 0)
);

COMMENT ON TABLE review_sessions IS 'Tracks individual study/review sessions for analytics';
COMMENT ON COLUMN review_sessions.user_id IS 'User conducting the review session';
COMMENT ON COLUMN review_sessions.deck_id IS 'Deck being reviewed in this session';
COMMENT ON COLUMN review_sessions.started_at IS 'When the review session started';
COMMENT ON COLUMN review_sessions.ended_at IS 'When the session ended - NULL means session is in progress';
COMMENT ON COLUMN review_sessions.cards_reviewed IS 'Total number of cards reviewed in this session';

-- =============================================================================
-- REVIEW HISTORY TABLE
-- Individual card review records for detailed analytics
-- =============================================================================

CREATE TABLE review_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES review_sessions(id) ON DELETE CASCADE,
    rating review_rating NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE review_history IS 'Individual flashcard review records within sessions';
COMMENT ON COLUMN review_history.flashcard_id IS 'The flashcard that was reviewed';
COMMENT ON COLUMN review_history.session_id IS 'The review session this review belongs to';
COMMENT ON COLUMN review_history.rating IS 'User self-assessment: again, hard, good, or easy';
COMMENT ON COLUMN review_history.reviewed_at IS 'Timestamp when the card was reviewed';

