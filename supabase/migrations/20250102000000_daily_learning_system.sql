-- Daily Learning System Migration
-- Adds functionality for daily learning with lessons, progress tracking, and statistics

-- Add learning status to flashcards table
ALTER TABLE flashcards 
ADD COLUMN IF NOT EXISTS learning_status TEXT DEFAULT 'new' CHECK (learning_status IN ('new', 'learning', 'learned')),
ADD COLUMN IF NOT EXISTS correct_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_learned_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_flashcards_learning_status ON flashcards(learning_status);
CREATE INDEX IF NOT EXISTS idx_flashcards_last_learned_at ON flashcards(last_learned_at);

-- Learning Lessons table (saved lesson configurations)
CREATE TABLE IF NOT EXISTS learning_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    deck_ids UUID[] NOT NULL DEFAULT '{}',
    daily_new_cards_limit INTEGER DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_learning_lessons_user_id ON learning_lessons(user_id);

-- Daily Learning Sessions table
CREATE TABLE IF NOT EXISTS daily_learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES learning_lessons(id) ON DELETE SET NULL,
    deck_ids UUID[] NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    cards_studied INTEGER DEFAULT 0,
    cards_learned INTEGER DEFAULT 0,
    new_cards_today INTEGER DEFAULT 0,
    review_cards_today INTEGER DEFAULT 0
);

CREATE INDEX idx_daily_learning_sessions_user_id ON daily_learning_sessions(user_id);
CREATE INDEX idx_daily_learning_sessions_started_at ON daily_learning_sessions(started_at);

-- Daily Learning Progress table (tracks which cards were shown in session)
CREATE TABLE IF NOT EXISTS daily_learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES daily_learning_sessions(id) ON DELETE CASCADE,
    flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    rating TEXT CHECK (rating IN ('again', 'hard', 'good', 'easy')),
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    was_new_card BOOLEAN DEFAULT false
);

CREATE INDEX idx_daily_learning_progress_session_id ON daily_learning_progress(session_id);
CREATE INDEX idx_daily_learning_progress_flashcard_id ON daily_learning_progress(flashcard_id);

-- Daily Statistics view
CREATE OR REPLACE VIEW daily_statistics AS
SELECT 
    f.user_id,
    COUNT(*) FILTER (WHERE f.learning_status = 'new') AS cards_to_learn,
    COUNT(*) FILTER (WHERE f.learning_status = 'learning') AS cards_in_progress,
    COUNT(*) FILTER (WHERE f.learning_status = 'learned') AS cards_learned_total,
    COUNT(*) FILTER (WHERE f.learning_status = 'learned' AND DATE(f.last_learned_at) = CURRENT_DATE) AS cards_learned_today,
    COUNT(*) FILTER (WHERE f.next_review_date <= CURRENT_DATE) AS cards_due_today,
    MAX(dls.started_at)::DATE AS last_study_date,
    (
        SELECT COUNT(DISTINCT DATE(started_at))
        FROM daily_learning_sessions
        WHERE user_id = f.user_id 
        AND started_at >= CURRENT_DATE - INTERVAL '30 days'
    ) AS study_days_last_month
FROM flashcards f
LEFT JOIN daily_learning_sessions dls ON dls.user_id = f.user_id
WHERE f.user_id IS NOT NULL
GROUP BY f.user_id;

-- Function to calculate current streak
CREATE OR REPLACE FUNCTION calculate_study_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_streak INTEGER := 0;
    v_current_date DATE := CURRENT_DATE;
    v_has_session BOOLEAN;
BEGIN
    LOOP
        -- Check if user has a session on current date
        SELECT EXISTS(
            SELECT 1 
            FROM daily_learning_sessions
            WHERE user_id = p_user_id
            AND DATE(started_at) = v_current_date
        ) INTO v_has_session;
        
        IF NOT v_has_session THEN
            -- Allow one day gap for today
            IF v_current_date = CURRENT_DATE THEN
                v_current_date := v_current_date - 1;
                CONTINUE;
            END IF;
            EXIT;
        END IF;
        
        v_streak := v_streak + 1;
        v_current_date := v_current_date - 1;
        
        -- Safety limit
        IF v_streak > 365 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN v_streak;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security Policies

-- learning_lessons
ALTER TABLE learning_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lessons"
    ON learning_lessons FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lessons"
    ON learning_lessons FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lessons"
    ON learning_lessons FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lessons"
    ON learning_lessons FOR DELETE
    USING (auth.uid() = user_id);

