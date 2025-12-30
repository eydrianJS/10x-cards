-- =============================================================================
-- FULL DATABASE MIGRATION
-- AI-Powered Flashcard Learning Application
-- =============================================================================
-- 
-- Description: Complete database schema in a single file
-- Date: 2024-12-30
-- Version: 1.0
--
-- This file combines all migrations for easy deployment.
-- Run this entire file in Supabase SQL Editor or via psql.
--
-- =============================================================================

-- #############################################################################
-- SECTION 1: ENUM TYPES
-- #############################################################################

-- Creation method for flashcards (AI-generated or manual)
CREATE TYPE creation_method AS ENUM ('ai', 'manual');

-- Rating options for spaced repetition review
CREATE TYPE review_rating AS ENUM ('again', 'hard', 'good', 'easy');

COMMENT ON TYPE creation_method IS 'Tracks how a flashcard was created - either by AI generation or manual entry';
COMMENT ON TYPE review_rating IS 'SM-2 algorithm rating options: again (forgot), hard, good, easy';


-- #############################################################################
-- SECTION 2: TABLES
-- #############################################################################

-- -----------------------------------------------------------------------------
-- PROFILES TABLE
-- Extension of Supabase Auth users
-- -----------------------------------------------------------------------------

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE profiles IS 'User profiles extending Supabase Auth - stores additional user data';
COMMENT ON COLUMN profiles.id IS 'References auth.users.id - same UUID as the authenticated user';

-- -----------------------------------------------------------------------------
-- DECKS TABLE
-- Flashcard collections organized by topic/subject
-- -----------------------------------------------------------------------------

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

-- -----------------------------------------------------------------------------
-- FLASHCARDS TABLE
-- Individual flashcards with SM-2 spaced repetition data
-- -----------------------------------------------------------------------------

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

-- -----------------------------------------------------------------------------
-- REVIEW SESSIONS TABLE
-- Tracks study sessions for analytics
-- -----------------------------------------------------------------------------

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

-- -----------------------------------------------------------------------------
-- REVIEW HISTORY TABLE
-- Individual card review records for detailed analytics
-- -----------------------------------------------------------------------------

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


-- #############################################################################
-- SECTION 3: FUNCTIONS AND TRIGGERS
-- #############################################################################

-- -----------------------------------------------------------------------------
-- FUNCTION: update_updated_at_column
-- Automatically updates the updated_at timestamp on row modification
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to auto-update updated_at timestamp on row modification';

-- Apply to profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to decks
CREATE TRIGGER update_decks_updated_at
    BEFORE UPDATE ON decks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to flashcards
CREATE TRIGGER update_flashcards_updated_at
    BEFORE UPDATE ON flashcards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- FUNCTION: handle_new_user
-- Creates a profile record when a new user registers via Supabase Auth
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile record automatically when user registers - SECURITY DEFINER to bypass RLS';

-- Trigger on auth.users (Supabase Auth table)
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- FUNCTION: set_flashcard_user_id
-- Syncs user_id from deck when flashcard is created (denormalization)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_flashcard_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Get user_id from the parent deck
    NEW.user_id := (SELECT user_id FROM decks WHERE id = NEW.deck_id);
    
    -- Ensure deck exists and user_id was found
    IF NEW.user_id IS NULL THEN
        RAISE EXCEPTION 'Deck not found or has no user_id: %', NEW.deck_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_flashcard_user_id() IS 'Automatically sets flashcard user_id from parent deck for RLS performance';

CREATE TRIGGER set_flashcard_user_id_trigger
    BEFORE INSERT ON flashcards
    FOR EACH ROW
    EXECUTE FUNCTION set_flashcard_user_id();

-- -----------------------------------------------------------------------------
-- FUNCTION: check_flashcard_limit
-- Enforces maximum 5000 flashcards per user
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION check_flashcard_limit()
RETURNS TRIGGER AS $$
DECLARE
    flashcard_count INTEGER;
    max_flashcards CONSTANT INTEGER := 5000;
BEGIN
    -- Count existing flashcards for this user
    SELECT COUNT(*) INTO flashcard_count
    FROM flashcards
    WHERE user_id = NEW.user_id;
    
    -- Check limit
    IF flashcard_count >= max_flashcards THEN
        RAISE EXCEPTION 'Flashcard limit exceeded. Maximum % flashcards per user allowed.', max_flashcards;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_flashcard_limit() IS 'Enforces 5000 flashcard limit per user as per technical constraints';

