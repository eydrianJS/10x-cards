-- Migration: 003_create_functions
-- Description: Create functions and triggers for automation
-- Date: 2024-12-30
-- Dependencies: 002_create_tables.sql

-- =============================================================================
-- FUNCTION: update_updated_at_column
-- Automatically updates the updated_at timestamp on row modification
-- =============================================================================

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

-- =============================================================================
-- FUNCTION: handle_new_user
-- Creates a profile record when a new user registers via Supabase Auth
-- =============================================================================

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

-- =============================================================================
-- FUNCTION: set_flashcard_user_id
-- Syncs user_id from deck when flashcard is created (denormalization)
-- =============================================================================

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

-- =============================================================================
-- FUNCTION: check_flashcard_limit
-- Enforces maximum 5000 flashcards per user
-- =============================================================================

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