-- daily_learning_sessions
ALTER TABLE daily_learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily learning sessions"
    ON daily_learning_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily learning sessions"
    ON daily_learning_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily learning sessions"
    ON daily_learning_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily learning sessions"
    ON daily_learning_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- daily_learning_progress
ALTER TABLE daily_learning_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily learning progress"
    ON daily_learning_progress FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM daily_learning_sessions
            WHERE id = daily_learning_progress.session_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own daily learning progress"
    ON daily_learning_progress FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM daily_learning_sessions
            WHERE id = daily_learning_progress.session_id
            AND user_id = auth.uid()
        )
    );

-- Trigger to update learning_status based on correct_count
CREATE OR REPLACE FUNCTION update_learning_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.correct_count >= 3 AND NEW.learning_status != 'learned' THEN
        NEW.learning_status := 'learned';
        NEW.last_learned_at := NOW();
    ELSIF NEW.correct_count > 0 AND NEW.correct_count < 3 AND NEW.learning_status = 'new' THEN
        NEW.learning_status := 'learning';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_learning_status
    BEFORE UPDATE ON flashcards
    FOR EACH ROW
    WHEN (OLD.correct_count IS DISTINCT FROM NEW.correct_count)
    EXECUTE FUNCTION update_learning_status();

-- Function to get cards for daily learning session
CREATE OR REPLACE FUNCTION get_daily_learning_cards(
    p_user_id UUID,
    p_deck_ids UUID[],
    p_new_cards_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    deck_id UUID,
    deck_name TEXT,
    question TEXT,
    answer TEXT,
    learning_status TEXT,
    correct_count INTEGER,
    next_review_date DATE,
    is_new BOOLEAN,
    is_due BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH new_cards_today AS (
        SELECT COUNT(*) as count
        FROM daily_learning_progress dlp
        JOIN daily_learning_sessions dls ON dlp.session_id = dls.id
        WHERE dls.user_id = p_user_id
        AND DATE(dls.started_at) = CURRENT_DATE
        AND dlp.was_new_card = true
    ),
    available_new_cards AS (
        SELECT 
            f.id,
            f.deck_id,
            d.name as deck_name,
            f.question,
            f.answer,
            f.learning_status,
            f.correct_count,
            f.next_review_date,
            true as is_new,
            false as is_due
        FROM flashcards f
        JOIN decks d ON f.deck_id = d.id
        WHERE f.deck_id = ANY(p_deck_ids)
        AND d.user_id = p_user_id
        AND f.learning_status IN ('new', 'learning')
        AND f.correct_count < 3
        AND NOT EXISTS (
            SELECT 1 FROM daily_learning_progress dlp2
            JOIN daily_learning_sessions dls2 ON dlp2.session_id = dls2.id
            WHERE dlp2.flashcard_id = f.id
            AND DATE(dls2.started_at) = CURRENT_DATE
        )
        ORDER BY RANDOM()
        LIMIT CASE 
            WHEN p_new_cards_limit - (SELECT count FROM new_cards_today) > 0 
            THEN p_new_cards_limit - (SELECT count FROM new_cards_today)
            ELSE 0 
        END
    ),
    due_cards AS (
        SELECT 
            f.id,
            f.deck_id,
            d.name as deck_name,
            f.question,
            f.answer,
            f.learning_status,
            f.correct_count,
            f.next_review_date,
            false as is_new,
            true as is_due
        FROM flashcards f
        JOIN decks d ON f.deck_id = d.id
        WHERE f.deck_id = ANY(p_deck_ids)
        AND d.user_id = p_user_id
        AND f.next_review_date <= CURRENT_DATE
        AND f.learning_status != 'learned'
        ORDER BY f.next_review_date ASC
    )
    SELECT * FROM available_new_cards
    UNION ALL
    SELECT * FROM due_cards
    ORDER BY RANDOM();
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE learning_lessons IS 'Saved lesson configurations with multiple decks';
COMMENT ON TABLE daily_learning_sessions IS 'Daily learning sessions tracking';
COMMENT ON TABLE daily_learning_progress IS 'Individual card progress within daily sessions';
COMMENT ON VIEW daily_statistics IS 'User daily learning statistics';
COMMENT ON FUNCTION calculate_study_streak IS 'Calculates current study streak for a user';
COMMENT ON FUNCTION get_daily_learning_cards IS 'Gets cards for daily learning session with new cards limit';

