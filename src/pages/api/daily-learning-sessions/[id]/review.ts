import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../../db/supabase.server';

// POST /api/daily-learning-sessions/:id/review - Submit a review for a card
export const POST: APIRoute = async ({ params, request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies);

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const { id: sessionId } = params;

  if (!sessionId) {
    return new Response(
      JSON.stringify({
        error: 'Session ID is required',
        code: 'VALIDATION_ERROR',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const body = await request.json();
    const { flashcard_id, rating, was_correct } = body;

    // Validation
    if (!flashcard_id) {
      return new Response(
        JSON.stringify({
          error: 'Flashcard ID is required',
          code: 'VALIDATION_ERROR',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!['again', 'hard', 'good', 'easy'].includes(rating)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid rating',
          code: 'VALIDATION_ERROR',
          details: { rating: 'Must be one of: again, hard, good, easy' },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify session exists and is active
    const { data: session, error: sessionError } = await supabase
      .from('daily_learning_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({
          error: 'Session not found',
          code: 'NOT_FOUND',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (session.ended_at) {
      return new Response(
        JSON.stringify({
          error: 'Session has ended',
          code: 'VALIDATION_ERROR',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get flashcard
    const { data: flashcard, error: flashcardError } = await supabase
      .from('flashcards')
      .select('*, decks!inner(user_id)')
      .eq('id', flashcard_id)
      .single();

    if (flashcardError || !flashcard || flashcard.decks.user_id !== user.id) {
      return new Response(
        JSON.stringify({
          error: 'Flashcard not found',
          code: 'NOT_FOUND',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify flashcard belongs to one of the session's decks
    if (!session.deck_ids.includes(flashcard.deck_id)) {
      return new Response(
        JSON.stringify({
          error: 'Flashcard does not belong to session decks',
          code: 'VALIDATION_ERROR',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if this is a new card (not reviewed today)
    const wasNewCard =
      flashcard.learning_status === 'new' || flashcard.learning_status === 'learning';

    // Apply SM-2 algorithm
    let ef = flashcard.easiness_factor || 2.5;
    let n = flashcard.repetition_count || 0;
    let interval = flashcard.interval || 0;

    switch (rating) {
      case 'again':
        n = 0;
        interval = 1;
        ef = Math.max(1.3, ef - 0.2);
        break;
      case 'hard':
        interval = Math.ceil(interval * 1.2);
        if (interval === 0) interval = 1;
        ef = Math.max(1.3, ef - 0.15);
        break;
      case 'good':
        if (n === 0) interval = 1;
        else if (n === 1) interval = 6;
        else interval = Math.ceil(interval * ef);
        n += 1;
        break;
      case 'easy':
        if (n === 0) interval = 1;
        else if (n === 1) interval = 6;
        else interval = Math.ceil(interval * ef);
        interval = Math.ceil(interval * 1.3);
        ef += 0.15;
        n += 1;
        break;
    }

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    const nextReviewDateStr = nextReviewDate.toISOString().split('T')[0];

    // Update correct_count if user marked as correct
    let correctCount = flashcard.correct_count || 0;
    if (was_correct === true && rating !== 'again') {
      correctCount += 1;
    } else if (rating === 'again') {
      correctCount = 0;
    }

    // Update flashcard
    const { data: updatedFlashcard, error: updateError } = await supabase
      .from('flashcards')
      .update({
        easiness_factor: ef,
        repetition_count: n,
        interval,
        next_review_date: nextReviewDateStr,
        correct_count: correctCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', flashcard_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating flashcard:', updateError);
      return new Response(
        JSON.stringify({
          error: 'Failed to update flashcard',
          code: 'DATABASE_ERROR',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Record progress
    const { error: progressError } = await supabase.from('daily_learning_progress').insert({
      session_id: sessionId,
      flashcard_id,
      rating,
      was_new_card: wasNewCard,
    });

    if (progressError) {
      console.error('Error recording progress:', progressError);
    }

    // Update session stats
    const cardsStudied = session.cards_studied + 1;
    const cardsLearned =
      updatedFlashcard.learning_status === 'learned'
        ? session.cards_learned + 1
        : session.cards_learned;
    const newCardsToday = wasNewCard ? session.new_cards_today + 1 : session.new_cards_today;
    const reviewCardsToday = !wasNewCard
      ? session.review_cards_today + 1
      : session.review_cards_today;

    const { data: updatedSession, error: sessionUpdateError } = await supabase
      .from('daily_learning_sessions')
      .update({
        cards_studied: cardsStudied,
        cards_learned: cardsLearned,
        new_cards_today: newCardsToday,
        review_cards_today: reviewCardsToday,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (sessionUpdateError) {
      console.error('Error updating session:', sessionUpdateError);
    }

    return new Response(
      JSON.stringify({
        data: {
          flashcard: updatedFlashcard,
          session: updatedSession || session,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in POST /api/daily-learning-sessions/:id/review:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
