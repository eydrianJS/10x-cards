-- Migration: 005_create_rls_policies
-- Description: Enable Row Level Security and create policies
-- Date: 2024-12-30
-- Dependencies: 002_create_tables.sql

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_history ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PROFILES POLICIES
-- Users can only access their own profile
-- =============================================================================

-- SELECT: Users can read their own profile
CREATE POLICY profiles_select_own ON profiles
    FOR SELECT
    USING (id = auth.uid());

-- UPDATE: Users can update their own profile
CREATE POLICY profiles_update_own ON profiles
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- INSERT: Handled by trigger, but allow for completeness
CREATE POLICY profiles_insert_own ON profiles
    FOR INSERT
    WITH CHECK (id = auth.uid());

-- DELETE: Users can delete their own profile (triggers cascade)
CREATE POLICY profiles_delete_own ON profiles
    FOR DELETE
    USING (id = auth.uid());

-- =============================================================================
-- DECKS POLICIES
-- Users can only access their own decks
-- =============================================================================

-- SELECT: Users can read their own decks
CREATE POLICY decks_select_own ON decks
    FOR SELECT
    USING (user_id = auth.uid());

-- INSERT: Users can create decks for themselves
CREATE POLICY decks_insert_own ON decks
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own decks
CREATE POLICY decks_update_own ON decks
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own decks
CREATE POLICY decks_delete_own ON decks
    FOR DELETE
    USING (user_id = auth.uid());

-- =============================================================================
-- FLASHCARDS POLICIES
-- Users can only access flashcards in their own decks
-- Uses denormalized user_id for performance
-- =============================================================================

-- SELECT: Users can read their own flashcards
CREATE POLICY flashcards_select_own ON flashcards
    FOR SELECT
    USING (user_id = auth.uid());

-- INSERT: Users can create flashcards in their own decks
-- Note: user_id is set automatically by trigger from deck
CREATE POLICY flashcards_insert_own ON flashcards
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM decks 
            WHERE decks.id = deck_id 
            AND decks.user_id = auth.uid()
        )
    );

-- UPDATE: Users can update their own flashcards
CREATE POLICY flashcards_update_own ON flashcards
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own flashcards
CREATE POLICY flashcards_delete_own ON flashcards
    FOR DELETE
    USING (user_id = auth.uid());

-- =============================================================================
-- REVIEW SESSIONS POLICIES
-- Users can only access their own review sessions
-- =============================================================================

-- SELECT: Users can read their own sessions
CREATE POLICY review_sessions_select_own ON review_sessions
    FOR SELECT
    USING (user_id = auth.uid());

-- INSERT: Users can create sessions for their own decks
CREATE POLICY review_sessions_insert_own ON review_sessions
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM decks 
            WHERE decks.id = deck_id 
            AND decks.user_id = auth.uid()
        )
    );

-- UPDATE: Users can update their own sessions (e.g., end session)
CREATE POLICY review_sessions_update_own ON review_sessions
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own sessions
CREATE POLICY review_sessions_delete_own ON review_sessions
    FOR DELETE
    USING (user_id = auth.uid());

-- =============================================================================
-- REVIEW HISTORY POLICIES
-- Users can only access review history for their own sessions/flashcards
-- =============================================================================

-- SELECT: Users can read history for their own sessions
CREATE POLICY review_history_select_own ON review_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM review_sessions 
            WHERE review_sessions.id = session_id 
            AND review_sessions.user_id = auth.uid()
        )
    );

-- INSERT: Users can add history to their own sessions for their own flashcards
CREATE POLICY review_history_insert_own ON review_history
    FOR INSERT
    WITH CHECK (
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

-- DELETE: Users can delete their own review history
CREATE POLICY review_history_delete_own ON review_history
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM review_sessions 
            WHERE review_sessions.id = session_id 
            AND review_sessions.user_id = auth.uid()
        )
    );

-- Note: UPDATE policy not created for review_history as reviews should be immutable
-- If needed, users should delete and re-create