CREATE TRIGGER check_flashcard_limit_trigger
    BEFORE INSERT ON flashcards
    FOR EACH ROW
    EXECUTE FUNCTION check_flashcard_limit();


-- #############################################################################
-- SECTION 4: INDEXES
-- #############################################################################

-- Flashcards indexes
CREATE INDEX idx_flashcards_deck_id ON flashcards(deck_id);
CREATE INDEX idx_flashcards_next_review_date ON flashcards(deck_id, next_review_date);
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);

-- Review sessions indexes
CREATE INDEX idx_review_sessions_user_deck ON review_sessions(user_id, deck_id);
CREATE UNIQUE INDEX idx_one_active_session_per_deck ON review_sessions(user_id, deck_id) WHERE ended_at IS NULL;

-- Review history indexes
CREATE INDEX idx_review_history_flashcard ON review_history(flashcard_id);
CREATE INDEX idx_review_history_reviewed_at ON review_history(reviewed_at);
CREATE INDEX idx_review_history_session ON review_history(session_id);

-- Decks indexes
CREATE INDEX idx_decks_user_id ON decks(user_id);

-- Index comments
COMMENT ON INDEX idx_flashcards_deck_id IS 'Speeds up fetching all flashcards in a deck';
COMMENT ON INDEX idx_flashcards_next_review_date IS 'Optimizes due cards query - most frequently used';
COMMENT ON INDEX idx_flashcards_user_id IS 'Supports RLS policy checks on user_id';
COMMENT ON INDEX idx_review_sessions_user_deck IS 'Supports user statistics and session management';
COMMENT ON INDEX idx_one_active_session_per_deck IS 'Enforces single active session per deck per user';
COMMENT ON INDEX idx_review_history_flashcard IS 'Speeds up flashcard history lookups';
COMMENT ON INDEX idx_review_history_reviewed_at IS 'Supports analytics queries (DAU, etc.)';
COMMENT ON INDEX idx_review_history_session IS 'Speeds up session-based history queries';
COMMENT ON INDEX idx_decks_user_id IS 'Supports RLS policy checks and user deck listing';


-- #############################################################################
-- SECTION 5: ROW LEVEL SECURITY
-- #############################################################################

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_history ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- PROFILES POLICIES
-- -----------------------------------------------------------------------------

CREATE POLICY profiles_select_own ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY profiles_update_own ON profiles
    FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY profiles_insert_own ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY profiles_delete_own ON profiles
    FOR DELETE USING (id = auth.uid());

-- -----------------------------------------------------------------------------
-- DECKS POLICIES
-- -----------------------------------------------------------------------------

CREATE POLICY decks_select_own ON decks
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY decks_insert_own ON decks
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY decks_update_own ON decks
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY decks_delete_own ON decks
    FOR DELETE USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- FLASHCARDS POLICIES
-- -----------------------------------------------------------------------------

CREATE POLICY flashcards_select_own ON flashcards
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY flashcards_insert_own ON flashcards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM decks 
            WHERE decks.id = deck_id 
            AND decks.user_id = auth.uid()
        )
    );

CREATE POLICY flashcards_update_own ON flashcards
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY flashcards_delete_own ON flashcards
    FOR DELETE USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- REVIEW SESSIONS POLICIES
-- -----------------------------------------------------------------------------

CREATE POLICY review_sessions_select_own ON review_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY review_sessions_insert_own ON review_sessions
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM decks 
            WHERE decks.id = deck_id 
            AND decks.user_id = auth.uid()
        )
    );

CREATE POLICY review_sessions_update_own ON review_sessions
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY review_sessions_delete_own ON review_sessions
    FOR DELETE USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- REVIEW HISTORY POLICIES
-- -----------------------------------------------------------------------------

CREATE POLICY review_history_select_own ON review_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM review_sessions 
            WHERE review_sessions.id = session_id 
            AND review_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY review_history_insert_own ON review_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM review_sessions 
            WHERE review_sessions.id = session_id 
            AND review_sessions.user_id = auth.uid()
        ) AND
        EXISTS (
            SELECT 1 FROM flashcards 
            WHERE flashcards.id = flashcard_id 
            AND flashcards.user_id = auth.uid()
        )
    );

CREATE POLICY review_history_delete_own ON review_history
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM review_sessions 
            WHERE review_sessions.id = session_id 
            AND review_sessions.user_id = auth.uid()
        )
    );


