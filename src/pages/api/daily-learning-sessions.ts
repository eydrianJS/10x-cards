import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../db/supabase.server';

// POST /api/daily-learning-sessions - Start new daily learning session
export const POST: APIRoute = async ({ request, cookies }) => {
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

  try {
    const body = await request.json();
    const { lesson_id, deck_ids, daily_new_cards_limit } = body;

    let deckIdsToUse = deck_ids;
    let limit = daily_new_cards_limit || 20;

    // If lesson_id provided, load lesson configuration
    if (lesson_id) {
      const { data: lesson, error: lessonError } = await supabase
        .from('learning_lessons')
        .select('*')
        .eq('id', lesson_id)
        .eq('user_id', user.id)
        .single();

      if (lessonError || !lesson) {
        return new Response(
          JSON.stringify({
            error: 'Learning lesson not found',
            code: 'NOT_FOUND',
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      deckIdsToUse = lesson.deck_ids;
      limit = lesson.daily_new_cards_limit || 20;
    }

    // Validation
    if (!deckIdsToUse || !Array.isArray(deckIdsToUse) || deckIdsToUse.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'At least one deck is required',
          code: 'VALIDATION_ERROR',
          details: { deck_ids: 'Must include at least one deck' },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify all decks belong to the user
    const { data: userDecks, error: decksError } = await supabase
      .from('decks')
      .select('id, name')
      .eq('user_id', user.id)
      .in('id', deckIdsToUse);

    if (decksError || !userDecks || userDecks.length !== deckIdsToUse.length) {
      return new Response(
        JSON.stringify({
          error: 'Invalid deck IDs',
          code: 'VALIDATION_ERROR',
          details: { deck_ids: 'Some decks do not exist or do not belong to you' },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check for active session today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingSessions } = await supabase
      .from('daily_learning_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('started_at', `${today}T00:00:00`)
      .is('ended_at', null);

    if (existingSessions && existingSessions.length > 0) {
      // Resume existing session
      const session = existingSessions[0];

      // Get cards for this session using the stored function
      const { data: cards, error: cardsError } = await supabase.rpc('get_daily_learning_cards', {
        p_user_id: user.id,
        p_deck_ids: session.deck_ids,
        p_new_cards_limit: limit,
      });

      if (cardsError) {
        console.error('Error fetching daily learning cards:', cardsError);
      }

      return new Response(
        JSON.stringify({
          data: {
            session,
            cards: cards || [],
            decks: userDecks,
            is_resumed: true,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create new session
    const { data: session, error: sessionError } = await supabase
      .from('daily_learning_sessions')
      .insert({
        user_id: user.id,
        lesson_id: lesson_id || null,
        deck_ids: deckIdsToUse,
      })
      .select()
      .single();

    if (sessionError || !session) {
      console.error('Error creating daily learning session:', sessionError);
      return new Response(
        JSON.stringify({
          error: 'Failed to create daily learning session',
          code: 'DATABASE_ERROR',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get cards for this session
    const { data: cards, error: cardsError } = await supabase.rpc('get_daily_learning_cards', {
      p_user_id: user.id,
      p_deck_ids: deckIdsToUse,
      p_new_cards_limit: limit,
    });

    if (cardsError) {
      console.error('Error fetching daily learning cards:', cardsError);
    }

    return new Response(
      JSON.stringify({
        data: {
          session,
          cards: cards || [],
          decks: userDecks,
          is_resumed: false,
        },
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in POST /api/daily-learning-sessions:', error);
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
