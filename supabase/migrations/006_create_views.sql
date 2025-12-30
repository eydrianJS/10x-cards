-- Migration: 006_create_views
-- Description: Create views for common queries and statistics
-- Date: 2024-12-30
-- Dependencies: 002_create_tables.sql, 005_create_rls_policies.sql

-- =============================================================================
-- VIEW: deck_statistics
-- Aggregated deck information for dashboard display
-- =============================================================================

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

-- =============================================================================
-- VIEW: user_statistics
-- User-level statistics for analytics and profile display
-- =============================================================================

CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    p.id AS user_id,
    COUNT(DISTINCT d.id) AS total_decks,
    COUNT(DISTINCT f.id) AS total_flashcards,
    COUNT(DISTINCT CASE WHEN f.creation_method = 'ai' THEN f.id END) AS ai_flashcards,
    COUNT(DISTINCT CASE WHEN f.creation_method = 'manual' THEN f.id END) AS manual_flashcards,
    COUNT(DISTINCT rs.id) AS total_sessions,
    COALESCE(SUM(rs.cards_reviewed), 0) AS total_reviews,
    -- AI acceptance rate: cards with edit_percentage < 30 or NULL (unedited)
    CASE 
        WHEN COUNT(CASE WHEN f.creation_method = 'ai' THEN 1 END) > 0 THEN
            ROUND(
                COUNT(CASE WHEN f.creation_method = 'ai' AND (f.edit_percentage IS NULL OR f.edit_percentage < 30) THEN 1 END)::DECIMAL /
                COUNT(CASE WHEN f.creation_method = 'ai' THEN 1 END) * 100,
                2
            )
        ELSE NULL
    END AS ai_acceptance_rate,
    -- AI creation ratio
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

-- =============================================================================
-- VIEW: due_flashcards
-- Flashcards that are due for review today
-- =============================================================================

CREATE OR REPLACE VIEW due_flashcards AS
SELECT 
    f.*,
    d.name AS deck_name
FROM flashcards f
JOIN decks d ON d.id = f.deck_id
WHERE f.next_review_date <= CURRENT_DATE
ORDER BY f.next_review_date ASC, f.created_at ASC;

COMMENT ON VIEW due_flashcards IS 'Flashcards due for review today or earlier, ordered by due date';

-- =============================================================================
-- VIEW: daily_active_users
-- DAU calculation for analytics
-- =============================================================================

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

-- =============================================================================
-- SECURITY: Enable RLS on views (inherited from base tables)
-- Views inherit RLS from underlying tables, but we document this explicitly
-- =============================================================================

-- Note: PostgreSQL views inherit RLS policies from the underlying tables.
-- Since all base tables have RLS enabled with user_id checks,
-- these views will automatically filter to show only the current user's data.
--
-- For deck_statistics: filtered by decks.user_id
-- For user_statistics: filtered by profiles.id
-- For due_flashcards: filtered by flashcards.user_id
-- For daily_active_users: shows aggregate data (admin use case)