-- #############################################################################
-- SECTION 6: VIEWS
-- #############################################################################

-- -----------------------------------------------------------------------------
-- VIEW: deck_statistics
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW deck_statistics AS
SELECT 
    d.id,
    d.user_id,
    d.name,
    d.description,
    COUNT(f.id) AS total_cards,
    COUNT(CASE WHEN f.next_review_date <= CURRENT_DATE THEN 1 END) AS due_cards,
    MAX(rs.ended_at) AS last_reviewed_at,
    d.created_at,
    d.updated_at
FROM decks d
LEFT JOIN flashcards f ON f.deck_id = d.id
LEFT JOIN review_sessions rs ON rs.deck_id = d.id AND rs.ended_at IS NOT NULL
GROUP BY d.id, d.user_id, d.name, d.description, d.created_at, d.updated_at;

COMMENT ON VIEW deck_statistics IS 'Aggregated deck data with card counts and review info for dashboard';

-- -----------------------------------------------------------------------------
-- VIEW: user_statistics
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    p.id AS user_id,
    COUNT(DISTINCT d.id) AS total_decks,
    COUNT(DISTINCT f.id) AS total_flashcards,
    COUNT(DISTINCT CASE WHEN f.creation_method = 'ai' THEN f.id END) AS ai_flashcards,
    COUNT(DISTINCT CASE WHEN f.creation_method = 'manual' THEN f.id END) AS manual_flashcards,
    COUNT(DISTINCT rs.id) AS total_sessions,
    COALESCE(SUM(rs.cards_reviewed), 0) AS total_reviews,
    CASE 
        WHEN COUNT(CASE WHEN f.creation_method = 'ai' THEN 1 END) > 0 THEN
            ROUND(
                COUNT(CASE WHEN f.creation_method = 'ai' AND (f.edit_percentage IS NULL OR f.edit_percentage < 30) THEN 1 END)::DECIMAL /
                COUNT(CASE WHEN f.creation_method = 'ai' THEN 1 END) * 100,
                2
            )
        ELSE NULL
    END AS ai_acceptance_rate,
    CASE 
        WHEN COUNT(f.id) > 0 THEN
            ROUND(
                COUNT(CASE WHEN f.creation_method = 'ai' THEN 1 END)::DECIMAL /
                COUNT(f.id) * 100,
                2
            )
        ELSE NULL
    END AS ai_creation_ratio,
    p.created_at AS member_since
FROM profiles p
LEFT JOIN decks d ON d.user_id = p.id
LEFT JOIN flashcards f ON f.user_id = p.id
LEFT JOIN review_sessions rs ON rs.user_id = p.id
GROUP BY p.id, p.created_at;

COMMENT ON VIEW user_statistics IS 'User-level aggregate statistics including KPIs (AI acceptance rate, AI creation ratio)';

-- -----------------------------------------------------------------------------
-- VIEW: due_flashcards
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW due_flashcards AS
SELECT 
    f.*,
    d.name AS deck_name
FROM flashcards f
JOIN decks d ON d.id = f.deck_id
WHERE f.next_review_date <= CURRENT_DATE
ORDER BY f.next_review_date ASC, f.created_at ASC;

COMMENT ON VIEW due_flashcards IS 'Flashcards due for review today or earlier, ordered by due date';

-- -----------------------------------------------------------------------------
-- VIEW: daily_active_users
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW daily_active_users AS
SELECT 
    DATE(rs.started_at) AS activity_date,
    COUNT(DISTINCT rs.user_id) AS active_users,
    COUNT(rs.id) AS total_sessions,
    SUM(rs.cards_reviewed) AS total_cards_reviewed
FROM review_sessions rs
WHERE rs.ended_at IS NOT NULL
GROUP BY DATE(rs.started_at)
ORDER BY activity_date DESC;

COMMENT ON VIEW daily_active_users IS 'Daily active users based on completed review sessions';


-- #############################################################################
-- MIGRATION COMPLETE
-- #############################################################################
-- 
-- Tables created: profiles, decks, flashcards, review_sessions, review_history
-- Types created: creation_method, review_rating
-- Functions created: update_updated_at_column, handle_new_user, set_flashcard_user_id, check_flashcard_limit
-- Triggers created: 6 total (3 for updated_at, 1 for new user, 1 for user_id sync, 1 for limit)
-- Indexes created: 9 total
-- RLS policies created: 17 total
-- Views created: 4 total
--
-- =============================================================================

